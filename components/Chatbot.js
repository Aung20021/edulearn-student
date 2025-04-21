import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { Bot, User } from "lucide-react";

const commands = [
  { command: "/createcourse", description: "Generate a new AI-powered course" },
  // Add more commands if needed
];

export default function Chatbot() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expanded, setExpanded] = useState({}); // track which bot messages are expanded
  const containerRef = useRef(null);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    const res = await fetch("/api/chatbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input, session }),
    });

    const data = await res.json();
    const botMsg = { role: "bot", content: data.reply };
    setMessages((prev) => [...prev, botMsg]);
    setInput("");
    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleExpand = (index) => {
    setExpanded((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Utility to truncate long content
  const renderContent = (content, index) => {
    const wordLimit = 50; // threshold in words
    const words = content.split(" ");
    const isLong = words.length > wordLimit;

    if (!isLong) return content;

    if (expanded[index]) {
      return (
        <>
          {content}
          <button
            onClick={() => toggleExpand(index)}
            className="text-blue-500 underline ml-2"
          >
            Show less
          </button>
        </>
      );
    }

    const preview = words.slice(0, wordLimit).join(" ");
    return (
      <>
        {preview}…
        <button
          onClick={() => toggleExpand(index)}
          className="text-blue-500 underline ml-2"
        >
          Read more
        </button>
      </>
    );
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div
        ref={containerRef}
        className="border rounded-lg p-4 h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px] overflow-y-auto bg-white shadow-md mb-4"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex mb-3 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "bot" && (
              <Bot className="text-green-500 mr-2 mt-1" size={20} />
            )}
            <div
              className={`px-4 py-2 rounded-xl max-w-[70%] break-words whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-900"
              }`}
            >
              {msg.role === "bot" ? renderContent(msg.content, i) : msg.content}
            </div>
            {msg.role === "user" && (
              <User className="text-blue-500 ml-2 mt-1" size={20} />
            )}
          </div>
        ))}
      </div>

      <div className="relative">
        <div className="flex mt-2 space-x-2">
          <textarea
            className="border p-3 rounded-md flex-1 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message"
            rows={2}
          />
          <button
            onClick={sendMessage}
            className="bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition"
            disabled={isLoading}
          >
            {isLoading ? "Thinking..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
