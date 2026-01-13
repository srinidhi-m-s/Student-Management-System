import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/useAuth";
import * as courseApi from "@/api/courseApi";
import type { CourseFormData } from "@/types/Course";

export const useCourses = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  // Get all courses
  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: () => courseApi.fetchCourses(token!),
    enabled: !!token,
  });

  // Add course mutation
  const addCourseMutation = useMutation({
    mutationFn: (data: CourseFormData) => courseApi.createCourse(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });

  // Update course mutation
  const updateCourseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CourseFormData> }) =>
      courseApi.updateCourse(id, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });

  // Delete course mutation
  const deleteCourseMutation = useMutation({
    mutationFn: (id: string) => courseApi.deleteCourse(id, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });

  return {
    // Courses data
    data: coursesQuery.data,
    isLoading: coursesQuery.isLoading,
    isError: coursesQuery.isError,
    error: coursesQuery.error,

    // Mutations
    addCourse: addCourseMutation.mutate,
    addCourseAsync: addCourseMutation.mutateAsync,
    isAdding: addCourseMutation.isPending,
    addError: addCourseMutation.error,
    
    updateCourse: updateCourseMutation.mutate,
    isUpdating: updateCourseMutation.isPending,
    
    deleteCourse: deleteCourseMutation.mutate,
    isDeleting: deleteCourseMutation.isPending,
  };
};
