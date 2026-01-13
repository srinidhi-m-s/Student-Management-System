const API_URL = "http://localhost:4000";

export interface AttendanceData {
  studentId: string;
  date: string;
  status: "present" | "absent" | "late";
  remarks?: string;
}

// Get all attendance records for faculty's students
export const fetchAttendance = async (token: string) => {
  const res = await fetch(`${API_URL}/attendance`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch attendance");
  return res.json();
};

// Get attendance for a specific student
export const fetchStudentAttendance = async (studentId: string, token: string) => {
  const res = await fetch(`${API_URL}/attendance/student/${studentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch student attendance");
  return res.json();
};

// Mark attendance for a single student
export const markAttendance = async (data: AttendanceData, token: string) => {
  const res = await fetch(`${API_URL}/attendance`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to mark attendance");
  return res.json();
};

// Bulk mark attendance
export const markBulkAttendance = async (
  attendanceRecords: Omit<AttendanceData, "date">[],
  date: string,
  token: string
) => {
  const res = await fetch(`${API_URL}/attendance/bulk`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ attendanceRecords, date }),
  });
  if (!res.ok) throw new Error("Failed to mark bulk attendance");
  return res.json();
};

// Update attendance record
export const updateAttendance = async (
  id: string,
  data: { status?: string; remarks?: string },
  token: string
) => {
  const res = await fetch(`${API_URL}/attendance/${id}`, {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json", 
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update attendance");
  return res.json();
};

// Delete attendance record
export const deleteAttendance = async (id: string, token: string) => {
  const res = await fetch(`${API_URL}/attendance/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete attendance");
};
