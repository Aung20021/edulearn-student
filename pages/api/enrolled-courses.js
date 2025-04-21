import { mongooseConnect } from "@/lib/mongoose";
import Course from "@/models/Course";
import { getServerSession } from "next-auth";
import User from "@/models/User"; // Ensure User model is imported

export default async function handler(req, res) {
  if (req.method !== "GET") {
    console.log("Method not allowed");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res);

  if (!session) {
    console.log("No session found");
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    console.log("Session found:", session);
    await mongooseConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      console.log("User not found");
      return res.status(404).json({ error: "User not found" });
    }

    console.log("User found:", user);

    // Ensure that user._id is being properly retrieved
    const userId = user._id;
    console.log("User ID for course enrollment query:", userId);

    const enrolledCourses = await Course.find({
      enrolledStudents: userId, // Match userId in enrolledStudents array
    }).populate("teacher", "name email");

    console.log("Enrolled courses found:", enrolledCourses);

    if (enrolledCourses.length === 0) {
      console.log("No enrolled courses found for this user.");
    }

    return res.status(200).json({ success: true, courses: enrolledCourses });
  } catch (error) {
    console.error("Error fetching enrolled courses:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
