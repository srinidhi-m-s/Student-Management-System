import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useFaculty } from '../hooks/useFaculty';
import { useStudents } from '../hooks/useStudents';
import { getCourseName } from '../types/Student';
import { FacultyForm } from '../components/students/FacultyForm';
import { useAuth } from '../context/useAuth';
import { deleteFaculty } from '../api/facultyApi';

const FacultyPage = () => {
  const { facultyList = [], refetch } = useFaculty();
  const { data: students = [] } = useStudents();
  const { token } = useAuth();
  type FacultyType = { _id?: string; name: string; email: string } | undefined;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyType>(undefined);
  const [search, setSearch] = useState("");
  const [expandedFacultyId, setExpandedFacultyId] = useState<string | null>(null);

  const handleEdit = (facultyMember: { _id?: string; name: string; email: string }) => {
    setSelectedFaculty(facultyMember);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedFaculty(undefined);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFaculty(id, token!);
      refetch();
    } catch (err) {
      console.error('Failed to delete faculty:', err);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          Faculty Management
        </h1>
        <Button onClick={handleAdd} variant="default">
          <Plus className="w-4 h-4 mr-2" /> Add Faculty
        </Button>
      </div>
      <div className="mb-4">
        <input
          type="text"
          className="border rounded px-3 py-2 w-full max-w-md"
          placeholder="Search faculty by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <Dialog open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open);
        if (!open) setSelectedFaculty(undefined);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedFaculty ? 'Edit Faculty' : 'Add Faculty'}</DialogTitle>
          </DialogHeader>
          <FacultyForm 
            faculty={selectedFaculty}
            onSuccess={() => {
              setIsFormOpen(false);
              setSelectedFaculty(undefined);
              refetch();
            }}
          />
        </DialogContent>
      </Dialog>
      <div className="grid gap-8 mt-8">
        {facultyList
          .filter((faculty: { name: string; email: string }) =>
            faculty.name.toLowerCase().includes(search.toLowerCase()) ||
            faculty.email.toLowerCase().includes(search.toLowerCase())
          )
          .map((faculty: { _id?: string; name: string; email: string }) => {
            const facultyStudents = students.filter((s: import('../types/Student').Student) => typeof s.facultyId === 'object' && s.facultyId._id === faculty._id);
            const isExpanded = expandedFacultyId === faculty._id;
            return (
              <div key={faculty._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-2xl font-semibold cursor-pointer" onClick={() => setExpandedFacultyId(isExpanded ? null : faculty._id!)}>
                      {faculty.name}
                    </h2>
                    <p className="text-gray-600">{faculty.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(faculty)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-900">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Faculty</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this faculty member? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(faculty._id!)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                {isExpanded && (
                  <div>
                    <h3 className="text-lg font-bold mb-2">Students</h3>
                    {facultyStudents.length === 0 ? (
                      <p className="text-gray-500">No students assigned to this faculty.</p>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Overall Grade</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {facultyStudents.map((student: import('../types/Student').Student) => (
                            <tr key={student._id}>
                              <td className="px-4 py-2">{typeof student.userId === 'object' ? student.userId.name : 'Unknown'}</td>
                              <td className="px-4 py-2">{getCourseName(student)}</td>
                              <td className="px-4 py-2">{student.overallGrade || 'N/A'}</td>
                              <td className="px-4 py-2">{student.attendancePercentage != null ? `${student.attendancePercentage}%` : 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default FacultyPage;
