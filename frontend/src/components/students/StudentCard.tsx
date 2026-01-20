import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Student } from "@/types/Student";
import { getStudentId, getCourseName } from "@/types/Student";
import { useStudents } from "@/hooks/useStudents";
import { useAuth } from "@/context/useAuth";

interface StudentCardProps {
  student: Student;
}

export const StudentCard = ({ student }: StudentCardProps) => {
  const { deleteStudent, isDeleting } = useStudents();
  const { user } = useAuth();
  const studentId = getStudentId(student);
  const isAdmin = user?.role === "admin";

  const handleDelete = () => {
    if (confirm("Are you sure?")) {
      deleteStudent(studentId);
    }
  };

  const getFacultyName = () => {
    if (typeof student.facultyId === "object" && student.facultyId) {
      return student.facultyId.name;
    }
    return "N/A";
  };

  return (
    <Card className="group p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-slate-50/50 border-0 shadow-md">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">
              {typeof student.userId === "object" ? student.userId.name?.charAt(0) || "?" : "?"}
            </span>
          </div>
          <div>
            <h3 className="font-bold text-xl text-slate-800 group-hover:text-blue-600 transition-colors">
              {typeof student.userId === "object" ? student.userId.name : "Unknown"}
            </h3>
            <p className="text-sm text-slate-500">
              {typeof student.userId === "object" ? student.userId.email : "N/A"}
            </p>
          </div>
        </div>
        
        {/* Grade Badge */}
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
          student.overallGrade === 'A' ? 'bg-green-100 text-green-700' :
          student.overallGrade === 'B' ? 'bg-blue-100 text-blue-700' :
          student.overallGrade === 'C' ? 'bg-yellow-100 text-yellow-700' :
          'bg-slate-100 text-slate-600'
        }`}>
          {student.overallGrade || "N/A"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Course</p>
            <p className="text-sm font-medium text-slate-700">{getCourseName(student)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Faculty</p>
            <p className="text-sm font-medium text-slate-700">{getFacultyName()}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Marks</p>
            <p className="text-sm font-medium text-slate-700">{student.marks || 0}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Attendance</p>
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    (student.attendancePercentage || 0) >= 75 ? 'bg-green-500' :
                    (student.attendancePercentage || 0) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${student.attendancePercentage || 0}%` }}
                />
              </div>
              <span className="text-sm font-medium text-slate-700">{student.attendancePercentage || 0}%</span>
            </div>
          </div>
        </div>
      </div>
      
      {isAdmin && (
        <div className="flex gap-2 pt-4 border-t border-slate-100">
          <Link to={`/students/${studentId}/edit`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full h-9 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all">
              <span className="mr-1">✏️</span> Edit
            </Button>
          </Link>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 h-9 bg-red-500 hover:bg-red-600 text-white transition-all duration-200 hover:shadow-md"
          >
            <span className="mr-1">🗑️</span>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      )}
    </Card>
  );
};
