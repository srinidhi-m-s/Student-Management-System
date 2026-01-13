import mongoose, { Schema, Document } from "mongoose";

export interface StudentDoc extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  facultyId: mongoose.Types.ObjectId;
  overallGrade?: string;
  marks?: number;
  attendancePercentage?: number;
  createdAt: Date;
}

const studentSchema = new Schema<StudentDoc>({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  courseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Course", 
    required: true 
  },
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  overallGrade: { type: String, default: "" },
  marks: { type: Number, default: 0 },
  attendancePercentage: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

// Index for faster faculty-based queries
studentSchema.index({ facultyId: 1 });

export const Student = mongoose.model<StudentDoc>("Student", studentSchema);
