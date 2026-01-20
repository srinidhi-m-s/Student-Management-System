import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/useAuth";
import * as studentApi from "@/api/studentApi";

export const useStudents = (options?: { enabled?: boolean }) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  // Get all students
  const studentsQuery = useQuery({
    queryKey: ["students"],
    queryFn: () => studentApi.fetchStudents(token!),
    enabled: !!token && (options?.enabled !== false),
  });

  // Add student mutation
  const addStudentMutation = useMutation({
    mutationFn: (data: Parameters<typeof studentApi.createStudent>[0]) =>
      studentApi.createStudent(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });

  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof studentApi.updateStudent>[1];
    }) => studentApi.updateStudent(id, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: (id: string) => studentApi.deleteStudent(id, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });

  return {
    // Students data
    data: studentsQuery.data,
    isLoading: studentsQuery.isLoading,
    isError: studentsQuery.isError,
    error: studentsQuery.error,
    refetch: studentsQuery.refetch,

    // Mutations
    addStudent: addStudentMutation.mutate,
    isAdding: addStudentMutation.isPending,
    updateStudent: updateStudentMutation.mutate,
    isUpdating: updateStudentMutation.isPending,
    deleteStudent: deleteStudentMutation.mutate,
    isDeleting: deleteStudentMutation.isPending,
  };
};



