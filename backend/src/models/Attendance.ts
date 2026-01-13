import mongoose, { Schema, Document } from "mongoose";

export interface AttendanceDoc extends Document {
  studentId: mongoose.Types.ObjectId;
  facultyId: mongoose.Types.ObjectId;
  date: Date;
  status: "present" | "absent" | "late";
  remarks?: string;
  createdAt: Date;
}

const attendanceSchema = new Schema<AttendanceDoc>({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  date: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ["present", "absent", "late"], 
    required: true 
  },
  remarks: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});


export const Attendance = mongoose.model<AttendanceDoc>("Attendance", attendanceSchema);
