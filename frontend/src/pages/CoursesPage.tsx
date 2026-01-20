import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { useCourses } from "../hooks/useCourses";
import { useStudents } from "../hooks/useStudents";
import { useAuth } from "../context/useAuth";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../components/ui/alert-dialog";
import { Plus, BookOpen, Trash2, ChevronDown, Users, Mail } from "lucide-react";
import type { Course } from "../types/Course";

export const CoursesPage = () => {
  const { data: courses = [], isLoading, isError, deleteCourse, isDeleting } = useCourses();
  const { data: students = [] } = useStudents();
  const { user } = useAuth();
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const isAdmin = user?.role === "admin";

  const handleDelete = (id: string) => {
    deleteCourse(id);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="w-8 h-8" />
            Courses
          </h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading courses...</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="w-8 h-8" />
            Courses
          </h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error Loading Courses</h3>
          <p className="text-red-600 mt-1">Failed to load courses. Please try again.</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-3"
            variant="outline"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              Courses
            </h1>
            <p className="text-slate-500 mt-2">Manage and organize academic courses</p>
          </div>
          {isAdmin && (
            <Link to="/courses/add">
              <Button className="gap-2 h-11 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200">
                <Plus className="w-5 h-5" />
                Add Course
              </Button>
            </Link>
          )}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center h-96 backdrop-blur-sm bg-white/70 rounded-xl border-0 shadow-lg">
            <div className="flex items-center gap-3 text-slate-600">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-lg font-medium">Loading courses...</p>
            </div>
          </div>
        )}

        {isError && (
          <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 p-6 rounded-xl shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-semibold text-lg">Error Loading Courses</p>
                <p className="opacity-90 mt-1">Failed to load courses. Please try again.</p>
              </div>
            </div>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-3"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        )}

        {!isLoading && !isError && courses.length === 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <BookOpen className="w-16 h-16 text-slate-300 mb-4" />
              <p className="text-xl font-semibold text-slate-900 mb-2">No courses found</p>
              <p className="text-slate-600 text-center max-w-md mb-6">
                {isAdmin 
                  ? "Start by adding courses to the system." 
                  : "No courses have been added to the system yet."}
              </p>
              {isAdmin && (
                <Link to="/courses/add">
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add First Course
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {!isLoading && !isError && courses.length > 0 && (
          <div className="grid gap-6">
          {courses.map((course: Course) => {
            const courseStudents = students.filter((s: import("../types/Student").Student) =>
              typeof s.courseId === "object" && s.courseId._id === course._id
            );
            const isExpanded = expandedCourseId === course._id;

            return (
              <Card key={course._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 cursor-pointer" onClick={() => setExpandedCourseId(isExpanded ? null : course._id)}>
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl text-gray-900">{course.name}</CardTitle>
                        <Badge variant="secondary">{courseStudents.length} {courseStudents.length === 1 ? 'Student' : 'Students'}</Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        ID: {course._id.slice(-6).toUpperCase()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {isAdmin && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-900 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200"
                              disabled={isDeleting}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Course</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{course.name}"? This action cannot be undone and may affect students enrolled in this course.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(course._id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedCourseId(isExpanded ? null : course._id)}
                        className="text-gray-600 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Subjects Section */}
                <CardContent className="px-6 py-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Subjects ({course.subjects.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {course.subjects.map((subject, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                      Created: {new Date(course.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>

                {/* Enrolled Students Dropdown */}
                {isExpanded && (
                  <CardContent className="bg-gray-50 border-t">
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Enrolled Students</h3>
                        <Badge>{courseStudents.length}</Badge>
                      </div>
                    </div>

                    {courseStudents.length === 0 ? (
                      <p className="text-gray-500 text-center py-6">No students enrolled in this course.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Grade</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Attendance</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {courseStudents.map((student: import("../types/Student").Student) => (
                              <tr key={student._id} className="hover:bg-white transition-colors">
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {typeof student.userId === 'object' ? student.userId.name : 'Unknown'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Mail className="w-3 h-3 text-gray-400" />
                                    {typeof student.userId === 'object' ? student.userId.email : 'N/A'}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <Badge variant="outline">{student.overallGrade || 'N/A'}</Badge>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <div className="flex items-center gap-2">
                                    <div className="w-16">
                                      <Progress 
                                        value={student.attendancePercentage || 0}
                                      />
                                    </div>
                                    <span className="text-xs font-medium">{student.attendancePercentage != null ? `${student.attendancePercentage}%` : 'N/A'}</span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
          </div>
        )}

        {/* Summary Stats */}
        {courses.length > 0 && (
          <Card className="border-0 shadow-sm bg-slate-100">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-slate-500 text-sm font-semibold mb-2">Total Courses</p>
                  <p className="text-3xl font-bold text-slate-800">{courses.length}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-sm font-semibold mb-2">Total Subjects</p>
                  <p className="text-3xl font-bold text-slate-800">{courses.reduce((acc: number, course: Course) => acc + course.subjects.length, 0)}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-sm font-semibold mb-2">Total Students</p>
                  <p className="text-3xl font-bold text-slate-800">{students.length}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-sm font-semibold mb-2">Avg per Course</p>
                  <p className="text-3xl font-bold text-slate-800">{Math.round(students.length / courses.length)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CoursesPage;
