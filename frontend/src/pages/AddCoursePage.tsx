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
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate("/courses")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="w-8 h-8" />
          Add New Course
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {(error || addError) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">{error || addError?.message}</p>
              </div>
            )}

            <div>
              <Label htmlFor="name">Course Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Computer Science, Electrical Engineering"
                className="mt-1"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Subjects *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSubjectField}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Subject
                </Button>
              </div>
              
              <div className="space-y-2">
                {subjects.map((subject, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={subject}
                      onChange={(e) => updateSubject(index, e.target.value)}
                      placeholder={`Subject ${index + 1} (e.g., Mathematics, Physics)`}
                    />
                    {subjects.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSubjectField(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Add all subjects that are part of this course curriculum.
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/courses")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isAdding}
                className="flex-1"
              >
                {isAdding ? "Creating..." : "Create Course"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddCoursePage;
