import { useNavigate } from "react-router-dom";
import { useStudents } from "@/hooks/useStudents";
import { StudentForm } from "@/components/students/StudentForm";

export const StudentAddPage = () => {
  const navigate = useNavigate();
  const { addStudent, isAdding } = useStudents();

  const handleSubmit = (data: {
    name?: string;
    email?: string;
    course: string;
    facultyId?: string;
    overallGrade?: string;
    marks?: number;
    attendancePercentage?: number;
  }) => {
    addStudent(data, {
      onSuccess: () => navigate("/students"),
      onError: (err: Error) => console.error(err.message),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-6 flex items-center justify-center">
      <StudentForm
        onSubmit={handleSubmit}
        isLoading={isAdding}
        title="Add New Student"
        isEditMode={false}
      />
    </div>
  );
};
