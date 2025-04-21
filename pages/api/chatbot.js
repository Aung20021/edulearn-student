import { mongooseConnect } from "@/lib/mongoose";
import Course from "@/models/Course";
import Lesson from "@/models/Lesson";
import Quiz from "@/models/Quiz";
import { getServerSession } from "next-auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }
  // Get user session
  const session = await getServerSession(req, res);

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Missing message" });
  }

  try {
    await mongooseConnect();
    const lowerMessage = message.toLowerCase();

    // Simple intent checks
    const isTotalQuery = /how many courses|total courses/.test(lowerMessage);
    const isListQuery = /list courses|show courses/.test(lowerMessage);
    const isMoreQuery = /more courses|next|show more/.test(lowerMessage);
    const isLessonQuery = /lesson|lessons/.test(lowerMessage);
    const isQuizQuery = /quiz|quizzes/.test(lowerMessage);

    const publishedCourses = await Course.find({ isPublished: true }).select(
      "title category description"
    );

    // TOTAL
    if (isTotalQuery) {
      return res.status(200).json({
        reply: `There are ${publishedCourses.length} published courses available on EduLearn.`,
      });
    }

    // LESSON / QUIZ HANDLING
    if (isLessonQuery || isQuizQuery) {
      const allCourses = await Course.find({ isPublished: true });
      const matchedCourse = allCourses.find((course) =>
        lowerMessage.includes(course.title.toLowerCase())
      );

      if (matchedCourse) {
        const lessons = await Lesson.find({ course: matchedCourse._id });

        if (isLessonQuery) {
          if (lessons.length === 0) {
            return res.status(200).json({
              reply: `No lessons found in course "${matchedCourse.title}".`,
            });
          }

          const lessonList = lessons
            .map((l, i) => `${i + 1}. ${l.title}`)
            .join("\n");
          return res.status(200).json({
            reply: `Lessons in course "${matchedCourse.title}":\n\n${lessonList}`,
          });
        }

        if (isQuizQuery) {
          const lessonIds = lessons.map((l) => l._id);
          const quizzes = await Quiz.find({ lesson: { $in: lessonIds } });

          if (quizzes.length === 0) {
            return res.status(200).json({
              reply: `No quizzes found in course "${matchedCourse.title}".`,
            });
          }

          const quizList = quizzes
            .map((q, i) => `${i + 1}. ${q.question}`)
            .join("\n");
          return res.status(200).json({
            reply: `Quizzes in course "${matchedCourse.title}":\n\n${quizList}`,
          });
        }
      }

      // Look for a specific lesson
      const allLessons = await Lesson.find({});
      const matchedLesson = allLessons.find((lesson) =>
        lowerMessage.includes(lesson.title.toLowerCase())
      );

      if (matchedLesson && isQuizQuery) {
        const quizzes = await Quiz.find({ lesson: matchedLesson._id });

        if (quizzes.length === 0) {
          return res.status(200).json({
            reply: `No quizzes found for lesson "${matchedLesson.title}".`,
          });
        }

        const quizList = quizzes
          .map((q, i) => `${i + 1}. ${q.question}`)
          .join("\n");
        return res.status(200).json({
          reply: `Quizzes in lesson "${matchedLesson.title}":\n\n${quizList}`,
        });
      }
    }
    // Extend your handler function inside the POST check block, before the AI fallback

    // 5. MOST POPULAR COURSES
    if (/\b(popular courses?|most enrolled)\b/.test(lowerMessage)) {
      // pull in enrolledStudents so we can count
      const allCourses = await Course.find({ isPublished: true })
        .populate("enrolledStudents")
        .lean();

      const sorted = allCourses
        .filter((c) => c.enrolledStudents.length > 0)
        .sort((a, b) => b.enrolledStudents.length - a.enrolledStudents.length)
        .slice(0, 3);

      if (sorted.length === 0) {
        return res.status(200).json({
          reply:
            "Currently, no courses have any enrolled students yet. Check back later for trending courses!",
        });
      }

      // nicely formatted list
      const list = sorted
        .map(
          (c, i) =>
            `${i + 1}. ${c.title} — ${c.enrolledStudents.length} students`
        )
        .join("\n");

      return res.status(200).json({
        reply: `Here are the 3 most popular courses:\n\n${list}`,
      });
    }
    // 1. FREE COURSES
    if (/free course/.test(lowerMessage)) {
      const freeCourses = await Course.find({
        isPublished: true,
        isPaid: false,
      })
        .sort({ createdAt: -1 })
        .limit(3);

      if (freeCourses.length === 0) {
        return res
          .status(200)
          .json({ reply: "There are no free courses available right now." });
      }

      const reply = `Here are the latest free courses:\n\n${freeCourses
        .map((c, i) => `${i + 1}. ${c.title}`)
        .join("\n")}`;
      return res.status(200).json({ reply });
    }

    // 2. PAID COURSES
    if (/paid course/.test(lowerMessage)) {
      const paidCourses = await Course.find({ isPublished: true, isPaid: true })
        .sort({ createdAt: -1 })
        .limit(3);

      if (paidCourses.length === 0) {
        return res
          .status(200)
          .json({ reply: "There are no paid courses available right now." });
      }

      const reply = `Here are the latest paid courses:\n\n${paidCourses
        .map((c, i) => `${i + 1}. ${c.title}`)
        .join("\n")}`;
      return res.status(200).json({ reply });
    }

    // 4. LATEST COURSES
    if (/latest course|newest course/.test(lowerMessage)) {
      const latestCourses = await Course.find({ isPublished: true })
        .sort({ createdAt: -1 })
        .limit(3);

      if (latestCourses.length === 0) {
        return res.status(200).json({ reply: "No recent courses found." });
      }

      return res.status(200).json({
        reply: `Here are the 3 latest courses:\n\n${latestCourses.map((c, i) => `${i + 1}. ${c.title}`).join("\n")}`,
      });
    }

    // AI FALLBACK
    const aiPrompt = `
You are EduLearn AI, a helpful teaching assistant. Use the following data to answer the user's question.

Available Courses:
${publishedCourses
  .map(
    (c, i) =>
      `${i + 1}. ${c.title} [${c.category || "General"}]: ${c.description}`
  )
  .join("\n")}

User asked: "${message}"

Respond appropriately.
`;

    const aiResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "mistralai/mistral-7b-instruct",
          messages: [
            {
              role: "system",
              content:
                "You are EduLearn AI, an assistant for an e-learning platform.",
            },
            { role: "user", content: aiPrompt },
          ],
        }),
      }
    );

    if (!aiResponse.ok) {
      const err = await aiResponse.text();
      console.error("OpenRouter error:", err);
      return res.status(500).json({ error: "AI call failed." });
    }

    const aiData = await aiResponse.json();
    const reply =
      aiData.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I couldn't find a good answer.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Chatbot Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
