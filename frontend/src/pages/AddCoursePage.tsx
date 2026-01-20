import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { useCourses } from "../hooks/useCourses";
import { useAuth } from "../context/useAuth";
import { BookOpen, Plus, X, ArrowLeft } from "lucide-react";

export const AddCoursePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addCourseAsync, isAdding, addError } = useCourses();
  
  const [name, setName] = useState("");
  const [subjects, setSubjects] = useState<string[]>([""]);
  const [error, setError] = useState<string | null>(null);

  // Only admin can access this page
  if (user?.role !== "admin") {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="w-16 h-16 text-red-400 mb-4" />
            <p className="text-xl text-red-600 mb-2">Access Denied</p>
            <p className="text-gray-500 text-center max-w-md">
              Only administrators can add courses.
            </p>
            <Button onClick={() => navigate("/courses")} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Courses
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const addSubjectField = () => {
    setSubjects([...subjects, ""]);
  };

  const removeSubjectField = (index: number) => {
    if (subjects.length > 1) {
      const newSubjects = subjects.filter((_, i) => i !== index);
      setSubjects(newSubjects);
    }
  };

  const updateSubject = (index: number, value: string) => {
    const newSubjects = [...subjects];
    newSubjects[index] = value;
    setSubjects(newSubjects);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    if (!name.trim()) {
      setError("Course name is required");
      return;
    }

    const validSubjects = subjects.filter(s => s.trim());
    if (validSubjects.length === 0) {
      setError("At least one subject is required");
      return;
    }

    try {
      await addCourseAsync({
        name: name.trim(),
        subjects: validSubjects.map(s => s.trim()),
      });
      navigate("/courses");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create course");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/courses")}
            className="h-10 rounded-xl hover:bg-white/50 backdrop-blur-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent">
                Add New Course
              </h1>
              <p className="text-slate-500">Create a new course for student enrollment</p>
            </div>
          </div>
        </div>

        <Card className="backdrop-blur-sm bg-white/70 border-0 shadow-xl">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
              <span className="text-blue-500">📚</span>
              Course Information
            </CardTitle>
          </CardHeader>
          <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {(error || addError) && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                {error || addError?.message}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-slate-700">Course Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Computer Science, Electrical Engineering"
                className="h-12 border-slate-200/50 bg-white/50 backdrop-blur-sm focus:bg-white/80 transition-all duration-200 rounded-xl"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <Label className="text-sm font-medium text-slate-700">Course Subjects *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSubjectField}
                  className="h-9 rounded-xl hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Subject
                </Button>
              </div>
              
              <div className="space-y-3">
                {subjects.map((subject, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <Input
                      value={subject}
                      onChange={(e) => updateSubject(index, e.target.value)}
                      placeholder={`Subject ${index + 1} (e.g., Mathematics, Physics)`}
                      className="h-11 border-slate-200/50 bg-white/50 backdrop-blur-sm focus:bg-white/80 transition-all duration-200 rounded-xl"
                    />
                    {subjects.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSubjectField(index)}
                        className="h-11 w-11 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-500 mt-3 flex items-center gap-2">
                <span>💡</span>
                Add all subjects that are part of this course curriculum.
              </p>
            </div>

            <div className="flex gap-4 pt-6 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/courses")}
                className="flex-1 h-12 rounded-xl hover:bg-slate-50 transition-all"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isAdding}
                className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isAdding ? "Creating..." : "Create Course"}
              </Button>
            </div>
          </form>
        </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddCoursePage;
