// pages/success.js
import { useEffect, useState } from "react";
import Confetti from "react-confetti"; // Import Confetti
import Link from "next/link";

export default function SuccessPage() {
  const [windowDimensions, setWindowDimensions] = useState({
    width: 0,
    height: 0,
  });

  // Update window dimensions when page is loaded
  useEffect(() => {
    setWindowDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center relative">
      {/* Confetti Effect */}
      <Confetti
        width={windowDimensions.width}
        height={windowDimensions.height}
        gravity={0.1}
        style={{ position: "absolute", zIndex: 99 }}
        numberOfPieces={700}
        recycle={false}
      />

      <h1 className="text-4xl font-bold text-green-600 mb-4">
        Subscription Successful! 🎉
      </h1>
      <p className="text-lg text-gray-700 mb-6">
        Thank you for subscribing. You can now enroll in paid courses.
      </p>
      <Link
        href="/"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
