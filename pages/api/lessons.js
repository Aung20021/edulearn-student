import { mongooseConnect } from "@/lib/mongoose";
import Lesson from "@/models/Lesson";
import Course from "@/models/Course";
import Quiz from "@/models/Quiz"; // Ensure correct path to your Quiz model
import Tab from "@/models/Tab";
const getFileCategory = (type) => {
  const fileTypes = {
    "application/pdf": "pdfResources",

    // Word Documents
    "application/msword": "wordResources",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "wordResources",

    // PowerPoint Presentations
    "application/vnd.ms-powerpoint": "pptResources",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      "pptResources",

    // Images
    "image/jpeg": "imageResources",
    "image/png": "imageResources",
    "image/gif": "imageResources",
    "image/svg+xml": "imageResources",
    "image/webp": "imageResources",

    // Videos
    "video/mp4": "videoResources",
    "video/mpeg": "videoResources",
    "video/ogg": "videoResources",
    "video/webm": "videoResources",
    "video/x-msvideo": "videoResources",

    // Text Files
    "text/plain": "txtResources",
    "text/csv": "txtResources",

    // Compressed Files (ZIP, RAR, TAR, 7z, GZ)
    "application/zip": "zipResources",
    "application/x-zip-compressed": "zipResources",
    "application/x-rar-compressed": "zipResources",
    "application/vnd.rar": "zipResources",
    "application/x-7z-compressed": "zipResources",
    "application/x-tar": "zipResources",
    "application/gzip": "zipResources",
  };

  return fileTypes[type] || null; // Return null for unsupported types
};

export default async function handle(req, res) {
  const { method } = req;
  await mongooseConnect();

  if (req.method === "GET") {
    try {
      const { courseId, lessonId } = req.query;

      if (!courseId && !lessonId) {
        return res
          .status(400)
          .json({ error: "Course ID or Lesson ID is required." });
      }

      let lessons;

      if (lessonId) {
        // Fetch single lesson by ID
        lessons = await Lesson.findById(lessonId).populate("course");
        if (!lessons) {
          return res.status(404).json({ error: "Lesson not found." });
        }
      } else {
        // Fetch all lessons for a given course
        lessons = await Lesson.find({ course: courseId }).populate("course");
      }

      return res.status(200).json(lessons);
    } catch (error) {
      console.error("❌ Error fetching lessons:", error.message);
      return res.status(500).json({ error: "Failed to retrieve lessons." });
    }
  }

  return res.status(405).json({ error: "Method not allowed." });
}
