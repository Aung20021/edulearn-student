"use client";
import { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import Spinner from "@/components/Spinner";
import { FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function Course() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState(""); // actual query to trigger search
  const [suggestions, setSuggestions] = useState([]);
  const [sort, setSort] = useState("createdAt,DESC");
  const [page, setPage] = useState(1);
  const [totalCourses, setTotalCourses] = useState(0);
  const [isPaid, setIsPaid] = useState(""); // Default value is empty string, meaning no filter

  const perPage = 8;
  const totalPages = Math.ceil(totalCourses / perPage);
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: (index) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        delay: index * 0.1,
        duration: 0.4,
        ease: "easeOut",
      },
    }),
  };

  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Memoizing the fetchCourses function
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: query,
        page: page.toString(),
        sort,
        published: "false", // ✅ Add this line
        isPaid: isPaid !== "" ? isPaid : undefined,
      });

      const response = await fetch(`/api/courses?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses);
        setTotalCourses(data.total);
      } else {
        console.error("Error fetching courses");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }, [query, sort, page, isPaid]);

  // Only trigger search when query, sort, or page changes
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Fetch suggestions as user types
  const fetchSuggestions = async (term) => {
    if (!term) return setSuggestions([]);
    const response = await fetch(
      `/api/courses?search=${term}&page=1&published=false`
    );
    if (response.ok) {
      const data = await response.json();
      const titles = data.courses.map((course) => course.title);
      setSuggestions(titles);
    }
  };

  const handleSearch = () => {
    setPage(1);
    setQuery(search);
    setSuggestions([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleSuggestionClick = (title) => {
    setSearch(title);
    setQuery(title);
    setSuggestions([]);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <section>
      {session && (
        <div className="mx-auto max-w-screen-xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Title and Subtitle */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Course Collection
              </h2>
              <p className="mt-2 max-w-2xl text-gray-600 text-sm sm:text-base">
                These are old courses that have been archived.
              </p>
            </motion.div>
          </motion.div>

          {/* Search & Sort */}
          <motion.div
            className="mb-8 flex justify-between items-start sm:items-center gap-4 flex-col sm:flex-row relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Search Input + Button */}
            <motion.div
              className="flex"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="relative w-full max-w-sm">
                <input
                  type="text"
                  placeholder="Search by title..."
                  value={search}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearch(value);
                    if (value === "") {
                      setQuery("");
                      setSuggestions([]);
                    } else {
                      fetchSuggestions(value);
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  className="w-full border border-gray-300 rounded-md text-sm px-4 py-2 pr-10"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setQuery("");
                      setSuggestions([]);
                    }}
                    className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                )}
                {suggestions.length > 0 && (
                  <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto text-sm">
                    {suggestions.map((title, index) => (
                      <li
                        key={index}
                        onClick={() => handleSuggestionClick(title)}
                        className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                      >
                        {title}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                onClick={handleSearch}
                className="mx-4 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md"
              >
                Search
              </button>
            </motion.div>

            {/* Sort Dropdown */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full max-w-[200px] border-gray-300 rounded-md text-sm px-4 py-2 border"
              >
                <option value="createdAt,DESC">Date, DESC</option>
                <option value="createdAt,ASC">Date, ASC</option>
                <option value="title,DESC">Title, DESC</option>
                <option value="title,ASC">Title, ASC</option>
              </select>
            </motion.div>

            {/* IsPaid Filter Dropdown */}
            <motion.div
              className="mt-4 sm:mt-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <select
                value={isPaid}
                onChange={(e) => setIsPaid(e.target.value)}
                className="w-full max-w-[200px] border-gray-300 rounded-md text-sm px-4 py-2 border"
              >
                <option value="">All Courses</option>
                <option value="true">Paid Courses</option>
                <option value="false">Free Courses</option>
              </select>
            </motion.div>
          </motion.div>

          {/* Course Grid */}
          <motion.div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            initial="hidden"
            animate="visible"
          >
            {courses.length > 0 ? (
              courses.map((course, index) => (
                <motion.div
                  key={course._id}
                  className="group block overflow-hidden rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition"
                  variants={cardVariants}
                  custom={index}
                >
                  {/* Image Section (not clickable) */}
                  <div className="relative w-full h-48 sm:h-56 bg-gray-100">
                    <Image
                      src={course.image || "/logo.svg"}
                      alt={course.title}
                      layout="fill"
                      objectFit="cover"
                      className="transition duration-300 group-hover:scale-105 pointer-events-none"
                    />
                  </div>

                  {/* Text Content (clickable) */}
                  <Link href={`/courses/${course._id}`}>
                    <div className="bg-white px-4 py-3 cursor-pointer">
                      <h3 className="text-center font-semibold text-gray-800 truncate">
                        {course.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-950 text-center">
                        Category : {" " + course.category}
                      </p>
                      <p className="mt-2 text-sm text-gray-700 line-clamp-2 text-center">
                        {course.description}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))
            ) : (
              <motion.p
                className="text-gray-500 col-span-full text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                No courses found.
              </motion.p>
            )}
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.ol
              className="mt-8 flex justify-center gap-1 text-xs font-medium"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {/* Previous Button */}
              <motion.li whileTap={{ scale: 0.95 }}>
                <motion.button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  className="inline-flex size-8 items-center justify-center rounded-sm border border-gray-100"
                  whileHover={{ scale: 1.05 }}
                >
                  <span className="sr-only">Prev Page</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-3"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
                  </svg>
                </motion.button>
              </motion.li>

              {/* Page Numbers */}
              {Array.from({ length: totalPages }, (_, i) => (
                <motion.li key={i} whileTap={{ scale: 0.95 }}>
                  <motion.button
                    onClick={() => setPage(i + 1)}
                    className={`block size-8 rounded-sm border text-center leading-8 transition-all ${
                      page === i + 1
                        ? "border-black bg-black text-white"
                        : "border-gray-100"
                    }`}
                    whileHover={{ scale: 1.05 }}
                  >
                    {i + 1}
                  </motion.button>
                </motion.li>
              ))}

              {/* Next Button */}
              <motion.li whileTap={{ scale: 0.95 }}>
                <motion.button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  className="inline-flex size-8 items-center justify-center rounded-sm border border-gray-100"
                  whileHover={{ scale: 1.05 }}
                >
                  <span className="sr-only">Next Page</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-3"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
                  </svg>
                </motion.button>
              </motion.li>
            </motion.ol>
          )}
        </div>
      )}
    </section>
  );
}
