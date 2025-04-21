import Spinner from "@/components/Spinner";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Sparkles,
  GraduationCap,
  BookOpen,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function Home() {
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [popularCourses, setPopularCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastVisitedCourse, setLastVisitedCourse] = useState(null);
  const [lastVisitedLesson, setLastVisitedLesson] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // 👈 Add this state
  const { data: session, status } = useSession();
  const isLoadingSession = status === "loading";
  const router = useRouter();
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
      },
    }),
  };

  useEffect(() => {
    if (session?.user?.id) {
      const userId = session.user.id;

      // Fetch user profile
      fetch(`/api/user?userId=${userId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.user) setUserProfile(data.user);
        });

      // Fetch last visited course and lesson
      fetch(`/api/update-last-visited?userId=${userId}`)
        .then((res) => res.json())
        .then((data) => {
          setLastVisitedCourse(data.lastVisitedCourse);
          setLastVisitedLesson(data.lastVisitedLesson);
          if (data.lastVisitedCourse) {
            sessionStorage.setItem(
              "lastVisitedCourse",
              data.lastVisitedCourse._id
            );
          }
        });

      // Fetch recommended courses
      fetch(`/api/courses?recommend=true&userId=${userId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.recommended) setRecommendedCourses(data.recommended);
        });

      // Fetch popular courses
      fetch(`/api/courses?popular=true`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.popular) setPopularCourses(data.popular);
        });
    }
  }, [session]);
  const renderCourseCard = (course, index) => (
    <motion.div
      key={course._id}
      className="w-full max-w-sm mx-auto group block overflow-hidden rounded-lg shadow-md border border-gray-200 hover:shadow-xl transition"
      variants={cardVariants}
      custom={index}
      whileInView={{ opacity: 1, y: 0 }} // Animate when in view
      initial={{ opacity: 0, y: 20 }} // Initial state when out of view
      viewport={{ once: true, amount: 0.3 }} // Trigger animation when 30% of the element is in view
    >
      {/* Image */}
      <div className="relative w-full h-48 sm:h-56 bg-gray-100">
        <Image
          src={course.image || "/logo.svg"}
          alt={course.title}
          layout="fill"
          objectFit="cover"
          className="transition duration-300 group-hover:scale-105 pointer-events-none"
        />
      </div>

      {/* Content */}
      <Link href={`/courses/${course._id}`}>
        <div className="bg-white px-4 py-3 cursor-pointer">
          <h3 className="text-center font-semibold text-gray-800 truncate">
            {course.title}
          </h3>
          <p className="mt-1 text-sm text-gray-950 text-center">
            Category: {course.category}
          </p>
          <p className="mt-2 text-sm text-gray-700 line-clamp-2 text-center">
            {course.description}
          </p>
        </div>
      </Link>
    </motion.div>
  );

  const handleContinueLearning = () => {
    const lastVisitedCourseId = sessionStorage.getItem("lastVisitedCourse");
    if (lastVisitedCourseId) {
      router.push(`/courses/${lastVisitedCourseId}`);
    } else {
      console.log("No last visited course found.");
    }
  };

  if (isLoadingSession) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (session) {
    return (
      <main className="relative min-h-screen overflow-hidden py-16 px-6">
        {/* 🎨 Animated Gradient Background */}
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-purple-200 via-blue-100 to-indigo-300 bg-size-200 animate-gradient" />
        <div className="absolute inset-0 z-0 bg-white/30 backdrop-blur-sm" />

        {/* 📦 Main Content */}
        <div className="relative z-10">
          <motion.section
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-4xl mx-auto space-y-12"
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-6"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg">
                {userProfile?.image ? (
                  <Image
                    className="rounded-full w-16 h-16"
                    src={userProfile.image}
                    alt={session.user.email}
                    width={64}
                    height={64}
                  />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-12 h-12"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                  </svg>
                )}
              </div>
              <div>
                <h2 className="text-4xl font-semibold text-gray-900">
                  Welcome back 👋
                </h2>
                <p className="text-lg text-gray-600">
                  {userProfile?.name || session.user.email}
                </p>
              </div>
            </motion.div>

            {/* Info Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-r from-indigo-100 to-purple-100 px-6 py-4 text-indigo-900 rounded-xl shadow-lg flex items-center gap-3 text-sm font-medium"
            >
              <Sparkles className="w-5 h-5 text-purple-500" />
              You&apos;re signed in and ready to explore EduLearn!
            </motion.div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="px-6 py-4 bg-indigo-100 rounded-xl hover:bg-indigo-200 transition ease-in-out duration-300 shadow-lg"
              >
                <Link
                  href="/archived"
                  className="flex items-center gap-3 text-gray-800 font-medium hover:text-indigo-600"
                >
                  <GraduationCap className="w-6 h-6 text-indigo-600" />
                  Go to Archived
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="px-6 py-4 bg-green-100 rounded-xl hover:bg-green-200 transition ease-in-out duration-300 shadow-lg"
              >
                <Link
                  href="/courses"
                  className="flex items-center gap-3 text-gray-800 font-medium hover:text-green-600"
                >
                  <BookOpen className="w-6 h-6 text-green-600" />
                  Browse Courses
                </Link>
              </motion.div>
            </div>

            {/* Progress */}
            <div className="text-gray-800 text-sm space-y-2">
              <h4 className="text-xl font-semibold">📚 Your Progress</h4>
              <p>
                Last visited course:{" "}
                <strong className="text-gray-900">
                  {lastVisitedCourse?.title || "Not available"}
                </strong>
              </p>
              <p>
                Last lesson:{" "}
                <strong className="text-gray-900">
                  {lastVisitedLesson?.title || "Not available"}
                </strong>
              </p>
              <button
                onClick={handleContinueLearning}
                className="inline-flex items-center gap-2 text-indigo-600 hover:underline text-sm"
              >
                Continue learning <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Tip */}
            <div className="flex gap-4 items-start text-sm bg-yellow-200 px-6 py-4 rounded-xl text-yellow-800 shadow-lg">
              <Lightbulb className="w-6 h-6 text-yellow-500" />
              <p>
                <strong>Tip:</strong> Take 10 minutes each day to review what
                you learned — it&apos;s better than cramming!
              </p>
            </div>
          </motion.section>

          {/* Recommended Courses */}
          <section className="w-full max-w-4xl mx-auto space-y-10 my-10">
            <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 drop-shadow-sm tracking-tight">
              🌟 Recommended for You
            </h2>

            {recommendedCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {recommendedCourses.map(renderCourseCard)}
              </div>
            ) : (
              <p className="text-lg text-gray-600 italic mt-4">
                No recommendations available at the moment. Check back later!
              </p>
            )}
          </section>

          {/* Popular Courses */}
          {popularCourses.length > 0 && (
            <section className="w-full max-w-4xl mx-auto space-y-10">
              <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-red-500 drop-shadow-sm tracking-tight">
                🔥 Popular Courses
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {popularCourses.map(renderCourseCard)}
              </div>
            </section>
          )}
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white p-5 text-center">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <h1 className="text-4xl font-bold text-gray-800 sm:text-5xl mb-4">
            Empower Your Learning with AI
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            EduLearn creates personalized paths, delivers instant feedback, and
            helps you learn smarter — not harder.
          </p>
        </motion.div>

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="w-full max-w-xl"
        >
          <Image
            src="/learning-illustration.jpg"
            alt="AI Learning Illustration"
            width={600}
            height={400}
            className="mx-auto"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-6"
        >
          <button
            disabled={isLoading}
            onClick={() => {
              setIsLoading(true);
              signIn();
            }}
            className="inline-block shrink-0 rounded-md border border-blue-600 bg-blue-600 px-12 py-3 text-sm font-medium text-white transition hover:bg-transparent hover:text-blue-600 focus:outline-none focus:ring active:text-blue-500"
          >
            Sign In to Get Started
          </button>
        </motion.div>
      </main>
    </>
  );
}
