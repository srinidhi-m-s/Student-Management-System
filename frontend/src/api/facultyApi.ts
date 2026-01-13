const API_URL = "http://localhost:4000";

export const fetchFacultyList = async (token: string) => {
  const res = await fetch(`${API_URL}/faculty`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch faculty list");
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

export const deleteFaculty = async (id: string, token: string) => {
  const res = await fetch(`${API_URL}/faculty/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete faculty");
  return res.json();
};
