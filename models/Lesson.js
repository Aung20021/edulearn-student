import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Resource name
  url: { type: String, required: true }, // Resource file URL
});

const lessonSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  title: { type: String, required: true },
  content: { type: String, required: true },

  pdfResources: [resourceSchema],
  wordResources: [resourceSchema],
  imageResources: [resourceSchema],
  videoResources: [resourceSchema],
  txtResources: [resourceSchema], // ✅ Allow TXT files
  zipResources: [resourceSchema], // ✅ Allow ZIP files
  pptResources: [resourceSchema], // ✅ Allow PPT/PPTX files

  aiGeneratedSummary: { type: String },
  quiz: [{ type: mongoose.Schema.Types.ObjectId, ref: "Quiz" }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Lesson || mongoose.model("Lesson", lessonSchema);
