import { useEffect, useState } from "react";
import { useAuth } from "@/context/useAuth";
import { getMyStudentData, fetchStudents } from "@/api/studentApi";
import { fetchCourses } from "@/api/courseApi";
import { fetchFacultyList } from "@/api/facultyApi";
import { fetchAttendance } from "@/api/attendanceApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { Student, AttendanceRecord } from "@/types/Student";
import { FaUserGraduate, FaChalkboardTeacher, FaBook, FaClipboardList, FaChartBar } from "react-icons/fa";
import { MdTrendingUp } from "react-icons/md";
import { Link } from "react-router-dom";

export const DashBoardPage = () => {
  const { user, token } = useAuth();
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Dashboard counts
  const [facultyCount, setFacultyCount] = useState(0);
  const [courseCount, setCourseCount] = useState(0);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

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

  // Fetch dashboard counts and analytics
  useEffect(() => {
    const fetchCounts = async () => {
      if (!token) return;
      try {
        // Fetch students
        const students = await fetchStudents(token);
        const studentsArray = Array.isArray(students) ? students : [];
        setAllStudents(studentsArray);
        // setStudentCount(studentsArray.length); // removed unused setter

        // Fetch courses
        const courses = await fetchCourses(token);
        setCourseCount(Array.isArray(courses) ? courses.length : 0);

        // Fetch faculty (only for admin)
        if (user?.role === "admin") {
          const faculty = await fetchFacultyList(token);
          setFacultyCount(Array.isArray(faculty) ? faculty.length : 0);
        }

        // Fetch attendance records for analytics
        if (user?.role === "admin" || user?.role === "faculty") {
          const attendance = await fetchAttendance(token);
          setAttendanceRecords(Array.isArray(attendance) ? attendance : []);
        }
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch dashboard counts");
      }
    };

    fetchCounts();
  }, [token, user?.role]);

  // Calculate analytics for student
  const getStudentAnalytics = () => {
    if (!studentData) return null;
    const attendanceStatus = studentData.attendancePercentage || 0;
    let attendanceLevel = "Low";
    if (attendanceStatus >= 75) attendanceLevel = "Excellent";
    else if (attendanceStatus >= 60) attendanceLevel = "Good";
    else if (attendanceStatus >= 50) attendanceLevel = "Fair";
    
    return { attendanceStatus, attendanceLevel };
  };

  // Helper function to convert grade to numeric value
  const gradeToNumber = (grade: string | undefined): number => {
    if (!grade) return 0;
    switch (grade.toUpperCase()) {
      case 'A': return 5;
      case 'B': return 4;
      case 'C': return 3;
      case 'D': return 2;
      case 'F': return 1;
      default: return 0;
    }
  };

  // Helper function to convert numeric value back to grade
  const numberToGrade = (num: number): string => {
    if (num >= 4.5) return 'A';
    if (num >= 3.5) return 'B';
    if (num >= 2.5) return 'C';
    if (num >= 1.5) return 'D';
    return 'F';
  };

  // Calculate analytics for faculty
  const getFacultyAnalytics = () => {
    const assignedStudents = allStudents.filter(s => 
      typeof s.facultyId === 'object' && s.facultyId._id
    );
    
    const avgAttendance = assignedStudents.length > 0
      ? Math.round(assignedStudents.reduce((sum, s) => sum + (s.attendancePercentage || 0), 0) / assignedStudents.length)
      : 0;

    const avgGradeNumeric = assignedStudents.length > 0
      ? assignedStudents.reduce((sum, s) => sum + gradeToNumber(s.overallGrade), 0) / assignedStudents.length
      : 0;
    const avgGrade = numberToGrade(avgGradeNumeric);

    const lowAttendanceCount = assignedStudents.filter(s => (s.attendancePercentage || 0) < 75).length;
    
    const gradeACount = assignedStudents.filter(s => s.overallGrade === 'A').length;
    const gradeBelowCCount = assignedStudents.filter(s => gradeToNumber(s.overallGrade) < 3).length;

    // Calculate unique days attendance was marked
    const attendanceByDate = attendanceRecords.reduce((acc: Record<string, number>, record) => {
      const date = new Date(record.date).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
    const markedDaysCount = Object.keys(attendanceByDate).length;

    return {
      assignedStudents: assignedStudents.length,
      avgAttendance,
      avgGrade,
      lowAttendanceCount,
      gradeACount,
      gradeBelowCCount,
      markedDaysCount,
    };
  };

  // Calculate analytics for admin
  const getAdminAnalytics = () => {
    const avgAttendance = allStudents.length > 0
      ? Math.round(allStudents.reduce((sum, s) => sum + (s.attendancePercentage || 0), 0) / allStudents.length)
      : 0;

    const lowAttendanceCount = allStudents.filter(s => (s.attendancePercentage || 0) < 75).length;
    
    const avgGradeNumeric = allStudents.length > 0
      ? allStudents.reduce((sum, s) => sum + gradeToNumber(s.overallGrade), 0) / allStudents.length
      : 0;
    const avgGrade = numberToGrade(avgGradeNumeric);

    const gradeACount = allStudents.filter(s => s.overallGrade === 'A').length;
    const gradeBCount = allStudents.filter(s => s.overallGrade === 'B').length;
    const gradeBelowCCount = allStudents.filter(s => gradeToNumber(s.overallGrade) < 3).length;

    const attendanceByDate = attendanceRecords.reduce((acc: Record<string, number>, record) => {
      const date = new Date(record.date).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
    
    const recentAttendanceCount = Object.values(attendanceByDate).length;

    return {
      totalStudents: allStudents.length,
      totalCourses: courseCount,
      totalFaculty: facultyCount,
      avgAttendance,
      lowAttendanceCount,
      avgGrade,
      gradeACount,
      gradeBCount,
      gradeBelowCCount,
      recentAttendanceCount,
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent mb-4">
            Dashboard
          </h1>
          <p className="text-slate-600 text-lg">
            Welcome back, <span className="font-semibold text-blue-600">{user?.name}</span>! 
            <span className="inline-block ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium capitalize">{user?.role}</span>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">⚠️ {error}</p>
          </div>
        )}

        {/* Student Dashboard */}
        {user?.role === "student" && (
          <div className="space-y-8">
            {loading && (
              <div className="flex items-center justify-center h-96">
                <p className="text-slate-600">Loading your details...</p>
              </div>
            )}
            {studentData && (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                          <FaBook className="text-blue-600 text-sm" />
                        </div>
                        Overall Grade
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-slate-900">{studentData.overallGrade || "—"}</div>
                      <p className="text-xs text-slate-500 mt-2">Your academic performance</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                          <FaClipboardList className="text-green-600 text-sm" />
                        </div>
                        Attendance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-slate-900">{studentData.attendancePercentage || 0}%</div>
                      <Badge className={`mt-3 ${(studentData.attendancePercentage || 0) >= 75 ? 'bg-green-100 text-green-700' : (studentData.attendancePercentage || 0) >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'} border-0`}>
                        {getStudentAnalytics()?.attendanceLevel}
                      </Badge>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                          <FaChartBar className="text-purple-600 text-sm" />
                        </div>
                        Total Marks
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-slate-900">{studentData.marks || 0}</div>
                      <p className="text-xs text-slate-500 mt-2">Cumulative score</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                          <FaBook className="text-orange-600 text-sm" />
                        </div>
                        Course
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-semibold text-slate-900 truncate">
                        {typeof studentData.courseId === "object" ? studentData.courseId.name : "—"}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">Enrolled program</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Profile Section */}
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-slate-900">Your Profile</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</p>
                        <p className="text-lg font-semibold text-slate-900 mt-1">{user.name}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</p>
                        <p className="text-lg font-semibold text-slate-900 mt-1 truncate">{user.email}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</p>
                        <p className="text-lg font-semibold text-slate-900 mt-1 capitalize">{user.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Attendance Progress */}
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-slate-900 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <FaClipboardList className="text-green-600" />
                      </div>
                      Attendance Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-slate-700">Attendance Rate</span>
                        <span className="text-sm font-bold text-slate-900">{studentData.attendancePercentage || 0}%</span>
                      </div>
                      <Progress 
                        value={studentData.attendancePercentage || 0}
                        className="h-2"
                      />
                    </div>
                    <div className={`p-4 rounded-lg ${(studentData.attendancePercentage || 0) >= 75 ? 'bg-green-50 border border-green-200' : (studentData.attendancePercentage || 0) >= 60 ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'}`}>
                      <p className={`text-sm font-medium ${(studentData.attendancePercentage || 0) >= 75 ? 'text-green-700' : (studentData.attendancePercentage || 0) >= 60 ? 'text-yellow-700' : 'text-red-700'}`}>
                        {(studentData.attendancePercentage || 0) >= 75
                          ? "✓ Excellent attendance! Keep maintaining this great performance."
                          : (studentData.attendancePercentage || 0) >= 60
                          ? "⚠️ Good attendance, but there's room for improvement."
                          : "⚠️ Low attendance. Please improve your attendance rate to meet the minimum requirement."}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

      {/* Faculty Dashboard */}
      {user?.role === "faculty" && (
        <div className="space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
            <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FaUserGraduate className="text-blue-600 text-sm" />
                  </div>
                  Assigned Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-slate-900">{getFacultyAnalytics()?.assignedStudents}</div>
                <p className="text-xs text-slate-500 mt-2">Under supervision</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <FaClipboardList className="text-green-600 text-sm" />
                  </div>
                  Avg Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-slate-900">{getFacultyAnalytics()?.avgAttendance}%</div>
                <p className="text-xs text-slate-500 mt-2">Class average</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <FaBook className="text-purple-600 text-sm" />
                  </div>
                  Avg Grade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-slate-900">{getFacultyAnalytics()?.avgGrade}</div>
                <p className="text-xs text-slate-500 mt-2">Overall performance</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                    <FaChartBar className="text-orange-600 text-sm" />
              </div>
                  Low Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-orange-600">{getFacultyAnalytics()?.lowAttendanceCount}</div>
                <p className="text-xs text-slate-500 mt-2">Below 75% threshold</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <FaChartBar className="text-indigo-600 text-sm" />
                  </div>
                  Days Marked
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-slate-900">{getFacultyAnalytics()?.markedDaysCount}</div>
                <p className="text-xs text-slate-500 mt-2">Attendance recorded</p>
              </CardContent>
            </Card>
          </div>

          {/* Class Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FaChartBar className="text-purple-500" />
                  Attendance Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Average Attendance</span>
                      <span className="text-sm font-semibold">{getFacultyAnalytics()?.avgAttendance}%</span>
                    </div>
                    <Progress 
                      value={getFacultyAnalytics()?.avgAttendance || 0}
                    />
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">{getFacultyAnalytics()?.assignedStudents}</span> students assigned | 
                      <span className="font-semibold ml-2">{getFacultyAnalytics()?.lowAttendanceCount}</span> students need attention
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FaChartBar className="text-green-500" />
                  Grade Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Average Grade</span>
                      <span className="text-sm font-semibold">{getFacultyAnalytics()?.avgGrade}</span>
                    </div>
                    <Progress 
                      value={(gradeToNumber(getFacultyAnalytics()?.avgGrade) || 0) * 20}
                    />
                  </div>
                  <div className="pt-4 border-t space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Grade A students:</span>
                      <span className="font-semibold text-green-500">{getFacultyAnalytics()?.gradeACount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Below Grade C:</span>
                      <span className="font-semibold text-red-500">{getFacultyAnalytics()?.gradeBelowCCount}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/marks" className="block">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center gap-4">
                  <FaClipboardList className="text-green-500 text-2xl" />
                  <CardTitle>Manage Marks</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">View and manage marks for your students</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/attendance" className="block">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center gap-4">
                  <FaClipboardList className="text-blue-500 text-2xl" />
                  <CardTitle>Mark Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">Record attendance for your students</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      )}

      {/* Admin Dashboard */}
      {user?.role === "admin" && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/students" className="block">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <FaUserGraduate className="text-blue-500" />
                    Total Students
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{getAdminAnalytics()?.totalStudents}</div>
                  <p className="text-xs text-gray-500 mt-1">Enrolled</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/faculty" className="block">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <FaChalkboardTeacher className="text-green-500" />
                    Faculty Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{getAdminAnalytics()?.totalFaculty}</div>
                  <p className="text-xs text-gray-500 mt-1">Active</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/courses" className="block">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <FaBook className="text-purple-500" />
                    Courses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{getAdminAnalytics()?.totalCourses}</div>
                  <p className="text-xs text-gray-500 mt-1">Available</p>
                </CardContent>
              </Card>
            </Link>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <MdTrendingUp className="text-orange-500" />
                  Avg Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{getAdminAnalytics()?.avgAttendance}%</div>
                <p className="text-xs text-gray-500 mt-1">System-wide</p>
              </CardContent>
            </Card>
          </div>

          {/* System Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FaClipboardList className="text-blue-500" />
                  Attendance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">System Average</span>
                      <span className="text-sm font-semibold">{getAdminAnalytics()?.avgAttendance}%</span>
                    </div>
                    <Progress 
                      value={getAdminAnalytics()?.avgAttendance || 0}
                    />
                  </div>
                  <div className="pt-4 border-t space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Students below 75%:</span>
                      <span className="font-semibold text-red-500">{getAdminAnalytics()?.lowAttendanceCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Recent records marked:</span>
                      <span className="font-semibold text-blue-500">{getAdminAnalytics()?.recentAttendanceCount}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Academic Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FaChartBar className="text-purple-500" />
                  Academic Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Average Grade</span>
                      <span className="text-sm font-semibold">{getAdminAnalytics()?.avgGrade}</span>
                    </div>
                    <Progress 
                      value={(gradeToNumber(getAdminAnalytics()?.avgGrade) || 0) * 20}
                    />
                  </div>
                  <div className="pt-4 border-t text-sm text-gray-600">
                    <p>Overall system performance: {getAdminAnalytics()?.avgGrade && ['A', 'B'].includes(getAdminAnalytics()!.avgGrade) ? "✓ Good" : "⚠️ Needs improvement"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Grade Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FaChartBar className="text-green-500" />
                Grade Distribution Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-3">Grade A</p>
                  <div className="text-4xl font-bold text-green-500">{getAdminAnalytics()?.gradeACount}</div>
                  <p className="text-xs text-gray-500 mt-2">Excellent performance</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-3">Grade B</p>
                  <div className="text-4xl font-bold text-blue-500">{getAdminAnalytics()?.gradeBCount}</div>
                  <p className="text-xs text-gray-500 mt-2">Good performance</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-3">Below Grade C</p>
                  <div className="text-4xl font-bold text-red-500">{getAdminAnalytics()?.gradeBelowCCount}</div>
                  <p className="text-xs text-gray-500 mt-2">Needs support</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </div>
  );
};