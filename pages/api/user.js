import { mongooseConnect } from "@/lib/mongoose";
import User from "@/models/User";

export default async function handle(req, res) {
  await mongooseConnect();

  const { method } = req;

  switch (method) {
    case "GET": {
      const { email, userId } = req.query;

      if (!email && !userId) {
        return res
          .status(400)
          .json({ error: "Missing email or userId in query" });
      }

      try {
        const user = email
          ? await User.findOne({ email }, "name image")
          : await User.findById(userId).select("name image");

        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json({
          success: true,
          user,
        });
      } catch (error) {
        console.error("Error fetching user:", error);
        return res.status(500).json({ error: "Internal server error" });
      }
    }
    case "POST": {
      const { userId, courseId, lessonId } = req.query;

      if (!userId || !courseId || !lessonId) {
        return res.status(400).json({
          error: "Missing userId, courseId, or lessonId",
        });
      }

      try {
        const user = await User.findById(userId);

        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        console.log("Original User Object:", user); // Log the original user object for debugging

        // Remove course if already viewed
        user.viewedCourses = user.viewedCourses.filter(
          (v) => v.course.toString() !== courseId
        );
        console.log("After filtering viewedCourses:", user.viewedCourses); // Log after filtering

        // Add it at the beginning
        user.viewedCourses.unshift({ course: courseId, viewedAt: new Date() });
        console.log("After unshifting the new course:", user.viewedCourses); // Log after unshifting the course

        // Limit to last 10
        user.viewedCourses = user.viewedCourses.slice(0, 10);
        console.log(
          "After limiting to the last 10 courses:",
          user.viewedCourses
        ); // Log after slicing to limit

        // Update last visited fields
        user.lastVisitedCourse = courseId;
        user.lastVisitedLesson = lessonId;

        // Log the updated user object
        console.log("Updated User Object before saving:", user);

        await user.save();

        return res.status(200).json({
          success: true,
          message: "Visited data updated successfully",
          user,
        });
      } catch (err) {
        console.error("Error updating user:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
    }

    // Update last visited course and subscription (optional PATCH)
    case "PATCH": {
      const { userId, courseId, subscriptionData } = req.body; // subscriptionData contains fields like isActive, interval, startDate, endDate, stripeSubscriptionId

      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }

      try {
        // Update last visited course
        let updatedUser = null;
        if (courseId) {
          updatedUser = await User.findByIdAndUpdate(
            userId,
            {
              $set: { lastVisitedCourse: courseId },
            },
            { new: true }
          );
        }

        // Update subscription info if subscriptionData is provided
        if (subscriptionData) {
          updatedUser = await User.findByIdAndUpdate(
            userId,
            {
              $set: {
                "subscription.isActive": subscriptionData.isActive || false,
                "subscription.interval": subscriptionData.interval,
                "subscription.startDate":
                  subscriptionData.startDate || new Date(),
                "subscription.endDate": subscriptionData.endDate || new Date(),
                "subscription.stripeSubscriptionId":
                  subscriptionData.stripeSubscriptionId,
              },
            },
            { new: true }
          );
        }

        if (!updatedUser) {
          return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json({
          success: true,
          message: "User information updated successfully",
          user: updatedUser,
        });
      } catch (err) {
        console.error("Error updating user:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
    }

    // Update user profile
    case "PUT": {
      const { name, image, email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      try {
        const updatedUser = await User.findOneAndUpdate(
          { email },
          { $set: { name, image } },
          { new: true }
        );

        if (!updatedUser) {
          return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json({
          success: true,
          message: "User updated successfully",
          user: updatedUser,
        });
      } catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).json({ error: "Internal server error" });
      }
    }

    default:
      return res.status(405).json({ error: "Method not allowed" });
  }
}
