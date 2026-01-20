import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/context/useAuth";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { BookOpen, Users, BarChart3, GraduationCap, LogOut, Lock } from "lucide-react";

export const Navbar = () => {
  const { user, logout, token } = useAuth();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  // Show change password for faculty and student
  const canChangePassword = user?.role === "faculty" || user?.role === "student";

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/50 shadow-sm">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:shadow-lg transition-all duration-200 group-hover:scale-105">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">SMS</p>
            <p className="text-xs text-slate-500 -mt-1">Management</p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {(user?.role === "admin" || user?.role === "faculty") && (
            <Link to="/students">
              <Button variant="ghost"  className="bg-gray-200 text-black hover:text-white hover:bg-gray-600 cursor-pointer">
                <Users className="w-4 h-4 mr-2" />
                Students
              </Button>
            </Link>
          )}

          {(user?.role === "admin" || user?.role === "faculty" || user?.role === "student") && (
            <Link to="/marks">
              <Button variant="ghost"  className="bg-gray-200 text-black hover:text-white hover:bg-gray-600 cursor-pointer">
                <BarChart3 className="w-4 h-4 mr-2" />
                Marks
              </Button>
            </Link>
          )}

          {user?.role === "admin" && (
            <Link to="/courses">
              <Button variant="ghost"  className="bg-gray-200 text-black hover:text-white hover:bg-gray-600 cursor-pointer">
                <BookOpen className="w-4 h-4 mr-2" />
                Courses
              </Button>
            </Link>
          )}

          {user?.role === "admin" && (
            <Link to="/faculty">
              <Button variant="ghost"  className="bg-gray-200 text-black hover:text-white hover:bg-gray-600 cursor-pointer">
                <Users className="w-4 h-4 mr-2" />
                Faculty
              </Button>
            </Link>
          )}

          {/* Attendance visible to faculty, admin and students */}
          {(user?.role === "admin" || user?.role === "faculty" || user?.role === "student") && (
            <Link to="/attendance">
              <Button variant="ghost"  className="bg-gray-200 text-black hover:text-white hover:bg-gray-600 cursor-pointer">
                <BarChart3 className="w-4 h-4 mr-2" />
                Attendance
              </Button>
            </Link>
          )}
        </nav>
        
        {/* User Info & Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium capitalize border border-blue-100">
              {user?.role?.charAt(0).toUpperCase()}{user?.role?.slice(1)}
            </div>
          </div>

          {canChangePassword && (
            <Button 
              size="sm" 
              variant="ghost"
              className="w-10 h-10 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
              onClick={() => setIsPasswordDialogOpen(true)}
            >
              <Lock className="w-4 h-4" />
            </Button>
          )}

          <Button 
            size="sm" 
            variant="ghost"
            className="w-10 h-10 p-0 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"    
            onClick={logout}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Change Password Dialog */}
      {canChangePassword && (
        <ChangePasswordDialog
          isOpen={isPasswordDialogOpen}
          token={token || ""}
          onClose={() => setIsPasswordDialogOpen(false)}
        />
      )}
    </header>
  );
};
