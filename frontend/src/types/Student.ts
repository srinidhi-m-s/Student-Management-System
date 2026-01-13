export interface UserInfo {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export interface FacultyInfo {
  _id: string;
  name: string;
  email: string;
}

export interface CourseInfo {
  _id: string;
  name: string;
  subjects: string[];
}

export interface Student {
  _id?: string;
  id?: string;  // Backend returns 'id' from formatStudent
  userId: string | UserInfo;
  courseId: string | CourseInfo;
  facultyId: string | FacultyInfo;
  overallGrade?: string;
  marks?: number;
  attendancePercentage?: number;
  createdAt: Date;
}

// Helper to get student ID regardless of which field is used
export const getStudentId = (student: Student): string => {
  return student.id || student._id || "";
};

// Helper to get course name
export const getCourseName = (student: Student): string => {
  if (typeof student.courseId === "object" && student.courseId) {
    return student.courseId.name;
  }
  return "N/A";
};

export interface AttendanceRecord {
  _id: string;
  studentId: Student;
  facultyId: string;
  date: string;
  status: "present" | "absent" | "late";
  // remarks field removed
  createdAt: Date;
}