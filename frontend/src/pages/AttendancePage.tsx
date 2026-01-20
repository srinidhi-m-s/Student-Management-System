import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/useAuth";
import { fetchStudents, getMyStudentData } from "@/api/studentApi";
import { markAttendance, fetchAttendance, updateAttendance } from "@/api/attendanceApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Student, AttendanceRecord } from "@/types/Student";
import { getStudentId } from "@/types/Student";

export const AttendancePage = () => {
  const { token, user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"calendar" | "overview">("calendar");

  // Load data on component mount and when token changes
  useEffect(() => {
    const loadData = async () => {
      if (!token || !user) return;
      setLoading(true);
      try {
        let studentsData: Student[] = [];

        if (user.role === "student") {
          const myData = await getMyStudentData(token);
          studentsData = [myData];
        } else {
          studentsData = await fetchStudents(token);
        }

        const attendanceData = await fetchAttendance(token);
        setStudents(studentsData);
        setAttendanceRecords(attendanceData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [token, user]);

  const handleMarkAttendance = async (
    studentId: string,
    date: Date,
    status: "present" | "absent" | "late"
  ) => {
    if (!token) return;
    if (!studentId) {
      setError("Invalid student ID");
      return;
    }

    const dateStr = date.toISOString().split("T")[0];
    setSubmitting(`${studentId}-${dateStr}`);
    setError("");
    setSuccess("");

    try {
      const existingRecord = attendanceRecords.find((r) => {
        const rStudentId = getStudentId(r.studentId);
        const rDate = new Date(r.date).toISOString().split("T")[0];
        return rStudentId === studentId && rDate === dateStr;
      });

      if (existingRecord) {
        const updated = await updateAttendance(existingRecord._id, { status }, token);
        setAttendanceRecords((prev) =>
          prev.map((r) => (r._id === existingRecord._id ? updated : r))
        );
      } else {
        const newRecord = await markAttendance({ studentId, date: dateStr, status }, token);
        setAttendanceRecords((prev) => [...prev, newRecord]);
      }

      setSuccess("Attendance updated!");
      setEditingStudent(null);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Attendance error:", err);
      setError(err instanceof Error ? err.message : "Failed to mark attendance");
    } finally {
      setSubmitting(null);
    }
  };


  const attendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    attendanceRecords.forEach((record) => {
      const studentId = getStudentId(record.studentId);
      const dateStr = new Date(record.date).toISOString().split("T")[0];
      map.set(`${studentId}-${dateStr}`, record);
    });
    return map;
  }, [attendanceRecords]);

  const getStudentName = (student: Student) => {
    return typeof student.userId === "object" ? student.userId.name : "Unknown";
  };

  const getAttendanceForDate = (studentId: string, date: Date): AttendanceRecord | undefined => {
    const dateStr = date.toISOString().split("T")[0];
    return attendanceMap.get(`${studentId}-${dateStr}`);
  };

  // Calculate attendance stats for a student
  const getAttendanceStats = (studentId: string) => {
    const studentRecords = attendanceRecords.filter(
      (r) => getStudentId(r.studentId) === studentId
    );
    const total = studentRecords.length;
    const present = studentRecords.filter((r) => r.status === "present").length;
    const absent = studentRecords.filter((r) => r.status === "absent").length;
    const late = studentRecords.filter((r) => r.status === "late").length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, late, percentage };
  };

  // Helper functions for calendar
  const getDaysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  // Render calendar days
  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days: React.JSX.Element[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="bg-gray-50 p-1 min-h-12" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      date.setHours(0, 0, 0, 0);
      const isToday = today.getTime() === date.getTime();
      const isFuture = date > today;
      const isSelected = selectedDate?.getTime() === date.getTime();

      // Count attendance for this day
      const dayAttendance = students.map((s) => getAttendanceForDate(getStudentId(s), date));
      const presentCount = dayAttendance.filter((a) => a?.status === "present").length;
      const absentCount = dayAttendance.filter((a) => a?.status === "absent").length;
      const lateCount = dayAttendance.filter((a) => a?.status === "late").length;

      days.push(
        <div
          key={day}
          onClick={() => !isFuture && setSelectedDate(date)}
          className={`border p-2 text-center min-h-16 flex flex-col items-center justify-start gap-1 transition-all cursor-pointer ${
            isSelected
              ? "bg-gray-400 border-gray-500 text-white"
              : isToday
              ? "bg-gray-200 border-gray-400"
              : isFuture
              ? "bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed"
              : "bg-white hover:bg-gray-100 border-gray-200"
          }`}
        >
          <span className={`font-semibold text-sm ${isSelected ? "text-white" : isToday ? "text-gray-900" : "text-gray-700"}`}>
            {day}
          </span>
          {!isFuture && (presentCount > 0 || absentCount > 0 || lateCount > 0) && (
            <div className="flex gap-1 text-xs">
              {presentCount > 0 && (
                <span className={`px-1 rounded ${isSelected ? "bg-green-400 text-green-900" : "bg-green-100 text-green-700"}`}>
                  {user?.role === "student" ? "P" : presentCount}
                </span>
              )}
              {absentCount > 0 && (
                <span className={`px-1 rounded ${isSelected ? "bg-red-400 text-red-900" : "bg-red-100 text-red-700"}`}>
                  {user?.role === "student" ? "A" : absentCount}
                </span>
              )}
              {lateCount > 0 && (
                <span className={`px-1 rounded ${isSelected ? "bg-yellow-400 text-yellow-900" : "bg-yellow-100 text-yellow-700"}`}>
                  {user?.role === "student" ? "L" : lateCount}
                </span>
              )}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  if (user?.role !== "faculty" && user?.role !== "admin" && user?.role !== "student") {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-red-500">You don't have permission to view this page.</p>
      </div>
    );
  }

  const canEdit = user?.role === "faculty";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg flex items-center justify-center">
            <span className="text-2xl font-bold text-white">📅</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-green-600 bg-clip-text text-transparent">Attendance Management</h1>
            <p className="text-slate-500 mt-2">
              {user?.role === "student"
                ? "View your attendance calendar and records"
                : user?.role === "admin"
                ? "Monitor attendance records of all students"
                : "Mark and manage student attendance"}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 shadow-lg">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="font-semibold">Error Loading Data</p>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* Success Toast Popup */}
        {success && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-xl backdrop-blur-sm flex items-center gap-3">
              <span className="text-xl">✓</span>
              <span className="font-medium">{success}</span>
            </div>
          </div>
        )}

        {/* Tab Navigation - Only for faculty and admin */}
        {user?.role !== "student" && (
          <div className="flex backdrop-blur-sm bg-white/70 rounded-xl border-0 shadow-lg overflow-hidden">
            <button
              onClick={() => setActiveTab("calendar")}
              className={`px-6 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none flex items-center gap-2 ${
                activeTab === "calendar"
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/50'
              }`}
            >
              📅 Calendar
            </button>
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none flex items-center gap-2 ${
                activeTab === "overview"
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/50'
              }`}
            >
              📊 Overview
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-96 backdrop-blur-sm bg-white/70 rounded-xl border-0 shadow-lg">
            <div className="flex items-center gap-3 text-slate-600">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-lg font-medium">Loading attendance data...</p>
            </div>
          </div>
        ) : user?.role === "student" || activeTab === "calendar" ? (
          <div className={`grid grid-cols-1 ${user?.role === "student" ? "" : "lg:grid-cols-3"} gap-6`}>
            {/* Calendar Section */}
            <div className={user?.role === "student" ? "" : "lg:col-span-2"}>
              <Card className="backdrop-blur-sm bg-white/70 border-0 shadow-xl">
                <CardHeader className="pb-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-t-xl border-b border-slate-100/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl text-slate-800 font-semibold">{monthName}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                        className="h-9 w-9 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all"
                      >
                        ←
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentDate(new Date())}
                      >
                        Today
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                      >
                        →
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-7 gap-0 bg-gray-100 border-b">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div key={day} className="text-center font-semibold py-2 text-xs text-gray-700">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-0">{renderCalendarDays()}</div>
                </CardContent>
              </Card>

              {/* Legend */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-2">Calendar Legend (count per day):</p>
                <div className="flex gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-4 bg-green-100 border border-green-300 rounded text-center text-green-700 text-xs">P</span>
                    <span>Present</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-4 bg-red-100 border border-red-300 rounded text-center text-red-700 text-xs">A</span>
                    <span>Absent</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded text-center text-yellow-700 text-xs">L</span>
                    <span>Late</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Selected Date Attendance List - Only for faculty and admin */}
            {user?.role !== "student" && (
            <div className="lg:col-span-1">
              <Card className="shadow-md h-fit">
                <CardHeader className="pb-3 bg-gradient-to-r from-gray-100 to-gray-200 border-b">
                  <CardTitle className="text-lg text-gray-900">
                    {selectedDate
                      ? `Attendance - ${selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                      : "Select a Date"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {selectedDate ? (
                    <div className="space-y-2">
                      {students.map((student) => {
                        const sid = getStudentId(student);
                        const record = getAttendanceForDate(sid, selectedDate);
                        const isEditing = editingStudent === sid;
                        const submittingKey = `${sid}-${selectedDate.toISOString().split("T")[0]}`;

                        return (
                          <div
                            key={sid}
                            className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">{getStudentName(student)}</div>
                              {record ? (
                                <span
                                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                    record.status === "present"
                                      ? "bg-green-100 text-green-700"
                                      : record.status === "absent"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-yellow-100 text-yellow-700"
                                  }`}
                                >
                                  {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-500">No record</span>
                              )}
                            </div>

                            {canEdit && (
                              <div className="relative">
                                {isEditing ? (
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-2 bg-green-50 hover:bg-green-100 border-green-300 text-green-700"
                                      onClick={() => handleMarkAttendance(sid, selectedDate, "present")}
                                      disabled={submitting === submittingKey}
                                    >
                                      P
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-2 bg-red-50 hover:bg-red-100 border-red-300 text-red-700"
                                      onClick={() => handleMarkAttendance(sid, selectedDate, "absent")}
                                      disabled={submitting === submittingKey}
                                    >
                                      A
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-2 bg-yellow-50 hover:bg-yellow-100 border-yellow-300 text-yellow-700"
                                      onClick={() => handleMarkAttendance(sid, selectedDate, "late")}
                                      disabled={submitting === submittingKey}
                                    >
                                      L
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 px-2"
                                      onClick={() => setEditingStudent(null)}
                                    >
                                      ✕
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-3 text-xs"
                                    onClick={() => setEditingStudent(sid)}
                                  >
                                    {record ? "Edit" : "Mark"}
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-8">
                      Click on a date in the calendar to view attendance
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
            )}
          </div>
        ) : (user?.role === "faculty" || user?.role === "admin") && activeTab === "overview" ? (
          /* Student Attendance Overview Tab */
          <Card className="shadow-md">
            <CardHeader className="pb-3 bg-gradient-to-r from-gray-100 to-gray-200 border-b">
              <CardTitle className="text-lg text-gray-900">Student Attendance Overview</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {students.length > 0 ? (
                <div className="space-y-4">
                  {students.map((student) => {
                    const sid = getStudentId(student);
                    const stats = getAttendanceStats(sid);

                    return (
                      <div key={sid} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-medium text-gray-900">{getStudentName(student)}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              ({stats.total} days recorded)
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-gray-700">{stats.percentage}%</span>
                        </div>
                        {/* Custom stacked progress bar showing present/absent/late breakdown */}
                        <div className="flex h-2 rounded-full overflow-hidden bg-gray-200">
                          {stats.total > 0 && (
                            <>
                              {stats.present > 0 && (
                                <div
                                  className="bg-green-500 transition-all"
                                  title={`Present: ${stats.present}`}
                                  // Using inline style for dynamic width calculation
                                  style={{
                                    width: `${(stats.present / stats.total) * 100}%`,
                                  } as React.CSSProperties}
                                />
                              )}
                              {stats.absent > 0 && (
                                <div
                                  className="bg-red-500 transition-all"
                                  title={`Absent: ${stats.absent}`}
                                  // Using inline style for dynamic width calculation
                                  style={{
                                    width: `${(stats.absent / stats.total) * 100}%`,
                                  } as React.CSSProperties}
                                />
                              )}
                              {stats.late > 0 && (
                                <div
                                  className="bg-yellow-500 transition-all"
                                  title={`Late: ${stats.late}`}
                                  // Using inline style for dynamic width calculation
                                  style={{
                                    width: `${(stats.late / stats.total) * 100}%`,
                                  } as React.CSSProperties}
                                />
                              )}
                            </>
                          )}
                        </div>
                        <div className="flex gap-4 mt-2 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Present: {stats.present}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            Absent: {stats.absent}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                            Late: {stats.late}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No students available</p>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
};
