// pages/api/enroll.js
import { mongooseConnect } from "@/lib/mongoose";
import Course from "@/models/Course";
import User from "@/models/User";
import { getServerSession } from "next-auth";

export default async function handler(req, res) {
  const session = await getServerSession(req, res);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const { courseId } = req.body;
  if (!courseId) return res.status(400).json({ error: "Course ID required" });

  try {
    await mongooseConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    // 👉 Check subscription if course is paid
    if (course.isPaid) {
      const now = new Date();

      const hasActiveSub =
        user.subscription?.isActive &&
        user.subscription?.endDate &&
        now <= new Date(user.subscription.endDate);

      if (!hasActiveSub) {
        return res.status(403).json({
          error: "You need an active subscription to enroll in paid courses.",
        });
      }
    }

    // 🔁 ENROLL
    if (req.method === "POST") {
      const alreadyEnrolled = course.enrolledStudents.includes(user._id);

      if (alreadyEnrolled) {
        return res
          .status(200)
          .json({ message: "Already enrolled in this course." });
      }

      course.enrolledStudents.push(user._id);
      await course.save();

      return res.status(200).json({ message: "Enrollment successful!" });
    }

    // 🔁 UNENROLL
    if (req.method === "DELETE") {
      course.enrolledStudents = course.enrolledStudents.filter(
        (id) => id?.toString() !== user._id.toString()
      );
      await course.save();

      return res.status(200).json({ message: "Unenrolled successfully." });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Enroll API Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
