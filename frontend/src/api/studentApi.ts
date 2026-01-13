const API_URL = "http://localhost:4000";

interface StudentFormData {
  name?: string;
  email?: string;
  courseId: string;
  facultyId?: string;
  overallGrade?: string;
  marks?: number;
  attendancePercentage?: number;
}

export const fetchStudents = async (token: string) => {
  const res = await fetch(`${API_URL}/students`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch students");
  return res.json();
};

export const fetchStudentById = async (id: string, token: string) => {
  const res = await fetch(`${API_URL}/students/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch student");
  return res.json();
};

export const createStudent = async (data: StudentFormData, token: string) => {
  const res = await fetch(`${API_URL}/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create student");
  return res.json();
};

export const updateStudent = async (id: string, data: object, token: string) => {
  const res = await fetch(`${API_URL}/students/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update student");
  return res.json();
};

export const deleteStudent = async (id: string, token: string) => {
  const res = await fetch(`${API_URL}/students/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete student");
};
//students can view only their data
export const getMyStudentData = async (token: string) => {
  const res = await fetch("http://localhost:4000/students/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch student data");
  return res.json();
};

// Faculty list for admin to assign students
export const fetchFacultyList = async (token: string) => {
  const res = await fetch(`${API_URL}/students/faculty-list`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch faculty list");
  return res.json();
};




