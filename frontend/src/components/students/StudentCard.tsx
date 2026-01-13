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
    <Card className="p-4 space-y-2">
      <h3 className="font-bold text-lg">
        {typeof student.userId === "object" ? student.userId.name : "Unknown"}
      </h3>
      <p className="text-sm">
        <b>Email:</b> {typeof student.userId === "object" ? student.userId.email : "N/A"}
      </p>
      <p className="text-sm"><b>Course:</b> {getCourseName(student)}</p>
      <p className="text-sm"><b>Faculty:</b> {getFacultyName()}</p>
      <p className="text-sm"><b>Overall Grade:</b> {student.overallGrade || "N/A"}</p>
      <p className="text-sm"><b>Average Marks:</b> {student.marks || 0}</p>
      <p className="text-sm"><b>Attendance:</b> {student.attendancePercentage || 0}%</p>
      
      {isAdmin && (
        <div className="flex gap-2 mt-4">
          <Link to={`/students/${studentId}/edit`}>
            <Button variant="outline" size="sm">Edit</Button>
          </Link>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      )}
    </Card>
  );
};
