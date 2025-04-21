import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lesson",
    required: true,
  },
  question: { type: String, required: true },
  options: [{ type: String }], // Now optional
  correctAnswer: { type: String, required: true }, // Can be from options or text
  isAIgenerated: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Quiz || mongoose.model("Quiz", quizSchema);
