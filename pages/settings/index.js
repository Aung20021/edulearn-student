"use client";

import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import Spinner from "@/components/Spinner";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

export default function Settings() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [imageFile, setImageFile] = useState(null); // Corrected here
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [subscription, setSubscription] = useState(null); // Removed the TypeScript-style annotation
  const [timeLeft, setTimeLeft] = useState("");

  // Fetch user data from DB
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!session?.user?.email) return;

      try {
        const { data } = await axios.get("/api/user", {
          params: { email: session.user.email },
        });

        if (data.success && data.user) {
          setName(data.user.name || "");
          setImage(data.user.image || "");
        } else {
          toast.error("User not found in database");
        }
      } catch (err) {
        console.error("Fetch user info failed:", err);
        toast.error("Failed to load profile");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchUserInfo();
  }, [session?.user?.email]);

  // Fetch subscription status
  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const { data } = await axios.get("/api/subscription-status");

        if (data?.subscription) {
          setSubscription(data.subscription);
          updateTimeLeft(data.subscription.endDate);
        }
      } catch (err) {
        console.error("Error fetching subscription status:", err);
      }
    };

    fetchSubscriptionStatus();
  }, []);

  // Timer for updating timeLeft
  useEffect(() => {
    if (!subscription?.endDate || !subscription.isActive) return;

    const interval = setInterval(() => {
      updateTimeLeft(subscription.endDate);
    }, 60000); // update every minute

    return () => clearInterval(interval);
  }, [subscription]);
  const handleUnsubscribe = async () => {
    if (!confirm("Are you sure you want to cancel your subscription?")) return;

    try {
      const res = await axios.post("/api/unsubscribe");
      if (res.status === 200) {
        toast.success("Unsubscribed successfully.");
        setSubscription((prev) => ({
          ...prev,
          isActive: false,
          endDate: new Date().toISOString(), // Set to now
        }));
      } else {
        toast.error(res.data?.error || "Failed to unsubscribe.");
      }
    } catch (err) {
      console.error("Unsubscribe error:", err);
      toast.error("Failed to unsubscribe.");
    }
  };

  const updateTimeLeft = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffMs = end.getTime() - now.getTime();

    if (diffMs <= 0) {
      setTimeLeft("Expired");
      return;
    }

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);

    setTimeLeft(`${days}d ${hours}h ${minutes}m`);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImage(URL.createObjectURL(file));
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return image;

    const formData = new FormData();
    formData.append("file", imageFile);

    try {
      const { data } = await axios.post("/api/upload", formData);
      return data.link;
    } catch (err) {
      console.error("Image upload error:", err);
      toast.error("Image upload failed");
      return image;
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const imageUrl = await uploadImage();

      const { data } = await axios.put("/api/user", {
        name,
        image: imageUrl,
        email: session?.user?.email,
      });

      if (data.success) {
        await update({ name, image: imageUrl });
        toast.success("Profile updated");
        router.push("/");
      } else {
        toast.error("Update failed");
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Could not update profile");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  if (!session || initialLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-tr from-gray-50 to-blue-50 px-4 py-12 sm:px-8">
      {loading && (
        <div className="absolute inset-0 z-50 bg-white/70 backdrop-blur-md flex items-center justify-center">
          <Spinner className="w-12 h-12 text-blue-600" />
        </div>
      )}

      <motion.div
        className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10 bg-white shadow-xl rounded-3xl p-6 sm:p-10 border border-blue-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Left Panel */}
        <div className="space-y-6 sm:col-span-1">
          <h2 className="text-3xl font-extrabold text-blue-800">Settings</h2>
          <p className="text-gray-500 text-sm">
            Manage your account info and subscription. Changes will reflect
            immediately.
          </p>

          <div className="space-y-4">
            {subscription && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-sm">
                <div className="font-medium text-blue-800 mb-1">
                  Subscription Status
                </div>
                <p>
                  <span className="font-semibold">Status:</span>{" "}
                  {subscription.isActive ? (
                    <span className="text-green-600">Active</span>
                  ) : (
                    <span className="text-red-500">Inactive</span>
                  )}
                </p>
                <p>
                  <span className="font-semibold">Interval:</span>{" "}
                  {subscription.interval}
                </p>
                <p>
                  <span className="font-semibold">Time Left:</span>{" "}
                  {subscription.isActive ? timeLeft : "Expired"}
                </p>

                {subscription.isActive && (
                  <button
                    onClick={handleUnsubscribe}
                    className="mt-3 inline-block px-4 py-2 rounded-md bg-yellow-500 text-white hover:bg-yellow-600 text-xs font-medium"
                  >
                    Cancel Subscription
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="sm:col-span-2 space-y-6">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Profile Photo
            </label>
            <div className="flex items-center gap-4 flex-wrap">
              {image ? (
                <Image
                  src={image}
                  alt="Profile"
                  width={48}
                  height={48}
                  className="rounded-full border border-gray-300 shadow"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center text-gray-400 text-xs">
                  No Img
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="text-sm text-gray-500"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-between flex-wrap gap-4 pt-4">
            <button
              onClick={logout}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-400 transition"
            >
              Logout
            </button>
            <button
              onClick={handleSave}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
