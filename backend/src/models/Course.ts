import mongoose, { Schema, Document } from "mongoose";

export interface CourseDoc extends Document {
  name: string;
  subjects: string[];
  createdAt: Date;
}

const courseSchema = new Schema<CourseDoc>({
  name: { 
    type: String, 
    required: true,
    unique: true,
    trim: true
  },
  subjects: [{ 
    type: String, 
    required: true 
  }],
  createdAt: { type: Date, default: Date.now },
});

export const Course = mongoose.model<CourseDoc>("Course", courseSchema);
