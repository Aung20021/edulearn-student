"use client";
import { useState } from "react";
import { useRouter } from "next/navigation"; // Import useRouter
import toast from "react-hot-toast";
import Image from "next/image";

export default function Course({ session }) {
  const router = useRouter(); // Initialize router
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    category: "",
    isPublished: false,
    isPaid: false,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); // Local preview of the image
    }
  };

  // Upload image
  const uploadImage = async () => {
    if (!imageFile) return alert("Please select an image.");

    const formData = new FormData();
    formData.append("file", imageFile);

    try {
      setUploading(true);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Image upload failed");
      }

      const data = await response.json();
      return data.link;
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("Image upload failed");
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!session || !session.user?.id) {
      toast.error("User session not loaded. Please log in.");
      return;
    }

    let imageUrl = formData.image;
    if (imageFile) {
      imageUrl = await uploadImage();
      if (!imageUrl) return;
    }

    try {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          image: imageUrl,
          teacher: session.user.id,
        }),
      });

      if (response.ok) {
        toast.success("Course created successfully!");
        setFormData({
          title: "",
          description: "",
          image: "",
          category: "",
          isPublished: false,
        });
        setImageFile(null);
        setImagePreview(null);

        // Redirect to /courses after success
        router.push("/courses");
      } else {
        const errorData = await response.json();
        toast.error("Error: " + errorData.error);
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      console.error("Error:", error);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 border rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6">Create New Course</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-1">Category</label>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-1">Course Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full p-2 border rounded"
          />
          {uploading && (
            <p className="text-sm mt-1 text-blue-500">Uploading...</p>
          )}
          {imagePreview && (
            <div className="mt-4">
              <p>Image Preview:</p>
              <Image
                src={imagePreview}
                alt="Image Preview"
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="isPublished"
            checked={formData.isPublished}
            onChange={handleChange}
            className="mr-2"
          />
          <label>Publish Course</label>
        </div>
        <div className="flex items-center mt-2">
          <input
            type="checkbox"
            name="isPaid"
            checked={formData.isPaid}
            onChange={handleChange}
            className="mr-2"
          />
          <label>Paid Course</label>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          disabled={uploading}
        >
          {uploading ? "Creating..." : "Create Course"}
        </button>
      </form>
    </div>
  );
}
