export interface Course {
  _id: string;
  name: string;
  subjects: string[];
  createdAt: string;
}

export interface CourseFormData {
  name: string;
  subjects: string[];
}
