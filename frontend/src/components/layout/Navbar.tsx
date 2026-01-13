import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/useAuth";

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-background border-b">
      <div className="container mx-auto flex p-4 h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="text-2xl font-bold text-black p-4">
          Student Management System
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6">
          {/* Students list only for admin/faculty */}
          {(user?.role === "admin" || user?.role === "faculty") && (
            <Link to="/students" className="text-sm font-medium text-black p-4">
              Students
            </Link>
          )}

          {/* Marks visible to admin, faculty and students */}
          {(user?.role === "admin" || user?.role === "faculty" || user?.role === "student") && (
            <Link to="/marks" className="text-sm font-medium text-black p-4">
              Marks
            </Link>
          )}

          {/* Courses visible to admin only */}
          {user?.role === "admin" && (
            <Link to="/courses" className="text-sm font-medium text-black p-4">
              Courses
            </Link>
          )}

          {user?.role === "admin" && (
            <Link to="/faculty" className="text-sm font-medium text-black p-4">
              Faculty
            </Link>
          )}
          {/* Remove attendance link for now since we're only implementing marks */}
          
          {/* User Info */}
          <div className="flex items-center gap-4">
            <Badge variant="secondary">
              Welcome! {user?.name || "Guest"} ({user?.role})
            </Badge>
            <Button size="sm" variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
};
