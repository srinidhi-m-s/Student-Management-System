import { useState, useMemo } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

import { useAuth } from '../context/useAuth';
import { useMarks, useDeleteMarks } from '../hooks/useMarks';
import { useStudents } from '../hooks/useStudents';
import { MarksForm } from '../components/marks/MarksForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { GraduationCap } from 'lucide-react';
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

  // Memoize both studentSubjectRows and selectedStudent together
  const { studentSubjectRows, selectedStudent } = useMemo(() => {
    const rows: StudentSubjectRow[] = [];
    let selectedStudent: Student | null = null;

    if (isStudent) {
      // For students: backend already filters marks, just display them
      if (marks.length === 0) {
        return { studentSubjectRows: rows, selectedStudent: null };
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
        selectedStudent = studentData;
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
      selectedStudent = selectedStudentId
        ? students.find((s: Student) => getStudentId(s) === selectedStudentId)
        : null;
    }
    return { studentSubjectRows: rows, selectedStudent };
  }, [students, marks, isStudent, selectedStudentId]);

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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <GraduationCap className="w-8 h-8" />
          Marks Management
        </h1>
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
                <DialogTitle>
                  {selectedMark ? 'Edit Marks' : `Add ${selectedExamType ? formatExamType(selectedExamType) : ''} Marks`}
                </DialogTitle>
              </DialogHeader>
              {!selectedMark && selectedStudent && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Student: <span className="font-medium">{typeof selectedStudent.userId === 'object' ? selectedStudent.userId.name : 'Unknown'}</span>
                  </p>                  
                </div>
              )}
              <MarksForm 
                mark={selectedMark}
                studentId={selectedStudentId || undefined}
                subject={selectedMark ? selectedMark.subject : selectedSubject}
                examType={selectedMark ? selectedMark.examType : (selectedExamType || undefined)}
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
      {/* Filter UI - hide student filter for students */}
      <div className={`mb-6 grid grid-cols-1 ${isStudent ? 'sm:grid-cols-2 max-w-xl' : 'sm:grid-cols-2 md:grid-cols-3 max-w-3xl'} gap-4 items-end`}>
        {!isStudent && (
          <div className="flex flex-col">
            <label htmlFor="student-search" className="mb-1 text-sm font-medium text-gray-700 flex items-center gap-1">
              <span role="img" aria-label="Student">👤</span> Student Name
            </label>
            <input
              id="student-search"
              type="text"
              placeholder="Type to search student..."
              value={filterStudentName}
              onChange={e => setFilterStudentName(e.target.value)}
              className="border px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition w-full"
              autoComplete="off"
            />
          </div>
        )}
        <div className="flex flex-col">
          <label htmlFor="subject-search" className="mb-1 text-sm font-medium text-gray-700 flex items-center gap-1">
            <span role="img" aria-label="Subject">📚</span> Subject
          </label>
          <input
            id="subject-search"
            type="text"
            placeholder="Type to search subject..."
            value={filterSubject}
            onChange={e => setFilterSubject(e.target.value)}
            className="border px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition w-full"
            autoComplete="off"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="course-search" className="mb-1 text-sm font-medium text-gray-700 flex items-center gap-1">
            <span role="img" aria-label="Course">🏫</span> Course Name
          </label>
          <input
            id="course-search"
            type="text"
            placeholder="Type to search course..."
            value={filterCourse}
            onChange={e => setFilterCourse(e.target.value)}
            className="border px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition w-full"
            autoComplete="off"
          />
        </div>
      </div>
      {filteredRows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
              <GraduationCap className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-xl text-gray-600 mb-2">No marks found</p>
              <p className="text-gray-500 text-center max-w-md">
                {isStudent
                  ? 'No marks have been recorded for you yet.'
                  : user?.role === 'faculty' 
                  ? 'No students are assigned to you yet.' 
                  : 'No marks have been recorded yet.'}
              </p>
            </CardContent>
          </Card>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
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
                  {/* Actions column removed */}
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
                                    className="text-indigo-600 hover:text-indigo-900 h-6 w-6 p-0"
                                    onClick={() => {
                                      setSelectedMark(mark);
                                      setIsFormOpen(true);
                                    }}
                                    title="Edit Mark"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2h6" /></svg>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-900 h-6 w-6 p-0"
                                    onClick={() => {
                                      if (window.confirm('Are you sure you want to delete this mark?')) {
                                        deleteMarksMutation.mutateAsync(mark._id);
                                      }
                                    }}
                                    title="Delete Mark"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600 hover:text-green-900 h-6 w-6 p-0"
                                  onClick={() => {
                                    setSelectedMark(null);
                                    setSelectedStudentId(getStudentId(row.student));
                                    setSelectedExamType(examType);
                                    setSelectedSubject(row.subject);
                                    setIsFormOpen(true);
                                  }}
                                  title="Add Mark"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                </Button>
                              )}
                            </div>
                          )}
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(getSubjectAverageGrade(row))}`}>
                        {getSubjectAverageGrade(row)}
                      </span>
                    </td>
                    {/* Action cell removed */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Summary Stats */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Total Students: {students.length}</span>
              <span>
                Total Marks Recorded: {marks.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarksPage;