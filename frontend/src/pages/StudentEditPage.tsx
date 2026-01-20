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
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <div className="text-lg text-slate-600 flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          Loading student data...
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <div className="text-lg text-slate-600">Student not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-6 flex items-center justify-center">
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
