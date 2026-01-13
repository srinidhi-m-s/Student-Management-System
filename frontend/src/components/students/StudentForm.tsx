import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import type { Student } from "@/types/Student";
import { useFaculty } from "@/hooks/useFaculty";
import { useCourses } from "@/hooks/useCourses";
import type { Course } from "@/types/Course";

interface StudentFormProps {
  student?: Student & { userId?: { name: string; email: string; role: string } };
  onSubmit: (data: {
    name?: string;
    email?: string;
    courseId: string;
    facultyId?: string;
    overallGrade?: string;
    marks?: number;
    attendancePercentage?: number;
  }) => void;
  isLoading?: boolean;
  error?: string;
  title: string;
  isEditMode?: boolean;
}

interface FormData {
  name: string;
  email: string;
  courseId: string;
  facultyId: string;
  overallGrade: string;
  marks: number | "";
  attendancePercentage: number | "";
}

interface Faculty {
  _id: string;
  name: string;
  email: string;
}

export const StudentForm = ({
  student,
  onSubmit,
  isLoading,
  error,
  title,
  isEditMode = false,
}: StudentFormProps) => {
  const { facultyList, isLoadingFaculty } = useFaculty();
  const { data: courses = [], isLoading: isLoadingCourses } = useCourses();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: "",
      email: "",
      courseId: "",
      facultyId: "",
      overallGrade: "",
      marks: 0,
      attendancePercentage: 0,
    },
  });

  useEffect(() => {
    if (student) {
      const userName =
        typeof student.userId === "object" ? student.userId.name : "";
      const userEmail =
        typeof student.userId === "object" ? student.userId.email : "";
      const courseId = typeof student.courseId === "object" ? student.courseId._id : student.courseId || "";
      const facultyId = typeof student.facultyId === "object" ? student.facultyId._id : student.facultyId || "";

      reset({
        name: userName,
        email: userEmail,
        courseId: courseId,
        facultyId: facultyId,
        overallGrade: student.overallGrade || "",
        marks: student.marks || 0,
        attendancePercentage: student.attendancePercentage || 0,
      });
    }
  }, [student, reset]);

  const onFormSubmit = (formData: FormData) => {
    const submitData = isEditMode
      ? {
          courseId: formData.courseId,
          facultyId: formData.facultyId || undefined,
          overallGrade: formData.overallGrade || undefined,
          marks: formData.marks ? Number(formData.marks) : undefined,
          attendancePercentage: formData.attendancePercentage
            ? Number(formData.attendancePercentage)
            : undefined,
        }
      : {
          name: formData.name,
          email: formData.email,
          courseId: formData.courseId,
          facultyId: formData.facultyId,
          overallGrade: formData.overallGrade || undefined,
          marks: formData.marks ? Number(formData.marks) : undefined,
          attendancePercentage: formData.attendancePercentage
            ? Number(formData.attendancePercentage)
            : undefined,
        };

    onSubmit(submitData);
  };

  return (
    <Card className="w-full max-w-md p-6">
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      {error && (
        <div className="text-red-500 mb-4 p-2 bg-red-50 rounded">{error}</div>
      )}
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {isEditMode && student ? (
          <>
            <div>
              <label className="block text-sm font-medium">Name</label>
              <Input
                {...register("name")}
                disabled
                className="bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <Input
                {...register("email")}
                disabled
                className="bg-gray-100"
              />
            </div>
            <p className="text-xs text-gray-500">User info is read-only</p>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                {...register("name", { required: "Name is required" })}
                placeholder="Enter student name"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
                placeholder="Enter email"
                type="email"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium">
            Course <span className="text-red-500">*</span>
          </label>
          <select
            {...register("courseId", { required: "Course is required" })}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading || isLoadingCourses}
          >
            <option value="">Select Course</option>
            {courses?.map((course: Course) => (
              <option key={course._id} value={course._id}>
                {course.name}
              </option>
            ))}
          </select>
          {errors.courseId && (
            <p className="text-red-500 text-sm mt-1">{errors.courseId.message}</p>
          )}
          {isLoadingCourses && (
            <p className="text-gray-500 text-sm mt-1">Loading courses...</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">
            Faculty <span className="text-red-500">*</span>
          </label>
          <select
            {...register("facultyId", { required: "Faculty is required" })}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading || isLoadingFaculty}
          >
            <option value="">Select Faculty</option>
            {facultyList?.map((faculty: Faculty) => (
              <option key={faculty._id} value={faculty._id}>
                {faculty.name} ({faculty.email})
              </option>
            ))}
          </select>
          {errors.facultyId && (
            <p className="text-red-500 text-sm mt-1">{errors.facultyId.message}</p>
          )}
          {isLoadingFaculty && (
            <p className="text-gray-500 text-sm mt-1">Loading faculty...</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Overall Grade</label>
          <Input
            {...register("overallGrade")}
            placeholder="e.g., A"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Marks</label>
          <Input
            {...register("marks", {
              min: { value: 0, message: "Minimum is 0" },
              max: { value: 100, message: "Maximum is 100" },
            })}
            type="number"
            placeholder="0-100"
            disabled={isLoading}
          />
          {errors.marks && (
            <p className="text-red-500 text-sm mt-1">{errors.marks.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">
            Attendance Percentage
          </label>
          <Input
            {...register("attendancePercentage", {
              min: { value: 0, message: "Minimum is 0" },
              max: { value: 100, message: "Maximum is 100" },
            })}
            type="number"
            placeholder="0-100"
            disabled={isLoading}
          />
          {errors.attendancePercentage && (
            <p className="text-red-500 text-sm mt-1">
              {errors.attendancePercentage.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save"}
        </Button>
      </form>
    </Card>
  );
};
