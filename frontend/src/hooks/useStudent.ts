import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchStudentById, updateStudent } from "../api/studentApi";
import { useAuth } from "@/context/useAuth";
import type { Student } from "@/types/Student";

export const useStudent = (id: string | undefined) => {
  const queryClient = useQueryClient();
  const { token } = useAuth();

  const studentQuery = useQuery({
    queryKey: ["student", id],
    queryFn: () => fetchStudentById(id!, token!),
    enabled: !!id && !!token,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Student> }) =>
      updateStudent(id, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["student", id] });
    },
  });

  return {
    data: studentQuery.data,
    isLoading: studentQuery.isLoading,
    error: studentQuery.error,
    updateStudent: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
};