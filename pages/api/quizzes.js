import { mongooseConnect } from "@/lib/mongoose";
import Quiz from "@/models/Quiz";
import Lesson from "@/models/Lesson";

export default async function handle(req, res) {
  const { method, query } = req;

  await mongooseConnect();

  if (method === "GET") {
    try {
      const { lessonId } = query;

      if (lessonId) {
        // Ensure lessonId is valid before querying
        const lessonExists = await Lesson.findById(lessonId);
        if (!lessonExists) {
          return res.status(404).json({ error: "Lesson not found." });
        }

        // Fetch quizzes related to the specific lesson
        const quizzes = await Quiz.find({ lesson: lessonId });

        if (!quizzes.length) {
          return res.status(200).json([]); // Return empty array instead of an error
        }

        return res.status(200).json(quizzes);
      }

      // If no lessonId is provided, return all quizzes
      const quizzes = await Quiz.find().populate("lesson");
      return res.status(200).json(quizzes);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
