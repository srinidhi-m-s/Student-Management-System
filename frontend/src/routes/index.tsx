import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { DashBoardPage } from "@/pages/DashBoardPage";
import { StudentPage } from "@/pages/StudentPage";
import { StudentAddPage } from "@/pages/StudentAddPage";
import { StudentEditPage } from "@/pages/StudentEditPage";
import MarksPage from "@/pages/MarksPage";
import CoursesPage from "@/pages/CoursesPage";
import AddCoursePage from "@/pages/AddCoursePage";
import { AttendancePage } from "@/pages/AttendancePage";
import { ProtectedRoute } from "./ProtectedRoute";
import FacultyPage from '../pages/FacultyPage';

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    element: <AppLayout />,
    children: [
      {
        path: "/",
        element: <ProtectedRoute><DashBoardPage /></ProtectedRoute>,
      },
      {
        path: "/dashboard",
        element: <ProtectedRoute><DashBoardPage /></ProtectedRoute>,
      },
      {
        path: "/students",
        element: (
          <ProtectedRoute allowedRoles={["admin", "faculty"]}>
            <StudentPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/students/add",
        element: (
          <ProtectedRoute allowedRoles={["admin"]}>
            <StudentAddPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/students/:id/edit",
        element: (
          <ProtectedRoute allowedRoles={["admin", "faculty"]}>
            <StudentEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/marks",
        element: (
          <ProtectedRoute allowedRoles={["admin", "faculty", "student"]}>
            <MarksPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/courses",
        element: (
          <ProtectedRoute allowedRoles={["admin"]}>
            <CoursesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/courses/add",
        element: (
          <ProtectedRoute allowedRoles={["admin"]}>
            <AddCoursePage />
          </ProtectedRoute>
        ),
      },
      // Add Faculty route (admin only)
      {
        path: '/faculty',
        element: (<ProtectedRoute allowedRoles={["admin"]}>
          <FacultyPage />
        </ProtectedRoute>
        ),
      },
      // Attendance route (faculty, admin, and student)
      {
        path: '/attendance',
        element: (<ProtectedRoute allowedRoles={["admin", "faculty", "student"]}>
          <AttendancePage />
        </ProtectedRoute>
        ),
      },
    ],
  },
]);