import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { useCourses } from "../hooks/useCourses";
import { useAuth } from "../context/useAuth";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../components/ui/alert-dialog";
import { Plus, BookOpen, Trash2 } from "lucide-react";
import type { Course } from "../types/Course";

export const CoursesPage = () => {
  const { data: courses = [], isLoading, isError, deleteCourse, isDeleting } = useCourses();
  const { user } = useAuth();
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="w-8 h-8" />
          Courses
        </h1>
        {isAdmin && (
          <Link to="/courses/add">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Course
            </Button>
          </Link>
        )}
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-xl text-gray-600 mb-2">No courses found</p>
            <p className="text-gray-500 text-center max-w-md">
              {isAdmin 
                ? "Start by adding courses to the system." 
                : "No courses have been added to the system yet."}
            </p>
            {isAdmin && (
              <Link to="/courses/add" className="mt-4">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Course
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course: Course) => (
            <Card key={course._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{course.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      ID: {course._id.slice(-6).toUpperCase()}
                    </p>
                  </div>
                  {isAdmin && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-900"
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
                </div>
                
                <div>
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
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400">
                    Created: {new Date(course.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {courses.length > 0 && (
        <div className="mt-6 bg-gray-50 rounded-lg px-6 py-3">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Total Courses: {courses.length}</span>
            <span>
              Total Subjects: {courses.reduce((acc: number, course: Course) => acc + course.subjects.length, 0)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
