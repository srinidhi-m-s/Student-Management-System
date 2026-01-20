import { Link } from "react-router-dom";
import { StudentList } from "../components/students/StudentList";
import { useStudents } from "../hooks/useStudents";
import { Button } from "@/components/ui/button";
import type { Student } from "@/types/Student";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { useAuth } from "@/context/useAuth";

export const StudentPage = () => {
  const { data, isLoading, isError } = useStudents();
  const { user } = useAuth();
  const [filter, setFilter] = useState("");

  //filter students
  const filteredStudents = useMemo(() => {
    return data
      ? data.filter((student: Student) => {
          const userName = typeof student.userId === 'object' 
            ? student.userId.name 
            : '';
          return userName.toLowerCase().includes(filter.toLowerCase());
        })
      : [];
  }, [data, filter]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/20 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent">
                {user?.role === "faculty" ? "My Students" : "Students"}
              </h1>
              <p className="text-slate-600 mt-1">Manage and view student information</p>
            </div>
          </div>

          {user?.role === "admin" && (
            <Link to="/students/add">
              <Button className="h-12 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 gap-2">
                <span className="text-lg">+</span>
                Add Student
              </Button>
            </Link>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Input
            type="text"
            placeholder="🔍 Search students by name..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-12 pl-4 pr-10 border-slate-200/50 bg-white/50 backdrop-blur-sm focus:bg-white/80 transition-all duration-200 rounded-xl shadow-sm"
          />
          {filter && (
            <button
              onClick={() => setFilter("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center h-96">
            <p className="text-slate-600">Loading students...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 font-medium">⚠️ Failed to load students</p>
          </div>
        )}

        {/* Students List */}
        {data && <StudentList students={filteredStudents} />}
      </div>
    </div>
  );
};
