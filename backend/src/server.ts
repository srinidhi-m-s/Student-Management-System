import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import facultyRoutes from "./routes/faculty.routes.js";
import marksRoutes from "./routes/marks.routes.js";
import courseRoutes from "./routes/course.routes.js";

import { connectDB } from "./config/db.js";
import studentRouter from "./routes/student.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());


app.use("/students", studentRouter);
app.use("/faculty", facultyRoutes);
app.use("/auth", authRoutes);
app.use("/marks", marksRoutes);
app.use("/courses", courseRoutes);

app.get("/", (_req, res) => {
  res.send("Student Management API running");
});


connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
