import mongoose, { Schema, Document } from "mongoose";

export interface MarksDoc extends Document {
  studentId: mongoose.Types.ObjectId;
  subject: string;
  examType: "assignment" | "quiz" | "midterm" | "final" | "project";
  maxMarks: number;
  marksObtained: number;
  percentage: number;
  grade?: string;
  examDate: Date;
  createdBy: mongoose.Types.ObjectId; 
  createdAt: Date;
  updatedAt: Date;
}

const marksSchema = new Schema<MarksDoc>({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  examType: {
    type: String,
    enum: ["assignment", "quiz", "midterm", "final", "project"],
    required: true,
  },
  maxMarks: {
    type: Number,
    required: true,
    min: 1,
  },
  marksObtained: {
    type: Number,
    required: true,
    min: 0,
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  grade: {
    type: String,
    required: false,
  },
  examDate: {
    type: Date,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
}, {
  timestamps: true,
});

marksSchema.pre('save', function(next) {
  this.percentage = (this.marksObtained / this.maxMarks) * 100;
  
  
  if (this.percentage >= 90) this.grade = "A+";
  else if (this.percentage >= 85) this.grade = "A";
  else if (this.percentage >= 80) this.grade = "A-";
  else if (this.percentage >= 75) this.grade = "B+";
  else if (this.percentage >= 70) this.grade = "B";
  else if (this.percentage >= 65) this.grade = "B-";
  else if (this.percentage >= 60) this.grade = "C+";
  else if (this.percentage >= 55) this.grade = "C";
  else if (this.percentage >= 50) this.grade = "C-";
  else this.grade = "F";
  
  next();
});

marksSchema.index({ studentId: 1, subject: 1, examType: 1 });
marksSchema.index({ createdBy: 1 });

export const Marks = mongoose.model<MarksDoc>("Marks", marksSchema);