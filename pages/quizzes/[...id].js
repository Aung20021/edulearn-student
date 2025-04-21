import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import Spinner from "@/components/Spinner";
import Link from "next/link"; // Import Link for navigation
import { SlArrowLeftCircle } from "react-icons/sl"; // Arrow icon for back button

export default function QuizPage() {
  const router = useRouter();
  const { id } = router.query; // Lesson ID
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [lesson, setLesson] = useState(null); // To hold lesson data

  const fetchLesson = useCallback(async () => {
    try {
      const response = await fetch(`/api/lessons?lessonId=${id}`);
      const data = await response.json();
      setLesson(data);
      console.log("📘 Fetched Lesson:", data);
    } catch (err) {
      console.error("❌ Fetch Lesson Error:", err);
      toast.error("Failed to load lesson info!");
    }
  }, [id]);

  const fetchQuizzes = useCallback(async () => {
    try {
      const response = await fetch(`/api/quizzes?lessonId=${id}`);
      const data = await response.json();
      console.log("✅ Quiz API Response:", data);
      if (!Array.isArray(data)) {
        throw new Error("Invalid quiz data received.");
      }
      setQuizzes(data);
    } catch (err) {
      console.error("❌ Fetch Quiz Error:", err);
      toast.error("Failed to load quizzes!");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetchLesson();
    fetchQuizzes();
  }, [id, fetchLesson, fetchQuizzes]);

  // Delete quiz

  if (loading)
    return (
      <div className="flex justify-center items-center w-screen h-screen">
        <Spinner className="w-16 h-16" />
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold mt-6">Quizzes</h1>
        {/* Back to Course Link */}
        {lesson?.course && (
          <Link
            href={`/courses/${lesson.course._id || lesson.course}`}
            className="group inline-flex items-center gap-3 rounded-lg border border-indigo-600 px-5 py-3 text-indigo-600 transition hover:bg-indigo-600 hover:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <span className="rounded-full bg-white p-1 transition group-hover:bg-emerald-600">
              <SlArrowLeftCircle className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
            </span>
            <span className="font-semibold">Back to Course</span>
          </Link>
        )}
      </div>
      {/* Quizzes List */}
      {quizzes.length === 0 ? (
        <p className="mt-4 text-gray-600">
          No quizzes found for this lesson. You can create one below!
        </p>
      ) : (
        quizzes.map((quiz) => (
          <div key={quiz._id} className="mt-6 p-4 border rounded relative">
            <h2 className="text-xl">{quiz.question}</h2>

            {/* Multiple-choice answers */}
            {quiz.options && quiz.options.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {quiz.options.map((option, index) => (
                  <li
                    key={index}
                    className={`p-3 border rounded cursor-pointer ${
                      selectedAnswers[quiz._id] === option
                        ? "bg-blue-200"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() =>
                      setSelectedAnswers((prev) => ({
                        ...prev,
                        [quiz._id]: option,
                      }))
                    }
                  >
                    {option}
                  </li>
                ))}
              </ul>
            ) : (
              // Text input for open-ended questions
              <textarea
                className="w-full mt-4 p-2 border rounded"
                placeholder="Type your answer here..."
                value={selectedAnswers[quiz._id] || ""}
                onChange={(e) =>
                  setSelectedAnswers((prev) => ({
                    ...prev,
                    [quiz._id]: e.target.value,
                  }))
                }
              />
            )}

            {/* Submit Button */}
            {selectedAnswers[quiz._id] && (
              <button
                className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() =>
                  setFeedback((prev) => ({
                    ...prev,
                    [quiz._id]:
                      selectedAnswers[quiz._id]?.trim().toLowerCase() ===
                      quiz.correctAnswer.toLowerCase()
                        ? "✅ Correct!"
                        : `❌ Incorrect! Correct answer: ${quiz.correctAnswer}`,
                  }))
                }
              >
                Submit
              </button>
            )}

            {/* Feedback Message */}
            {feedback[quiz._id] && (
              <p className="mt-3 font-semibold">{feedback[quiz._id]}</p>
            )}
          </div>
        ))
      )}
    </div>
  );
}
