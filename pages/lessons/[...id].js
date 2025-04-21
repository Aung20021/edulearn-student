import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Spinner from "@/components/Spinner";
import CustomVideoPlayer from "@/components/CustomVideoPlayer";
import { FiTrash, FiDownload, FiPlus } from "react-icons/fi";
import { MdOutlineClose, MdPictureAsPdf, MdVideoLibrary } from "react-icons/md";
import Link from "next/link";
import Image from "next/image";
import { SlArrowLeftCircle } from "react-icons/sl";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function LessonPage() {
  const router = useRouter();
  const { id } = router.query;
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [availableResources, setAvailableResources] = useState([]);

  // Fetch lesson and tabs from the backend
  useEffect(() => {
    if (!id) return; // Prevent fetch if no lesson ID

    const fetchLessonAndTabs = async () => {
      try {
        // Fetch lesson data (includes all resources)
        const lessonResponse = await fetch(`/api/lessons?lessonId=${id}`);
        if (!lessonResponse.ok) throw new Error("Failed to fetch lesson data");
        const lessonData = await lessonResponse.json();
        setLesson(lessonData);

        // Fetch tab data (includes resources assigned to each tab)
        const tabResponse = await fetch(`/api/tab?lessonId=${id}`);
        if (!tabResponse.ok) throw new Error("Failed to fetch tab data");
        const tabData = await tabResponse.json();
        setTabs(tabData);

        // Filter out resources already assigned to any tab
        const allResources = [
          ...(lessonData.pdfResources || []),
          ...(lessonData.wordResources || []),
          ...(lessonData.imageResources || []),
          ...(lessonData.videoResources || []),
          ...(lessonData.txtResources || []),
          ...(lessonData.zipResources || []),
          ...(lessonData.pptResources || []),
        ];

        // Extract all assigned resources from tabs
        const assignedResources = tabData.flatMap((tab) => tab.resources);

        // Filter available resources (those not assigned to any tab)
        const unassignedResources = allResources.filter(
          (resource) =>
            !assignedResources.some((assigned) => assigned._id === resource._id)
        );
        setAvailableResources(unassignedResources);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLessonAndTabs();
  }, [id]); // Only trigger when 'id' changes

  if (loading)
    return (
      <div className="flex justify-center items-center w-screen h-screen">
        <Spinner className="w-16 h-16" />
      </div>
    );

  if (error) return <p className="text-red-500">{error}</p>;
  if (!lesson) return <p className="text-red-500">❌ Lesson not found</p>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
      {/* Title & Edit */}
      <motion.div
        className=" md:flex-row md:items-center md:justify-between gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <div className="flex flex-wrap items-center gap-4 my-8">
          {/* Back to Courses Link */}
          {lesson?.course && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <Link
                href={`/courses/${lesson.course._id || lesson.course}`}
                className="group inline-flex items-center gap-3 rounded-lg border border-indigo-600 px-5 py-3 text-indigo-600 transition hover:bg-indigo-600 hover:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <span className="rounded-full bg-white p-1 transition group-hover:bg-emerald-600">
                  <SlArrowLeftCircle className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
                </span>
                <span className="font-semibold">Back to Course</span>
              </Link>
            </motion.div>
          )}
        </div>
        <div>
          <motion.h1
            className="text-4xl font-extrabold text-gray-900"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            {lesson.title}
          </motion.h1>
          <motion.p
            className="mt-4 text-lg sm:text-xl text-gray-600 leading-relaxed text-justify whitespace-pre-line"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            {lesson.content}
          </motion.p>
        </div>
      </motion.div>

      {/* Tabs */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Lesson Tabs</h2>
        <div className="flex flex-wrap items-center gap-3">
          {tabs.length === 0 ? (
            <p className="text-gray-500">⚠️ Course has no resources</p>
          ) : (
            tabs.map((tab) => (
              <div
                key={tab._id}
                className="flex items-center bg-gray-100 rounded-md shadow-sm"
              >
                <button
                  onClick={() => setActiveTab(tab._id)}
                  className={`px-4 py-2 rounded-l-md text-sm font-medium transition ${
                    activeTab === tab._id
                      ? "bg-blue-600 text-white"
                      : "hover:bg-gray-200"
                  }`}
                >
                  {tab.name}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Active Tab Content */}
        {activeTab ? (
          tabs
            .filter((tab) => tab._id === activeTab)
            .map((tab) => (
              <div
                key={tab._id}
                className="mt-6 p-6 rounded-lg bg-white border shadow"
              >
                <h3 className="text-xl font-bold text-gray-800">{tab.name}</h3>
                {tab.resources.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-6 mt-4">
                    {tab.resources.map((res, index) => (
                      <div
                        key={index}
                        className="p-4 border rounded-lg shadow bg-gray-50"
                      >
                        <p className="font-semibold text-blue-600">
                          {res.name}
                        </p>

                        {/* Resource Preview */}
                        {res.url.endsWith(".pdf") && (
                          <div className="mt-2">
                            <MdPictureAsPdf
                              size={20}
                              className="text-red-500 mb-1"
                            />
                            <iframe
                              src={res.url}
                              className="w-full h-56 border"
                            />
                          </div>
                        )}
                        {(res.url.endsWith(".docx") ||
                          res.url.endsWith(".pptx")) && (
                          <iframe
                            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
                              res.url
                            )}`}
                            className="w-full h-56 border mt-2"
                          />
                        )}
                        {res.url.endsWith(".txt") && (
                          <iframe
                            src={res.url}
                            className="w-full h-56 border mt-2"
                          />
                        )}
                        {res.url.match(/\.(jpeg|jpg|png|gif)$/) && (
                          <Image
                            src={res.url}
                            alt={res.name}
                            width={800}
                            height={450}
                            className="w-full h-auto border mt-2 rounded-lg object-cover"
                          />
                        )}
                        {res.url.match(/\.(mp4|webm)$/) && (
                          <div className="mt-2">
                            <MdVideoLibrary
                              size={20}
                              className="text-blue-500 mb-1"
                            />
                            <CustomVideoPlayer file={{ url: res.url }} />
                          </div>
                        )}

                        {/* Buttons */}
                        <div className="flex justify-between items-center mt-4">
                          <a
                            href={res.url}
                            download
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
                          >
                            <FiDownload size={16} /> Download
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 mt-4">
                    ⚠️ No resources in this tab.
                  </p>
                )}
              </div>
            ))
        ) : (
          <p className="text-gray-500 mt-4">⚠️ No active tab selected.</p>
        )}
      </section>
    </div>
  );
}
