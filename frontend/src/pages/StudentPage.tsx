import { Link } from "react-router-dom";
import { StudentList } from "../components/students/StudentList";
import { useStudents } from "../hooks/useStudents";
import { Button } from "@/components/ui/button";
import type { Student } from "@/types/Student";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { useAuth } from "@/context/useAuth";

export const StudentPage = () => {
  const { data, isLoading, isError } = useStudents();
  const { user } = useAuth();
  const [filter, setFilter] = useState("");

  //filter students
  const filteredStudents = useMemo(() => {
    return data
      ? data.filter((student: Student) => {
          const userName = typeof student.userId === 'object' 
            ? student.userId.name 
            : '';
          return userName.toLowerCase().includes(filter.toLowerCase());
        })
      : [];
  }, [data, filter]);
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {user?.role === "faculty" ? "My Students" : "Students"}
        </h1>

        {user?.role === "admin" && (
          <Link to="/students/add">
            <Button>Add Student</Button>
          </Link>
        )}
      </div>
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Filter by name..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {isLoading && <p>Loading students...</p>}
      {isError && <p className="text-red-500">Failed to load students</p>}
      {data && <StudentList students={filteredStudents} />}
    </div>
  );
};
