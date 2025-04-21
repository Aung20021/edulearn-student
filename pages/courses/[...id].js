import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Spinner from "@/components/Spinner";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function CoursePage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [unenrolling, setUnenrolling] = useState(false);

  const fetchCourse = useCallback(async () => {
    try {
      const response = await fetch(`/api/courses?courseId=${id}`);
      if (!response.ok) throw new Error("Failed to fetch course");
      const data = await response.json();
      setCourse(data);
      setEnrolled(data.enrolledStudents.includes(userId));

      // Update last visited course
      await fetch(`/api/update-last-visited?userId=${userId}&courseId=${id}`, {
        method: "POST",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, userId]);

  useEffect(() => {
    if (!id || !userId) return;
    fetchCourse();
  }, [id, userId, fetchCourse]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const res = await fetch("/api/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: id }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Enrolled successfully");
        await fetchCourse(); // ✅ refreshes course + button state
      } else {
        toast.error(data.error || "Enrollment failed");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setEnrolling(false);
    }
  };

  const handleUnenroll = async () => {
    setUnenrolling(true);
    try {
      const res = await fetch("/api/enroll", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: id }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Unenrolled successfully");
        await fetchCourse(); // ✅ refresh course state
      } else {
        toast.error(data.error || "Unenrollment failed");
      }
    } catch (err) {
      toast.error("Failed to unenroll");
    } finally {
      setUnenrolling(false);
    }
  };

  if (error) return <p className="text-red-500">{error}</p>;
  if (!course) return <p>Course not found</p>;

  return (
    <>
      {(loading || enrolling || unenrolling) && (
        <div className="fixed inset-0 z-40 bg-white bg-opacity-80 flex items-center justify-center">
          <Spinner className="w-20 h-20 text-blue-600" />
        </div>
      )}

      <div className="relative max-w-4xl mx-auto p-8 space-y-6">
        <motion.header
          className="text-center max-w-3xl mx-auto mt-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <motion.h1
            className="text-5xl font-bold text-gray-900 leading-tight sm:text-6xl"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            {course.title}
          </motion.h1>

          <motion.p
            className="mt-4 text-lg sm:text-xl text-gray-600 leading-relaxed text-justify whitespace-pre-line"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {course.description}
          </motion.p>
        </motion.header>

        {/* Enroll / Unenroll Controls */}
        {session?.user?.role === "student" && (
          <div className="text-center space-x-4">
            {!enrolled ? (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300"
              >
                {enrolling ? "Enrolling..." : "Enroll in Course"}
              </button>
            ) : (
              <button
                onClick={handleUnenroll}
                className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition duration-300"
              >
                Unenroll
              </button>
            )}
          </div>
        )}

        {/* Only show lessons if student is enrolled */}
        {enrolled ? (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Lessons
            </h2>
            {course.lessons.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {course.lessons.map((lesson) => (
                  <div
                    key={lesson._id}
                    className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
                  >
                    <h3 className="text-xl font-semibold text-gray-800">
                      {lesson.title}
                    </h3>
                    <div className="mt-4 space-y-2">
                      <Link
                        href={`/lessons/${lesson._id}`}
                        className="block text-blue-500 hover:underline"
                        onClick={async () => {
                          await fetch(
                            `/api/update-last-visited?userId=${userId}&lessonId=${lesson._id}`,
                            { method: "POST" }
                          );
                        }}
                      >
                        View Lesson Details
                      </Link>

                      <Link
                        href={`/quizzes/${lesson._id}`}
                        className="block text-green-500 hover:underline"
                      >
                        Go to Quiz for this Lesson
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">
                No lessons found. Create one below.
              </p>
            )}
          </div>
        ) : (
          <p className="text-center mt-10 text-gray-500 italic">
            Enroll to unlock course lessons and quizzes.
          </p>
        )}
      </div>
    </>
  );
}
