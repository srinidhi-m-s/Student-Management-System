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
    <div className="p-6 flex items-center justify-center min-h-screen">
      <StudentForm
        onSubmit={handleSubmit}
        isLoading={isAdding}
        title="Add Student"
        isEditMode={false}
      />
    </div>
  );
};
