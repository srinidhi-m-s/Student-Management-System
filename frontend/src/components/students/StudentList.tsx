import type { Student } from "../../types/Student";
import { getStudentId } from "../../types/Student";
import { StudentCard } from "./StudentCard";

interface Props {
  students: Student[];
}

export const StudentList = ({ students }: Props) => {
  if (!students.length) {
    return <p className="text-gray-500 mt-4">No students found.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {students.map((s) => (
        <StudentCard
          key={getStudentId(s)}
          student={s}
        />
      ))}
    </div>
  );
};
