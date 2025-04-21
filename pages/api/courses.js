import { mongooseConnect } from "@/lib/mongoose";
import Course from "@/models/Course";
import Lesson from "@/models/Lesson";
import Quiz from "@/models/Quiz";
import User from "@/models/User";

export default async function handle(req, res) {
  const { method } = req;
  const {
    courseId,
    search = "",
    page = 1,
    isPaid,
    sort = "createdAt,DESC",
    suggest = false,
    userId,
    published,
  } = req.query;

  await mongooseConnect();

  if (method === "GET") {
    try {
      if (courseId) {
        const course = await Course.findById(courseId)
          .populate({
            path: "lessons",
            model: Lesson,
            populate: { path: "quiz", model: Quiz },
          })
          .populate("teacher");

        if (!course) {
          return res.status(404).json({ error: "Course not found" });
        }

        // Check subscription access
        if (course.isPaid && userId) {
          const user = await User.findById(userId);
          const now = new Date();

          if (user?.subscription?.endDate && user.subscription.endDate < now) {
            await User.updateOne(
              { _id: userId },
              { "subscription.isActive": false }
            );
          }

          if (!user?.subscription?.isActive) {
            return res
              .status(403)
              .json({ error: "Subscription required to access this course." });
          }
        }

        return res.status(200).json(course);
      } else if (req.query.recommend === "true" && userId) {
        const user = await User.findById(userId).populate(
          "viewedCourses.course"
        );
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        const viewedCourseIds = user.viewedCourses
          .map((vc) => vc.course?._id?.toString())
          .filter(Boolean);
        const categories = user.viewedCourses
          .map((vc) => vc.course?.category)
          .filter(Boolean);
        const preferredCategory = categories.length > 0 ? categories[0] : null;

        const alreadyViewedSet = new Set(viewedCourseIds);

        // === Stage 1: Looser Collaborative Filtering ===
        const similarUsers = await User.find({
          _id: { $ne: userId },
          "viewedCourses.course": { $in: viewedCourseIds },
        }).limit(100); // more users

        const similarViewedCourseIds = [
          ...new Set(
            similarUsers.flatMap((u) =>
              u.viewedCourses.map((vc) => vc.course?.toString()).filter(Boolean)
            )
          ),
        ];

        let recommendedCourses = [];

        if (similarViewedCourseIds.length > 0) {
          // Loosen filter: allow already viewed, but prioritize unseen
          recommendedCourses = await Course.find({
            isPublished: true,
            _id: { $in: similarViewedCourseIds },
          })
            .sort({ createdAt: -1 })
            .populate("teacher");

          // Deduplicate and prioritize unseen
          const uniqueCourses = [];
          const seen = new Set();
          for (const course of recommendedCourses) {
            if (!seen.has(course._id.toString())) {
              seen.add(course._id.toString());
              uniqueCourses.push(course);
            }
          }

          const prioritized = uniqueCourses.sort((a, b) => {
            const aSeen = alreadyViewedSet.has(a._id.toString());
            const bSeen = alreadyViewedSet.has(b._id.toString());
            return aSeen - bSeen; // show unseen first
          });

          if (prioritized.length > 0) {
            return res
              .status(200)
              .json({ recommended: prioritized.slice(0, 6) });
          }
        }

        // === Stage 2: Broader category-based fallback ===
        if (preferredCategory) {
          recommendedCourses = await Course.find({
            isPublished: true,
            category: { $in: [preferredCategory, ...categories] }, // broader category set
          })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("teacher");

          const unseenCourses = recommendedCourses.filter(
            (c) => !alreadyViewedSet.has(c._id.toString())
          );

          if (unseenCourses.length > 0) {
            return res
              .status(200)
              .json({ recommended: unseenCourses.slice(0, 6) });
          }
        }

        // === Stage 3: Looser Popularity-Based ===
        const courseViewCounts = await User.aggregate([
          { $unwind: "$viewedCourses" },
          { $group: { _id: "$viewedCourses.course", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 15 },
        ]);

        const mostViewedCourseIds = courseViewCounts
          .map((c) => c._id?.toString())
          .filter(Boolean);

        if (mostViewedCourseIds.length > 0) {
          recommendedCourses = await Course.find({
            _id: { $in: mostViewedCourseIds },
            isPublished: true,
          })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("teacher");

          const unseenPopular = recommendedCourses.filter(
            (c) => !alreadyViewedSet.has(c._id.toString())
          );

          if (unseenPopular.length > 0) {
            return res
              .status(200)
              .json({ recommended: unseenPopular.slice(0, 6) });
          }

          // even if already seen, show fallback

          return res
            .status(200)
            .json({ recommended: recommendedCourses.slice(0, 6) });
        }

        // === Final fallback ===
        recommendedCourses = await Course.find({ isPublished: true })
          .sort({ createdAt: -1 })
          .limit(6)
          .populate("teacher");

        return res.status(200).json({ recommended: recommendedCourses });
      } else if (req.query.popular === "true") {
        const popularCourses = await Course.find({ isPublished: true })
          .sort({ enrolledStudents: -1 }) // based on number of enrolled students
          .limit(6)
          .populate("teacher");

        return res.status(200).json({ popular: popularCourses });
      }

      const query = {
        title: { $regex: search, $options: "i" },
      };

      if (published === "true") {
        query.isPublished = true;
      } else if (published === "false") {
        query.isPublished = false;
      }

      if (isPaid === "true") {
        query.isPaid = true;
      } else if (isPaid === "false") {
        query.isPaid = false;
      }

      // ✅ Handle suggestion-only
      if (suggest === "true") {
        const suggestions = await Course.find(query).select("title").limit(5);
        const titles = suggestions.map((c) => c.title);
        return res.status(200).json(titles);
      }

      // ✅ Check subscription for paid courses
      if (isPaid === "true" && userId) {
        const user = await User.findById(userId);
        const now = new Date();

        if (user?.subscription?.endDate && user.subscription.endDate < now) {
          await User.updateOne(
            { _id: userId },
            { "subscription.isActive": false }
          );
        }

        if (!user?.subscription?.isActive) {
          return res
            .status(403)
            .json({ error: "Subscription required to view paid courses." });
        }
      }

      // ✅ Full query with pagination
      const perPage = 8;
      const skip = (parseInt(page) - 1) * perPage;
      const [sortField, sortOrder] = sort.split(",");
      const sortOptions = { [sortField]: sortOrder === "DESC" ? -1 : 1 };

      const courses = await Course.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(perPage)
        .populate("teacher");

      const total = await Course.countDocuments(query);

      return res.status(200).json({ courses, total });
    } catch (error) {
      console.error("Error fetching courses:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
