import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Pencil, Plus, Trash2, ChevronDown, Users, Mail, AlertTriangle } from 'lucide-react';
import { useFaculty } from '../hooks/useFaculty';
import { useStudents } from '../hooks/useStudents';
import { getCourseName } from '../types/Student';
import { FacultyForm } from '../components/students/FacultyForm';
import { useAuth } from '../context/useAuth';
import { deleteFaculty } from '../api/facultyApi';
import { Progress } from '../components/ui/progress';


const FacultyPage = () => {
  const { facultyList = [], refetch } = useFaculty();
  const { data: students = [], refetch: refetchStudents } = useStudents();
  const { token } = useAuth();
  type FacultyType = { _id?: string; name: string; email: string } | undefined;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyType>(undefined);
  const [search, setSearch] = useState("");
  const [expandedFacultyId, setExpandedFacultyId] = useState<string | null>(null);
  
  // Reassignment dialog state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; studentCount: number } | null>(null);
  const [reassignTo, setReassignTo] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleEdit = (facultyMember: { _id?: string; name: string; email: string }) => {
    setSelectedFaculty(facultyMember);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedFaculty(undefined);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (faculty: { _id?: string; name: string; email: string }) => {
    const studentCount = students.filter((s: import('../types/Student').Student) => 
      typeof s.facultyId === 'object' && s.facultyId._id === faculty._id
    ).length;
    
    setDeleteTarget({ id: faculty._id!, name: faculty.name, studentCount });
    setReassignTo("");
    setDeleteError("");
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !token) return;
    
    // If there are students and no reassignment selected, show error
    if (deleteTarget.studentCount > 0 && !reassignTo) {
      setDeleteError("Please select a faculty to reassign students to.");
      return;
    }
    
    setIsDeleting(true);
    setDeleteError("");
    
    try {
      await deleteFaculty(deleteTarget.id, token, reassignTo || undefined);
      setDeleteTarget(null);
      refetch();
      refetchStudents();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete faculty');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredFaculty = facultyList.filter((faculty: { name: string; email: string }) =>
    faculty.name.toLowerCase().includes(search.toLowerCase()) ||
    faculty.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg flex items-center justify-center">
                <Users className="w-7 h-7 text-white" />
              </div>
              Faculty Management
            </h1>
            <p className="text-slate-500 mt-2">Manage faculty members and their assigned students</p>
          </div>
          <Button onClick={handleAdd} className="gap-2 h-11 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200">
            <Plus className="w-5 h-5" />
            Add Faculty
          </Button>
        </div>

        {/* Delete/Reassign Dialog */}
        <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Delete Faculty
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <p className="text-slate-700 mb-4">
                Are you sure you want to delete <strong className="text-slate-900">{deleteTarget?.name}</strong>?
              </p>
              
              {deleteTarget && deleteTarget.studentCount > 0 && (
                <div className="bg-yellow-50/80 backdrop-blur-sm border border-yellow-200 rounded-xl p-4 mb-4">
                  <p className="text-yellow-800 font-medium mb-2 flex items-center gap-2">
                    ⚠️ This faculty has {deleteTarget.studentCount} student(s) assigned.
                  </p>
                  <p className="text-yellow-700 text-sm mb-3">
                    Please select another faculty to reassign these students to:
                  </p>
                  <label htmlFor="reassign-faculty" className="sr-only">Select Faculty for Reassignment</label>
                  <select
                    id="reassign-faculty"
                    aria-label="Select Faculty for Reassignment"
                    value={reassignTo}
                    onChange={(e) => setReassignTo(e.target.value)}
                    className="w-full h-11 px-4 border border-yellow-300/50 bg-yellow-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
                  >
                    <option value="">-- Select Faculty --</option>
                    {facultyList
                      .filter((f: { _id?: string }) => f._id !== deleteTarget.id)
                      .map((f: { _id?: string; name: string; email: string }) => (
                        <option key={f._id} value={f._id}>
                          {f.name} ({f.email})
                        </option>
                      ))
                    }
                  </select>
                </div>
              )}
              
              {deleteTarget && deleteTarget.studentCount === 0 && (
                <div className="bg-green-50/80 backdrop-blur-sm border border-green-200 rounded-xl p-4">
                  <p className="text-green-700 text-sm flex items-center gap-2">
                    ✅ This faculty has no students assigned. You can safely delete.
                  </p>
                </div>
              )}
              
              {deleteError && (
                <p className="text-red-500 text-sm mt-2">{deleteError}</p>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteConfirm}
                disabled={isDeleting || (deleteTarget?.studentCount ?? 0) > 0 && !reassignTo}
              >
                {isDeleting ? "Deleting..." : "Delete Faculty"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Search and Add Button */}
        <Card className="backdrop-blur-sm bg-white/70 border-0 shadow-xl mb-8">
          <CardContent className="p-6">
            <div className="relative">
              <Input
                type="text"
                className="h-12 pl-12 border-slate-200/50 bg-white/50 backdrop-blur-sm focus:bg-white/80 transition-all duration-200 rounded-xl"
                placeholder="Search faculty by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 text-lg">🔍</span>
            </div>
          </CardContent>
        </Card>

        {/* Faculty Dialog */}
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

        {/* Faculty Cards */}
        {filteredFaculty.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500 text-lg">No faculty members found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredFaculty.map((faculty: { _id?: string; name: string; email: string }) => {
              const facultyStudents = students.filter((s: import('../types/Student').Student) => 
                typeof s.facultyId === 'object' && s.facultyId._id === faculty._id
              );
              const isExpanded = expandedFacultyId === faculty._id;

              return (
                <Card key={faculty._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1 cursor-pointer" onClick={() => setExpandedFacultyId(isExpanded ? null : faculty._id!)}>
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-xl text-gray-900">{faculty.name}</CardTitle>
                          <Badge variant="secondary">{facultyStudents.length} {facultyStudents.length === 1 ? 'Student' : 'Students'}</Badge>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Mail className="w-4 h-4" />
                          <p className="text-sm">{faculty.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEdit(faculty)}
                          className="text-blue-600 hover:text-blue-900 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-900 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200"
                          onClick={() => handleDeleteClick(faculty)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setExpandedFacultyId(isExpanded ? null : faculty._id!)}
                          className="text-gray-600 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200"
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="bg-gray-50 border-t">
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Users className="w-5 h-5 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">Assigned Students</h3>
                          <Badge>{facultyStudents.length}</Badge>
                        </div>
                      </div>

                      {facultyStudents.length === 0 ? (
                        <p className="text-gray-500 text-center py-6">No students assigned to this faculty.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Course</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Grade</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Attendance</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {facultyStudents.map((student: import('../types/Student').Student) => (
                                <tr key={student._id} className="hover:bg-white transition-colors">
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {typeof student.userId === 'object' ? student.userId.name : 'Unknown'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">{getCourseName(student)}</td>
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
      </div>
    </div>
  );
};

export default FacultyPage;
