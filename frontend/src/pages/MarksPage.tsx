import { useState, useMemo } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { useAuth } from '../context/useAuth';
import { useMarks, useDeleteMarks } from '../hooks/useMarks';
import { useStudents } from '../hooks/useStudents';
import { MarksForm } from '../components/marks/MarksForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { GraduationCap, Pencil, Trash2, Plus, BarChart3 } from 'lucide-react';
import type { Mark } from '../api/marksApi';
import type { Student } from '../types/Student';
import { getStudentId, getCourseName } from '../types/Student';

// Fixed exam types
const EXAM_TYPES = ['assignment', 'quiz', 'midterm', 'final', 'project'] as const;

const MarksPage = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const { data: marks = [], isLoading: marksLoading, error: marksError } = useMarks();
  // Only fetch all students if not a student (faculty/admin needs to see all)
  const { data: students = [], isLoading: studentsLoading, error: studentsError } = useStudents({ enabled: !isStudent });
  const deleteMarksMutation = useDeleteMarks();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMark, setSelectedMark] = useState<Mark | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedExamType, setSelectedExamType] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'marks' | 'analytics'>('marks');

  // Filter state
  const [filterStudentName, setFilterStudentName] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterCourse, setFilterCourse] = useState('');

  // Build rows for each student-subject
  type StudentSubjectRow = {
    student: Student;
    subject: string;
    marks: { [examType: string]: Mark | null };
    averageGrade: string;
  };

  // Memoize studentSubjectRows
  const studentSubjectRows = useMemo(() => {
    const rows: StudentSubjectRow[] = [];

    if (isStudent) {
      // For students: backend already filters marks, just display them
      if (marks.length === 0) {
        return rows;
      }

      // Group marks by subject
      const subjectMap = new Map<string, Mark[]>();
      marks.forEach((mark: Mark) => {
        if (mark.studentId && mark.subject) {
          const subject = mark.subject;
          if (!subjectMap.has(subject)) {
            subjectMap.set(subject, []);
          }
          subjectMap.get(subject)?.push(mark);
        }
      });

      // Get student info from first mark's studentId
      if (marks.length > 0 && marks[0].studentId) {
        const studentInfo = marks[0].studentId;
        const studentData: Student = {
          _id: studentInfo._id,
          userId: { ...studentInfo.userId, role: 'student' },
          courseId: studentInfo.courseId || '',
          facultyId: '',
          overallGrade: 'N/A',
          attendancePercentage: 0,
          createdAt: new Date(),
        };
        // Create a row for each subject the student has marks in
        subjectMap.forEach((marksForSubject, subject) => {
          const marksMap: { [examType: string]: Mark | null } = {};
          EXAM_TYPES.forEach((examType) => {
            const mark = marksForSubject.find((m) => m.examType === examType) || null;
            marksMap[examType] = mark;
          });
          rows.push({
            student: studentData,
            subject,
            marks: marksMap,
            averageGrade: studentData.overallGrade || 'N/A',
          });
        });
      }
    } else {
      students.forEach((student: Student) => {
        const subjects = typeof student.courseId === 'object' ? student.courseId.subjects : [];
        subjects.forEach((subject) => {
          // Find marks for this student and subject
          const marksForSubject: { [examType: string]: Mark | null } = {};
          EXAM_TYPES.forEach((examType) => {
            const mark = marks.find(
              (m: Mark) =>
                m.studentId &&
                m.studentId._id === getStudentId(student) &&
                m.subject === subject &&
                m.examType === examType
            );
            marksForSubject[examType] = mark || null;
          });
          rows.push({
            student,
            subject,
            marks: marksForSubject,
            averageGrade: student.overallGrade || 'N/A',
          });
        });
      });
    }
    return rows;
  }, [students, marks, isStudent]);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'B+':
      case 'B':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'C+':
      case 'C':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'D':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'F':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatExamType = (examType: string) => {
    switch (examType) {
      case 'midterm':
        return 'Mid-term';
      default:
        return examType.charAt(0).toUpperCase() + examType.slice(1);
    }
  };

  const isLoading = marksLoading || (!isStudent && studentsLoading);
  const error = marksError || (!isStudent && studentsError);

  // Calculate mark-based analytics for faculty
  const getMarkAnalytics = () => {
    if (isStudent || studentSubjectRows.length === 0) {
      return null;
    }

    const allMarks = marks.filter((m: Mark) => m.marksObtained > 0);
    if (allMarks.length === 0) return null;

    // Calculate average score
    const avgScore = Math.round(
      allMarks.reduce((sum, m: Mark) => sum + (m.percentage || 0), 0) / allMarks.length
    );

    // Calculate grade distribution
    const gradeDistribution = {
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      F: 0,
    };

    const uniqueStudentSubjects = new Set<string>();
    studentSubjectRows.forEach((row: StudentSubjectRow) => {
      uniqueStudentSubjects.add(getStudentId(row.student) + '-' + row.subject);
      const grades = Object.values(row.marks)
        .filter((m) => m !== null)
        .map((m) => calculateGrade(m?.percentage || 0));
      
      grades.forEach((grade) => {
        gradeDistribution[grade as keyof typeof gradeDistribution]++;
      });
    });

    // Calculate exam type statistics
    const examStats: { [key: string]: { avg: number; count: number } } = {};
    EXAM_TYPES.forEach((examType) => {
      const marksForExam = allMarks.filter((m: Mark) => m.examType === examType);
      if (marksForExam.length > 0) {
        examStats[examType] = {
          avg: Math.round(
            marksForExam.reduce((sum, m: Mark) => sum + (m.percentage || 0), 0) / marksForExam.length
          ),
          count: marksForExam.length,
        };
      }
    });

    // Students with high marks (>=80%)
    const highPerformers = new Set<string>();
    allMarks.forEach((m: Mark) => {
      if ((m.percentage || 0) >= 80 && m.studentId && m.studentId._id) {
        highPerformers.add(String(m.studentId._id));
      }
    });

    // Students needing support (<50%)
    const needSupport = new Set<string>();
    allMarks.forEach((m: Mark) => {
      if ((m.percentage || 0) < 50 && m.studentId && m.studentId._id) {
        needSupport.add(String(m.studentId._id));
      }
    });

    return {
      avgScore,
      totalMarksRecorded: allMarks.length,
      uniqueStudentSubjectCount: uniqueStudentSubjects.size,
      gradeDistribution,
      examStats,
      highPerformersCount: highPerformers.size,
      needSupportCount: needSupport.size,
    };
  };

  const calculateGrade = (percentage: number): string => {
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  // Filtered rows
  const filteredRows = studentSubjectRows.filter((row: StudentSubjectRow) => {
    const studentName = typeof row.student.userId === 'object' ? row.student.userId.name.toLowerCase() : '';
    const subject = row.subject.toLowerCase();
    const courseName = (typeof row.student.courseId === 'object' && row.student.courseId.name) ? row.student.courseId.name.toLowerCase() : '';
    return (
      (!filterStudentName || studentName.includes(filterStudentName.toLowerCase())) &&
      (!filterSubject || subject.includes(filterSubject.toLowerCase())) &&
      (!filterCourse || courseName.includes(filterCourse.toLowerCase()))
    );
  });

  // Helper to calculate average grade for a subject row
  function getSubjectAverageGrade(row: StudentSubjectRow) {
    // Only consider marks that exist for this subject row
    const marksArr = Object.values(row.marks).filter(Boolean) as { percentage?: number }[];
    if (marksArr.length === 0) return 'N/A';
    // Average percentage
    const avg = marksArr.reduce((sum, m) => sum + (m.percentage || 0), 0) / marksArr.length;
    // Convert to grade
    if (avg >= 90) return 'A+';
    if (avg >= 85) return 'A';
    if (avg >= 80) return 'A-';
    if (avg >= 75) return 'B+';
    if (avg >= 70) return 'B';
    if (avg >= 65) return 'B-';
    if (avg >= 60) return 'C+';
    if (avg >= 55) return 'C';
    if (avg >= 50) return 'C-';
    if (avg >= 40) return 'D';
    return 'F';
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="w-8 h-8" />
            Marks Management
          </h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading marks...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="w-8 h-8" />
            Marks Management
          </h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error Loading Data</h3>
          <p className="text-red-600 mt-1">{error.message}</p>
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-purple-500 to-violet-600 shadow-lg flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              Marks Management
            </h1>
            <p className="text-slate-500 mt-2">Track and manage student academic performance</p>
          </div>
          {user?.role === 'faculty' && (
            <Dialog open={isFormOpen} onOpenChange={(open) => {
              setIsFormOpen(open);
              if (!open) {
                setSelectedMark(null);
                setSelectedStudentId(null);
                setSelectedExamType(null);
                setSelectedSubject('');
              }
            }}>
              
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{selectedMark ? 'Edit Mark' : 'Add Mark'}</DialogTitle>
                </DialogHeader>
                <MarksForm
                  mark={selectedMark}
                  studentId={selectedStudentId || undefined}
                  subject={selectedSubject || undefined}
                  examType={selectedExamType || undefined}
                  onSuccess={() => {
                    setIsFormOpen(false);
                    setSelectedMark(null);
                    setSelectedStudentId(null);
                    setSelectedExamType(null);
                    setSelectedSubject('');
                  }}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Tab Navigation */}
        {(user?.role === 'faculty' || user?.role === 'admin') && (
          <div className="flex backdrop-blur-sm bg-white/70 rounded-xl border-0 shadow-lg overflow-hidden">
            <button
              onClick={() => setActiveTab('marks')}
              className={`px-6 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none flex items-center gap-2 ${
                activeTab === 'marks'
                  ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg'
                  : 'bg-slate-200 text-slate-600 hover:text-purple-600 hover:bg-purple-50/50'
              }`}
            >
              📋 Marks Table
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none flex items-center gap-2 ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg'
                  : 'bg-slate-200 text-slate-600 hover:text-purple-600 hover:bg-purple-50/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
          </div>
        )}

      {/* Marks Table Tab */}
      {activeTab === 'marks' && (
        <>
          {/* Filter UI - hide student filter for students */}
          <Card className="mb-6 backdrop-blur-sm bg-white/70 border-0 shadow-xl">
            <CardContent className="pt-6">
              <div className={`grid grid-cols-1 ${isStudent ? 'sm:grid-cols-2 max-w-xl' : 'sm:grid-cols-2 md:grid-cols-3'} gap-4 items-end`}>
                {!isStudent && (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="student-search" className="flex items-center gap-1 text-sm font-medium text-slate-700">
                      <span role="img" aria-label="Student">👤</span> Student Name
                    </Label>
                    <Input
                      id="student-search"
                      type="text"
                      placeholder="Type to search student..."
                      value={filterStudentName}
                      onChange={e => setFilterStudentName(e.target.value)}
                      className="h-11 border-slate-200/50 bg-white/50 backdrop-blur-sm focus:bg-white/80 transition-all duration-200 rounded-xl"
                      autoComplete="off"
                    />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="subject-search" className="flex items-center gap-1 text-sm font-medium text-slate-700">
                    <span role="img" aria-label="Subject">📚</span> Subject
                  </Label>
                  <Input
                    id="subject-search"
                    type="text"
                    placeholder="Type to search subject..."
                    value={filterSubject}
                    onChange={e => setFilterSubject(e.target.value)}
                    className="h-11 border-slate-200/50 bg-white/50 backdrop-blur-sm focus:bg-white/80 transition-all duration-200 rounded-xl"
                    autoComplete="off"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="course-search" className="flex items-center gap-1 text-sm font-medium text-slate-700">
                    <span role="img" aria-label="Course">🏫</span> Course Name
                  </Label>
                  <Input
                    id="course-search"
                    type="text"
                    placeholder="Type to search course..."
                    value={filterCourse}
                    onChange={e => setFilterCourse(e.target.value)}
                    className="h-11 border-slate-200/50 bg-white/50 backdrop-blur-sm focus:bg-white/80 transition-all duration-200 rounded-xl"
                    autoComplete="off"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
      {filteredRows.length === 0 ? (
        <Card className="backdrop-blur-sm bg-white/70 border-0 shadow-xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-100 to-violet-100 flex items-center justify-center mb-4">
                <GraduationCap className="w-10 h-10 text-purple-500" />
              </div>
              <p className="text-xl font-semibold text-slate-800 mb-2">No marks found</p>
              <p className="text-slate-500 text-center max-w-md">
                {isStudent
                  ? 'No marks have been recorded for you yet.'
                  : user?.role === 'faculty' 
                  ? 'No students are assigned to you yet.' 
                  : 'No marks have been recorded yet.'}
              </p>
            </CardContent>
          </Card>
      ) : (
        <Card>
          <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-200 border-b">
            <CardTitle className="text-lg">Marks Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    {EXAM_TYPES.map((examType) => (
                      <th key={examType} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {formatExamType(examType)}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Average Grade
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRows.map((row) => (
                    <tr key={getStudentId(row.student) + '-' + row.subject} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {typeof row.student.userId === 'object' ? row.student.userId.name : "Unknown Student"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {typeof row.student.userId === 'object' ? row.student.userId.email : "No email"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.subject}
                        <div className="text-xs text-gray-400">
                          {getCourseName(row.student)}
                        </div>
                      </td>
                      {EXAM_TYPES.map((examType) => {
                        const mark = row.marks[examType];
                        return (
                          <td key={examType} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center justify-between">
                              <div>
                                {mark ? (
                                  <div>
                                    <span className="font-medium">{mark.marksObtained}</span>
                                    <span className="text-gray-500">/{mark.maxMarks}</span>
                                    <div className="text-xs text-gray-400">
                                      {mark.percentage?.toFixed(1)}%
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">0</span>
                                )}
                              </div>
                              {user?.role === 'faculty' && (
                                <div className="ml-2 flex gap-1">
                                  {mark && mark.marksObtained !== 0 ? (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-indigo-600 hover:text-indigo-900 h-7 w-7 p-0"
                                        onClick={() => {
                                          setSelectedMark(mark);
                                          setIsFormOpen(true);
                                        }}
                                        title="Edit Mark"
                                      >
                                        <Pencil className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-600 hover:text-red-900 h-7 w-7 p-0"
                                        onClick={() => {
                                          if (window.confirm('Are you sure you want to delete this mark?')) {
                                            deleteMarksMutation.mutateAsync(mark._id);
                                          }
                                        }}
                                        title="Delete Mark"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-green-600 hover:text-green-900 h-7 w-7 p-0"
                                      onClick={() => {
                                        setSelectedMark(null);
                                        setSelectedStudentId(getStudentId(row.student));
                                        setSelectedExamType(examType);
                                        setSelectedSubject(row.subject);
                                        setIsFormOpen(true);
                                      }}
                                      title="Add Mark"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getGradeColor(getSubjectAverageGrade(row))}>
                          {getSubjectAverageGrade(row)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Summary Stats */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Total Students: {students.length}</span>
                <span>Total Marks Recorded: {marks.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
        </>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (user?.role === 'faculty' || user?.role === 'admin') && (
        <>
          {getMarkAnalytics() ? (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Average Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-500">{getMarkAnalytics()?.avgScore}%</div>
                    <p className="text-xs text-gray-500 mt-1">Class average</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">High Performers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-500">{getMarkAnalytics()?.highPerformersCount}</div>
                    <p className="text-xs text-gray-500 mt-1">Scored ≥80%</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Need Support</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-500">{getMarkAnalytics()?.needSupportCount}</div>
                    <p className="text-xs text-gray-500 mt-1">Scored &lt;50%</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Marks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-500">{getMarkAnalytics()?.totalMarksRecorded}</div>
                    <p className="text-xs text-gray-500 mt-1">Recorded</p>
                  </CardContent>
                </Card>
              </div>

              {/* Grade Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-500" />
                    Grade Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(['A', 'B', 'C', 'D', 'F'] as const).map((grade) => {
                      const count = getMarkAnalytics()?.gradeDistribution[grade] || 0;
                      const total = getMarkAnalytics()?.totalMarksRecorded || 1;
                      const percentage = Math.round((count / total) * 100);
                      return (
                        <div key={grade}>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">Grade {grade}</span>
                            <span className="text-sm font-semibold">{count} ({percentage}%)</span>
                          </div>
                          <Progress value={percentage} />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Exam Type Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    Exam-wise Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {EXAM_TYPES.map((examType) => {
                      const stats = getMarkAnalytics()?.examStats[examType];
                      return stats ? (
                        <div key={examType} className="border rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-2">{formatExamType(examType)}</p>
                          <div className="text-2xl font-bold text-green-600">{stats.avg}%</div>
                          <p className="text-xs text-gray-500 mt-1">{stats.count} marks</p>
                        </div>
                      ) : null;
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="w-16 h-16 text-gray-400 mb-4" />
                <p className="text-xl text-gray-600 mb-2">No Analytics Available</p>
                <p className="text-gray-500 text-center max-w-md">
                  Record some marks first to see analytics.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
      </div>
    </div>
  );
};

export default MarksPage;