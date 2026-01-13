import type { Course, CourseFormData } from "../types/Course";

const API_URL = "http://localhost:4000";

// Get all courses
export const fetchCourses = async (token: string): Promise<Course[]> => {
  const res = await fetch(`${API_URL}/courses`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch courses");
  return res.json();
};

// Get course by ID
export const fetchCourseById = async (id: string, token: string): Promise<Course> => {
  const res = await fetch(`${API_URL}/courses/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch course");
  return res.json();
};

// Create course (Admin only)
export const createCourse = async (data: CourseFormData, token: string): Promise<Course> => {
  const res = await fetch(`${API_URL}/courses`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to create course");
  }
  return res.json();
};

// Update course (Admin only)
export const updateCourse = async (id: string, data: Partial<CourseFormData>, token: string): Promise<Course> => {
  const res = await fetch(`${API_URL}/courses/${id}`, {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json", 
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to update course");
  }
  return res.json();
};

// Delete course (Admin only)
export const deleteCourse = async (id: string, token: string): Promise<void> => {
  const res = await fetch(`${API_URL}/courses/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete course");
};
