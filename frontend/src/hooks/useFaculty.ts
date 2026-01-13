import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/useAuth";
import * as facultyApi from "@/api/facultyApi";

export const useFaculty = () => {
  const { user, token } = useAuth();

  // Get faculty list - only for admin users
  const facultyQuery = useQuery({
    queryKey: ["faculty"],
    queryFn: () => facultyApi.fetchFacultyList(token!),
    enabled: !!token && user?.role === "admin", // Only fetch for admin users
  });

  return {
    facultyList: facultyQuery.data || [],
    isLoadingFaculty: facultyQuery.isLoading,
    facultyError: facultyQuery.error,
    refetch: facultyQuery.refetch,
  };
};