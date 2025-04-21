import mongoose from "mongoose";

const progressSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }],
  quizScores: [
    {
      quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
      score: { type: Number },
      completedAt: { type: Date },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Progress ||
  mongoose.model("Progress", progressSchema);
