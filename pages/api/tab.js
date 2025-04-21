import { mongooseConnect } from "@/lib/mongoose";
import Tab from "@/models/Tab"; // Ensure this is the correct path to your Tab model

export default async function handler(req, res) {
  await mongooseConnect(); // Ensure database connection

  switch (req.method) {
    case "GET":
      return getTabs(req, res);

    default:
      return res.status(405).json({ error: "Method Not Allowed" });
  }
}

// ✅ Fetch tabs for a specific lesson
async function getTabs(req, res) {
  try {
    const { lessonId } = req.query;
    if (!lessonId) {
      return res.status(400).json({ error: "Lesson ID is required" });
    }

    const tabs = await Tab.find({ lesson: lessonId });
    res.status(200).json(tabs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
