import { Request, Response } from "express";
import { Attendance } from "../models/Attendance.js";
import { Student } from "../models/Student.js";

const normalizeDateToUTC = (dateString: string): Date => {

  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  return date;
};


const facultyHasAccess = async (facultyUserId: string, studentId: string): Promise<boolean> => {
  const student = await Student.findById(studentId);
  
  if (!student) {
    return false;
  }
  const studentFacultyId = student.facultyId?.toString();
  const requestingFacultyId = facultyUserId?.toString();
  
  return studentFacultyId === requestingFacultyId;
};


export const getAttendanceByFaculty = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    let studentIds: any[] = [];

    if (user.role === "admin") {
      const students = await Student.find({});
      studentIds = students.map(s => s._id);
    } else if (user.role === "faculty") {
      const students = await Student.find({ facultyId: user.id });
      studentIds = students.map(s => s._id);
    } else if (user.role === "student") {
      const student = await Student.findOne({ userId: user.id });
      if (student) {
        studentIds = [student._id];
      }
    }

    const attendance = await Attendance.find({ studentId: { $in: studentIds } })
      .populate({
        path: "studentId",
        populate: { path: "userId", select: "name email" }
      })
      .sort({ date: -1 });
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch attendance records" });
  }
};

export const getStudentAttendance = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const user = (req as any).user;
    if (user.role === "faculty") {
      const hasAccess = await facultyHasAccess(user.id, studentId);
      if (!hasAccess) {
        return res.status(403).json({ message: "You don't have access to this student" });
      }
    }
    
    const attendance = await Attendance.find({ studentId })
      .populate({
        path: "studentId",
        populate: { path: "userId", select: "name email" }
      })
      .sort({ date: -1 });
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch student attendance" });
  }
};

export const markAttendance = async (req: Request, res: Response) => {
  try {
    const { studentId, date, status, remarks } = req.body;
    const facultyUserId = (req as any).user.id;

    if (!studentId || !date || !status) {
      return res.status(400).json({ message: "Missing required fields: studentId, date, status" });
    }
    const hasAccess = await facultyHasAccess(facultyUserId, studentId);
    
    if (!hasAccess) {
      return res.status(403).json({ 
        message: "You don't have access to this student",
        debug: { facultyUserId, studentId }
      });
    }
    const attendanceDate = normalizeDateToUTC(date);
    const existingAttendance = await Attendance.findOne({
      studentId,
      date: attendanceDate
    });
    
    if (existingAttendance) {
      return res.status(409).json({ message: "Attendance already marked for this date. Use PUT to update." });
    }
    
    const attendance = new Attendance({
      studentId,
      facultyId: facultyUserId,
      date: attendanceDate,
      status,
      remarks
    });
    
    await attendance.save();
    
    await updateAttendancePercentage(studentId);
    
    const populatedAttendance = await attendance.populate({
      path: "studentId",
      populate: { path: "userId", select: "name email" }
    });
    
    res.status(201).json(populatedAttendance);
  } catch (error) {
    console.error("Mark attendance error:", error);
    res.status(500).json({ message: "Failed to mark attendance", error: (error as Error).message });
  }
};


export const updateAttendance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    const facultyUserId = (req as any).user.id;
    
    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    const hasAccess = await facultyHasAccess(facultyUserId, attendance.studentId.toString());
    if (!hasAccess) {
      return res.status(403).json({ message: "You don't have access to this record" });
    }
    
    attendance.status = status || attendance.status;
    attendance.remarks = remarks !== undefined ? remarks : attendance.remarks;
    await attendance.save();
    
    await updateAttendancePercentage(attendance.studentId.toString());
    
    const populatedAttendance = await attendance.populate({
      path: "studentId",
      populate: { path: "userId", select: "name email" }
    });
    
    res.json(populatedAttendance);
  } catch (error) {
    res.status(500).json({ message: "Failed to update attendance" });
  }
};
export const deleteAttendance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    
    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }
    if (user.role === "faculty") {
      const hasAccess = await facultyHasAccess(user.id, attendance.studentId.toString());
      if (!hasAccess) {
        return res.status(403).json({ message: "You don't have access to this record" });
      }
    }
    
    const studentId = attendance.studentId.toString();
    await Attendance.findByIdAndDelete(id);
    
    await updateAttendancePercentage(studentId);
    
    res.json({ message: "Attendance record deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete attendance" });
  }
};

const updateAttendancePercentage = async (studentId: string) => {
  const attendanceRecords = await Attendance.find({ studentId });
  
  if (attendanceRecords.length === 0) {
    await Student.findByIdAndUpdate(studentId, { attendancePercentage: 0 });
    return;
  }
  
  const presentCount = attendanceRecords.filter(
    a => a.status === "present" || a.status === "late"
  ).length;
  
  const percentage = Math.round((presentCount / attendanceRecords.length) * 100);
  await Student.findByIdAndUpdate(studentId, { attendancePercentage: percentage });
};

export const getFacultyList = async (req: Request, res: Response) => {
  try {
    const { User } = await import("../models/User.js");
    const faculty = await User.find({ role: "faculty" }).select("_id name email");
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch faculty list" });
  }
};
