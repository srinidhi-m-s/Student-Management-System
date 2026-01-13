const API_URL = "http://localhost:4000";

export interface Mark {
  _id: string;
  studentId: {
    _id: string;
    userId: {
      _id: string;
      name: string;
      email: string;
    };
    courseId: {
      _id: string;
      name: string;
      subjects: string[];
    } | string;
  };
  subject: string;
  examType: string;
  maxMarks: number;
  marksObtained: number;
  percentage: number;
  grade: string;
  examDate: string;
  // remarks field removed
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AddMarkData {
  studentId: string;
  subject: string;
  examType: string;
  maxMarks: number;
  marksObtained: number;
  examDate: string;
  // remarks field removed
}

export interface UpdateMarkData {
  subject?: string;
  examType?: string;
  maxMarks?: number;
  marksObtained?: number;
  examDate?: string;
  // remarks field removed
}

// Get all marks (Admin sees all, Faculty sees only the marks created by them)
export const getAllMarks = async (token: string): Promise<Mark[]> => {
  
  const res = await fetch(`${API_URL}/marks`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error('API error response:', errorText);
    throw new Error(`Failed to fetch marks: ${res.status} ${errorText}`);
  }
  const data = await res.json();
  return data;
};

// Get marks by student ID
export const getMarksByStudent = async (
  studentId: string,
  token: string,
  params?: { subject?: string; examType?: string }
): Promise<Mark[]> => {
  const queryString = params 
    ? '?' + new URLSearchParams(
        Object.entries(params).filter(([, value]) => value !== undefined)
      ).toString()
    : '';
  
  const res = await fetch(`${API_URL}/marks/student/${studentId}${queryString}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch student marks");
  return res.json();
};

// Add marks (Faculty only)
export const addMarks = async (markData: AddMarkData, token: string): Promise<Mark> => {
  const res = await fetch(`${API_URL}/marks`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(markData),
  });
  if (!res.ok) throw new Error("Failed to add marks");
  return res.json();
};

// Update marks (Faculty can only update marks they created)
export const updateMarks = async (markId: string, updateData: UpdateMarkData, token: string): Promise<Mark> => {
  const res = await fetch(`${API_URL}/marks/${markId}`, {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json", 
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(updateData),
  });
  if (!res.ok) throw new Error("Failed to update marks");
  return res.json();
};

// Delete marks (Faculty can only delete marks they created)
export const deleteMarks = async (markId: string, token: string): Promise<void> => {
  const res = await fetch(`${API_URL}/marks/${markId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete marks");
};
