"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import Image from "next/image";
import Spinner from "@/components/Spinner";

export default function SubscribePage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [activePlan, setActivePlan] = useState(null);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch("/api/prices");
        const data = await res.json();
        setPlans(data.prices || []);
      } catch (error) {
        toast.error("Failed to fetch plans.");
        console.error("Error fetching plans:", error);
      }
    };

    fetchPrices();
  }, []);

  const handleSubscribe = async (priceId) => {
    if (!session) {
      toast.error("You must be logged in to subscribe.");
      return;
    }

    setActivePlan(priceId);
    setLoading(true);

    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          userId: session.user.id,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Something went wrong");
      }
    } catch (err) {
      toast.error("Failed to redirect to Stripe");
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-300 via-purple-200 to-pink-200 overflow-hidden">
      <Image
        src="/EduLearn.jfif"
        alt="EduLearn background"
        layout="fill"
        objectFit="cover"
        className="z-0 opacity-20 blur-sm"
        priority
      />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-4xl w-full p-8 rounded-3xl bg-white/70 backdrop-blur-lg shadow-2xl space-y-8"
      >
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-purple-600 to-pink-600">
            Choose Your Subscription
          </h1>
          <p className="text-gray-600 mt-2">
            Unlock access to premium learning experiences
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...plans].reverse().map((plan) => (
            <motion.div
              key={plan.id}
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="bg-white/80 border border-purple-200 rounded-xl p-6 shadow-md hover:shadow-xl backdrop-blur"
            >
              <h2 className="text-2xl font-semibold text-indigo-800 mb-2">
                {plan.name}
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                {`${plan.amount} ${plan.currency} / ${plan.interval}`}
              </p>
              <button
                onClick={() => handleSubscribe(plan.id)}
                className="w-full py-2 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition"
              >
                Subscribe
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {loading && (
        <div className="fixed inset-0 z-50 bg-white/70 backdrop-blur-sm flex items-center justify-center">
          <Spinner />
        </div>
      )}
    </main>
  );
}
