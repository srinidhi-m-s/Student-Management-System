const API_URL = "http://localhost:4000";

export const fetchFacultyList = async (token: string) => {
  const res = await fetch(`${API_URL}/faculty`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch faculty list");
  return res.json();
};

export const getFacultyStudentCount = async (facultyId: string, token: string) => {
  const res = await fetch(`${API_URL}/faculty/${facultyId}/student-count`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to get student count");
  return res.json();
};

export const addFaculty = async (data: { name: string; email: string; password: string }, token: string) => {
  const res = await fetch(`${API_URL}/faculty`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to add faculty");
  return res.json();
};

export const updateFaculty = async (id: string, data: { name?: string; email?: string; password?: string }, token: string) => {
  const res = await fetch(`${API_URL}/faculty/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update faculty");
  return res.json();
};

export const deleteFaculty = async (id: string, token: string, reassignTo?: string) => {
  const res = await fetch(`${API_URL}/faculty/${id}`, {
    method: 'DELETE',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ reassignTo }),
  });
  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.message || data.error || "Failed to delete faculty") as Error & { studentCount?: number };
    if (data.studentCount) {
      error.studentCount = data.studentCount;
    }
    throw error;
  }
  return data;
};
