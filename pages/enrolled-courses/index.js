"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import Spinner from "@/components/Spinner"; // Assuming you have a Spinner component
import { motion } from "framer-motion"; // Import framer-motion for animations
import { useInView } from "react-intersection-observer"; // For triggering animation when element is in view
import Image from "next/image";

// CourseItem component to handle individual course visibility
const CourseItem = ({ course, handleUnenroll }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.3, // Trigger animation when 30% of the element is in view
  });

  return (
    <motion.div
      ref={ref} // Attach ref to the div for inView tracking
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 50 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col sm:flex-row bg-white p-6 rounded-lg shadow-lg transform transition-all"
    >
      <Image
        src={course.image || "/default-course-image.jpg"}
        alt={course.title}
        width={300} // adjust width as needed
        height={300} // adjust height as needed
        className="w-full sm:w-48 h-48 sm:h-auto object-cover rounded-lg mb-4 sm:mb-0 sm:mr-6"
        priority // Optional: if you want this image to load ASAP
      />

      <div className="flex flex-col justify-between sm:flex-grow">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          {course.title}
        </h2>
        <p className="text-gray-600 mb-2">{course.category}</p>
        <p className="text-gray-500 mb-4">Teacher: {course.teacher.name}</p>
        <button
          onClick={() => handleUnenroll(course._id)}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-all"
        >
          Unenroll
        </button>
      </div>
    </motion.div>
  );
};

export default function EnrolledCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch enrolled courses when the component mounts
  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        const { data } = await axios.get("/api/enrolled-courses");
        console.log("Enrolled Courses Data:", data); // Log data received from API

        if (data.success) {
          setCourses(data.courses);
        } else {
          toast.error("No courses found.");
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
        toast.error("Failed to load courses.");
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, []);

  // Unenroll from a course
  const handleUnenroll = async (courseId) => {
    try {
      // Make a DELETE request to unenroll the user
      const { data } = await axios.delete("/api/enroll", {
        data: { courseId }, // Sending courseId in the body of the DELETE request
      });

      if (data.message === "Unenrolled successfully.") {
        // Filter out the unenrolled course from the list
        setCourses((prevCourses) =>
          prevCourses.filter((course) => course._id !== courseId)
        );
        toast.success("Successfully unenrolled from the course.");
      } else {
        toast.error("Failed to unenroll.");
      }
    } catch (error) {
      console.error("Error unenrolling from course:", error);
      toast.error("An error occurred while unenrolling.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
        Enrolled Courses
      </h1>
      <div className="space-y-6">
        {courses.length === 0 ? (
          <p className="text-center text-gray-500">No courses enrolled yet.</p>
        ) : (
          courses.map((course) => (
            <CourseItem
              key={course._id}
              course={course}
              handleUnenroll={handleUnenroll}
            />
          ))
        )}
      </div>
    </div>
  );
}
