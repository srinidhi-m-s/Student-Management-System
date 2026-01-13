import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  getAllMarks, 
  getMarksByStudent, 
  addMarks, 
  updateMarks, 
  deleteMarks,
  type AddMarkData,
  type UpdateMarkData
} from '../api/marksApi';
import { useAuth } from '../context/useAuth';

// Hook to get all marks
export const useMarks = () => {
  const { user, token } = useAuth();
  
  return useQuery({
    queryKey: ['marks'],
    queryFn: async () => {
      const result = await getAllMarks(token!);
      return result || [];
    },
    // Enable for admin, faculty, and student
    enabled: !!user && !!token && (user.role === 'admin' || user.role === 'faculty' || user.role === 'student'),
  });
};

// Hook to get marks by student ID
export const useMarksByStudent = (
  studentId: string,
  params?: { subject?: string; examType?: string }
) => {
  const { user, token } = useAuth();
  
  return useQuery({
    queryKey: ['marks', 'student', studentId, params],
    queryFn: () => getMarksByStudent(studentId, token!, params),
    enabled: !!user && !!token && !!studentId && (user.role === 'admin' || user.role === 'faculty'),
  });
};

// Hook to add marks
export const useAddMarks = () => {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  
  return useMutation({
    mutationFn: (data: AddMarkData) => addMarks(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marks'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

// Hook to update marks
export const useUpdateMarks = () => {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  
  return useMutation({
    mutationFn: ({ markId, data }: { markId: string; data: UpdateMarkData }) => 
      updateMarks(markId, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marks'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

// Hook to delete marks
export const useDeleteMarks = () => {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  
  return useMutation({
    mutationFn: (markId: string) => deleteMarks(markId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marks'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
};