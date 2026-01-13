import { useEffect, useState } from "react";
import { useAuth } from "@/context/useAuth";
import { getMyStudentData, fetchStudents } from "@/api/studentApi";
import { fetchCourses } from "@/api/courseApi";
import { fetchFacultyList } from "@/api/facultyApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Student } from "@/types/Student";
import { FaUserGraduate, FaChalkboardTeacher, FaBook } from "react-icons/fa";
import { Link } from "react-router-dom";

export const DashBoardPage = () => {
  const { user, token } = useAuth();
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Dashboard counts
  const [studentCount, setStudentCount] = useState(0);
  const [facultyCount, setFacultyCount] = useState(0);
  const [courseCount, setCourseCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (user?.role === "student" && token) {
        setLoading(true);
        try {
          const data = await getMyStudentData(token);
          if (isMounted) {
            setStudentData(data);
            setError("");
          }
        } catch (err) {
          if (isMounted) {
            setError(err instanceof Error ? err.message : "Failed to fetch");
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [user?.role, token]);

  // Fetch dashboard counts
  useEffect(() => {
    const fetchCounts = async () => {
      if (!token) return;
      
      try {
        // Only fetch counts for admin/faculty, not for students
        if (user?.role === "admin" || user?.role === "faculty") {
          // Fetch students count
          const students = await fetchStudents(token);
          setStudentCount(Array.isArray(students) ? students.length : 0);
          
          // Fetch courses count
          const courses = await fetchCourses(token);
          setCourseCount(Array.isArray(courses) ? courses.length : 0);
          
          // Fetch faculty count (only for admin)
          if (user?.role === "admin") {
            const faculty = await fetchFacultyList(token);
            setFacultyCount(Array.isArray(faculty) ? faculty.length : 0);
          }
        }
      } catch (err) {
        console.error("Failed to fetch dashboard counts:", err);
      }
    };

    fetchCounts();
  }, [token, user?.role]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome to the Dashboard</h1>
        
      </div>

      {/* Student View */}
      {user?.role === "student" && (
        <div>
          {loading && <p>Loading your details...</p>}
          {error && <p className="text-red-500">{error}</p>}

          {studentData && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Your Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold">{user.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Course</p>
                    <p className="font-semibold">{typeof studentData.courseId === "object" ? studentData.courseId.name : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Overall Grade</p>
                    <p className="font-semibold">
                      {studentData.overallGrade || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Attendance</p>
                    <p className="font-semibold">
                      {studentData.attendancePercentage || 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Admin View */}
      {user?.role === "admin" && (
        <div>
          <p className="text-lg mb-4">Welcome Admin! {user.name}</p>
        </div>
      )}

      {/* Faculty View */}
      {user?.role === "faculty" && (
        <div className="mb-6">
          <p className="text-lg mb-4">Welcome Faculty! {user.name}</p>
          <p className="text-gray-600">
            You can manage attendance and marks for your assigned students.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {user?.role !== "student" && (
          <Link to="/students" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-4">
                <FaUserGraduate className="text-blue-500 text-3xl" />
                <CardTitle>Students</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-4xl font-bold">{studentCount}</span>
                <p className="text-gray-500">Total enrolled</p>
              </CardContent>
            </Card>
          </Link>
        )}
        {user?.role !== "student" && user?.role !== "faculty" && (
          <Link to="/faculty" className="block">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center gap-4">
                <FaChalkboardTeacher className="text-green-500 text-3xl" />
                <CardTitle>Teachers</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-4xl font-bold">{facultyCount}</span>
                <p className="text-gray-500">Active staff</p>
              </CardContent>
            </Card>
          </Link>
        )}
      
        {user?.role !== "student" && (
          <Link to="/courses" className="block">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center gap-4">
                <FaBook className="text-purple-500 text-3xl" />
                <CardTitle>Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-4xl font-bold">{courseCount}</span>
                <p className="text-gray-500">Available</p>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
};