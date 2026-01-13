// src/pages/StudentEditPage.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useStudent } from "@/hooks/useStudent";
import { StudentForm } from "@/components/students/StudentForm";

export const StudentEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: student, isLoading, updateStudent, isUpdating, error } = useStudent(id);

  const handleSubmit = (data: {
    name?: string;
    email?: string;
    course: string;
    facultyId?: string;
    overallGrade?: string;
    marks?: number;
    attendancePercentage?: number;
  }) => {
    if (!id) return;

    // Only send editable fields (exclude name and email for edit mode)
    updateStudent(
      {
        id,
        data: {
          course: data.course,
          facultyId: data.facultyId,
          overallGrade: data.overallGrade,
          marks: data.marks,
          attendancePercentage: data.attendancePercentage,
        },
      },
      {
        onSuccess: () => navigate("/students"),
        onError: (err: Error) => console.error(err.message),
      }
    );
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!student) {
    return <div className="flex items-center justify-center min-h-screen">Student not found</div>;
  }

  return (
    <div className="p-6 flex items-center justify-center min-h-screen">
      <StudentForm
        student={student}
        onSubmit={handleSubmit}
        isLoading={isUpdating}
        error={error?.message}
        title="Edit Student"
        isEditMode={true}
      />
    </div>
  );
};
