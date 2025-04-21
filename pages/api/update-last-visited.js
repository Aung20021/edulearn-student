import { mongooseConnect } from "@/lib/mongoose";
import User from "@/models/User";
import Course from "@/models/Course";
import Lesson from "@/models/Lesson";

export default async function handle(req, res) {
  const { method } = req;
  const { userId, courseId, lessonId } = req.query;

  await mongooseConnect();

  if (method === "POST") {
    try {
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      // === Handle Last Visited Course ===
      if (courseId) {
        const course = await Course.findById(courseId);
        if (!course) {
          return res.status(404).json({ error: "Course not found" });
        }

        // First, update the lastVisitedCourse field
        const updatedUser = await User.findOneAndUpdate(
          { _id: userId },
          { $set: { lastVisitedCourse: course._id } },
          { new: true }
        );

        if (!updatedUser) {
          return res.status(404).json({ error: "User not found" });
        }

        // 1. Remove existing occurrence of the course from viewedCourses
        await User.updateOne(
          { _id: userId },
          {
            $pull: {
              viewedCourses: {
                course: course._id,
              },
            },
          }
        );

        // 2. Add to top of viewedCourses and limit to 10
        const addResult = await User.updateOne(
          { _id: userId },
          {
            $push: {
              viewedCourses: {
                $each: [{ course: course._id, viewedAt: new Date() }],
                $position: 0, // Insert at the beginning
                $slice: 10, // Keep only 10 most recent
              },
            },
          }
        );
        console.log("Add to viewedCourses result:", addResult);

        console.log("User saved successfully");
      }

      // === Handle Last Visited Lesson ===
      if (lessonId) {
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
          return res.status(404).json({ error: "Lesson not found" });
        }

        // Update lastVisitedLesson field
        const updatedUser = await User.findOneAndUpdate(
          { _id: userId },
          { $set: { lastVisitedLesson: lesson._id } },
          { new: true }
        );

        if (!updatedUser) {
          return res.status(404).json({ error: "User not found" });
        }

        console.log("Updated lastVisitedLesson:", lesson._id);
      }

      return res.status(200).json({
        message: "Last visited course and lesson updated successfully",
      });
    } catch (error) {
      console.error("POST /api/update-last-visited error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  if (method === "GET") {
    try {
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const user = await User.findById(userId)
        .populate("lastVisitedCourse")
        .populate("lastVisitedLesson");

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.status(200).json({
        lastVisitedCourse: user.lastVisitedCourse || null,
        lastVisitedLesson: user.lastVisitedLesson || null,
      });
    } catch (error) {
      console.error("GET /api/update-last-visited error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
