import { useEffect, useState } from "react";
import { useAuth } from "@/context/useAuth";
import { fetchStudents } from "@/api/studentApi";
import { markAttendance, fetchAttendance, updateAttendance } from "@/api/attendanceApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Student, AttendanceRecord } from "@/types/Student";
import { getStudentId } from "@/types/Student";

export const AttendancePage = () => {
  const { token, user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Attendance status for each student on selected date
  const [attendanceStatus, setAttendanceStatus] = useState<
    Record<string, "present" | "absent" | "late" | "">
  >({});

  useEffect(() => {
    const loadData = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const [studentsData, attendanceData] = await Promise.all([
          fetchStudents(token),
          fetchAttendance(token),
        ]);
        setStudents(studentsData);
        setAttendanceRecords(attendanceData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [token]);

  // Update attendance status based on selected date
  useEffect(() => {
    const statusMap: Record<string, "present" | "absent" | "late" | ""> = {};
    students.forEach((student) => {
      const studentId = getStudentId(student);
      const record = attendanceRecords.find(
        (r) =>
          getStudentId(r.studentId) === studentId &&
          new Date(r.date).toISOString().split("T")[0] === selectedDate
      );
      statusMap[studentId] = record?.status || "";
    });
    setAttendanceStatus(statusMap);
  }, [selectedDate, students, attendanceRecords]);

  const handleMarkAttendance = async (
    studentId: string,
    status: "present" | "absent" | "late"
  ) => {
    if (!token) return;
    setSubmitting(studentId);
    setError("");
    setSuccess("");

    try {
      // Check if there's an existing record
      const existingRecord = attendanceRecords.find(
        (r) =>
          getStudentId(r.studentId) === studentId &&
          new Date(r.date).toISOString().split("T")[0] === selectedDate
      );

      if (existingRecord) {
        // Update existing record
        const updated = await updateAttendance(existingRecord._id, { status }, token);
        setAttendanceRecords((prev) =>
          prev.map((r) => (r._id === existingRecord._id ? updated : r))
        );
      } else {
        // Create new record
        const newRecord = await markAttendance(
          { studentId, date: selectedDate, status },
          token
        );
        setAttendanceRecords((prev) => [...prev, newRecord]);
      }

      setAttendanceStatus((prev) => ({ ...prev, [studentId]: status }));
      setSuccess("Attendance marked successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark attendance");
    } finally {
      setSubmitting(null);
    }
  };

  const getStudentName = (student: Student) => {
    return typeof student.userId === "object" ? student.userId.name : "Unknown";
  };

  const getStudentEmail = (student: Student) => {
    return typeof student.userId === "object" ? student.userId.email : "";
  };

  if (user?.role !== "faculty" && user?.role !== "admin") {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-red-500">You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Attendance Management</h1>
        <p className="text-gray-600">
          Mark attendance for your assigned students
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded mb-4">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded mb-4">{success}</div>
      )}

      {/* Date Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Date</label>
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-48"
        />
      </div>

      {loading ? (
        <p>Loading students...</p>
      ) : students.length === 0 ? (
        <p className="text-gray-500">No students assigned to you.</p>
      ) : (
        <div className="grid gap-4">
          {students.map((student) => {
            const studentId = getStudentId(student);
            return (
            <Card key={studentId}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{getStudentName(student)}</CardTitle>
                <p className="text-sm text-gray-500">{getStudentEmail(student)}</p>
                <p className="text-sm text-gray-500">Course: {typeof student.courseId === 'object' ? student.courseId.name : student.courseId}</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Status:</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={
                        attendanceStatus[studentId] === "present"
                          ? "default"
                          : "outline"
                      }
                      className={
                        attendanceStatus[studentId] === "present"
                          ? "bg-green-600 hover:bg-green-700"
                          : ""
                      }
                      onClick={() => handleMarkAttendance(studentId, "present")}
                      disabled={submitting === studentId}
                    >
                      Present
                    </Button>
                    <Button
                      size="sm"
                      variant={
                        attendanceStatus[studentId] === "absent"
                          ? "default"
                          : "outline"
                      }
                      className={
                        attendanceStatus[studentId] === "absent"
                          ? "bg-red-600 hover:bg-red-700"
                          : ""
                      }
                      onClick={() => handleMarkAttendance(studentId, "absent")}
                      disabled={submitting === studentId}
                    >
                      Absent
                    </Button>
                    <Button
                      size="sm"
                      variant={
                        attendanceStatus[studentId] === "late"
                          ? "default"
                          : "outline"
                      }
                      className={
                        attendanceStatus[studentId] === "late"
                          ? "bg-yellow-600 hover:bg-yellow-700"
                          : ""
                      }
                      onClick={() => handleMarkAttendance(studentId, "late")}
                      disabled={submitting === studentId}
                    >
                      Late
                    </Button>
                  </div>
                  {submitting === studentId && (
                    <span className="text-sm text-gray-500">Saving...</span>
                  )}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Current Attendance: {student.attendancePercentage || 0}%
                </div>
              </CardContent>
            </Card>
          )})}
        </div>
      )}
    </div>
  );
};
