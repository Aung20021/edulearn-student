import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Resource name
  url: { type: String, required: true }, // Resource file URL
});

const tabSchema = new mongoose.Schema(
  {
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },
    name: { type: String, required: true },
    resources: [resourceSchema], // Store assigned resources
  },
  { timestamps: true } // Auto-manages createdAt & updatedAt
);

export default mongoose.models.Tab || mongoose.model("Tab", tabSchema);
