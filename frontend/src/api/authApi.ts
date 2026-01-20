const API_URL = "http://localhost:4000";

export const login = async (email: string, password: string) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Login failed");
  return res.json();
};

export const register = async (email: string, password: string, name: string, role: "admin" | "faculty" | "student" = "student") => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name, role }),
  });
  if (!res.ok) throw new Error("Registration failed");
  return res.json();
};

export const changePassword = async (oldPassword: string, newPassword: string, token: string) => {
  const res = await fetch(`${API_URL}/auth/change-password`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to change password");
  }
  return res.json();
};
