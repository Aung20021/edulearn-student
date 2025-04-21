import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  image: { type: String }, // Store profile picture URL
  lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }],
  category: { type: String }, // e.g., "Math", "Science"
  isPublished: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isPaid: { type: Boolean, default: false }, // New field to track if course is paid
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // New field to track enrolled students
});

export default mongoose.models.Course || mongoose.model("Course", courseSchema);
