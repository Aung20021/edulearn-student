// pages/_app.js
import "@/styles/globals.css";
import { Poppins } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { SessionProvider, useSession } from "next-auth/react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Chatbot from "@/components/Chatbot"; // import the chatbot
import { useState } from "react";
import { Bot, X } from "lucide-react";
// icon for the toggle

const inter = Poppins({ subsets: ["latin"], weight: "400" });

function ChatbotWrapper() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  if (!session) return null;
  return (
    <>
      {/* Floating Chatbot Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg z-50 transition-transform"
        aria-label="Toggle chatbot"
      >
        <Bot className="w-5 h-5" />
      </button>

      {/* Background Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sliding Chatbot Panel */}
      <div
        className={`
          fixed bottom-6 z-50 
          w-full sm:w-[24rem] md:w-[28rem] lg:w-[32rem] max-w-full 
          bg-white/80 backdrop-blur-lg border border-gray-200 rounded-2xl shadow-2xl 
          transition-all duration-300 overflow-hidden 
          ${isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4 pointer-events-none"} 
          left-1/2 md:left-auto md:right-6
          transform 
          ${isOpen ? "translate-x-[-50%] md:translate-x-0" : "translate-x-[-50%] md:translate-x-0"}
        `}
        style={{
          top: "5.5rem",
          maxHeight: "calc(100vh - 6rem)",
        }}
      >
        {/* Close Button */}
        <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200 bg-white/70 backdrop-blur-md">
          <h2 className="text-sm font-semibold text-gray-700">
            EduLearn Chatbot
          </h2>
          <button
            className="text-gray-500 hover:text-red-500"
            onClick={() => setIsOpen(false)}
            aria-label="Close chatbot"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Content */}
        <div
          className="overflow-y-auto p-4"
          style={{ maxHeight: "calc(100vh - 9rem)" }}
        >
          <Chatbot session={session} />
        </div>
      </div>
    </>
  );
}

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  return (
    <SessionProvider session={session}>
      <main
        className={`${inter.className} min-h-screen max-w-screen-2xl mx-auto px-4 bg-background text-accent`}
      >
        <Header />
        <Component {...pageProps} />
        <Toaster position="top-center" reverseOrder={false} />
        <Footer />
        <ChatbotWrapper />
      </main>
    </SessionProvider>
  );
}
