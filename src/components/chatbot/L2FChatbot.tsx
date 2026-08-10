import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  X,
  Send,
  RotateCcw,
  Sparkles,
  Bot,
  ChevronRight,
  Search,
  BookOpen,
  ArrowRight,
  Smile,
  ExternalLink,
  UserCheck
} from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";

export interface CourseCardData {
  id: string;
  title: string;
  category: string;
  price: number;
  originalPrice?: number;
  shortDescription?: string;
  thumbnail?: string;
  slug: string;
  courseUrl: string;
  skillLevel?: string;
  instructorName?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "admin";
  text: string;
  timestamp: Date;
  senderName?: string;
  courses?: CourseCardData[];
}

const QUICK_ACTIONS = [
  { label: "🎬 Video Editing", query: "Show video editing courses" },
  { label: "🤖 AI Courses", query: "Show AI courses" },
  { label: "📈 Digital Marketing", query: "Show digital marketing courses" },
  { label: "▶️ YouTube Growth", query: "Show YouTube growth courses" },
  { label: "💼 Freelancing", query: "Show freelancing courses" },
  { label: "📚 All Categories", query: "What course categories do you have?" },
  { label: "💡 What is L2F?", query: "What is Learn2Future and what is its mission?" },
];

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome-msg",
  role: "assistant",
  text: `Hi! 👋 I'm **L2F Chatbot**, your official Learn2Future AI assistant.

I can help you:
• **Find courses** matching your goals
• **Check course prices** and live details
• **Explore categories** (AI, Video Editing, Marketing, etc.)
• **Compare courses** for beginners or professionals
• **Understand Learn2Future** and our mission
• **Connect with live student support** if needed

What would you like to explore today?`,
  timestamp: new Date()
};

function renderFormattedText(text: string) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1 text-xs text-neutral-200 leading-relaxed font-sans">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        const isBullet = trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*");
        const cleanLine = isBullet ? trimmed.replace(/^[•\-*]\s*/, "") : trimmed;

        const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
        const formattedLine = parts.map((part, pIdx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={pIdx} className="font-semibold text-white">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        });

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 my-0.5">
              <span className="text-brand-gold font-bold shrink-0">•</span>
              <span>{formattedLine}</span>
            </div>
          );
        }

        return <p key={idx} className="my-0.5">{formattedLine}</p>;
      })}
    </div>
  );
}

export const L2FChatbot: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  // Generate or retrieve session ID for real-time Firestore sync
  const [sessionId] = useState<string>(() => {
    let existing = sessionStorage.getItem("l2f_chat_session_id");
    if (!existing) {
      existing = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      sessionStorage.setItem("l2f_chat_session_id", existing);
    }
    return existing;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Real-time listener for live Admin responses from Firestore 'chats' collection
  useEffect(() => {
    if (!sessionId) return;
    try {
      const chatDocRef = doc(db, "chats", sessionId);
      const unsubscribe = onSnapshot(chatDocRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (Array.isArray(data.messages) && data.messages.length > 0) {
            const mapped: ChatMessage[] = data.messages.map((m: any, idx: number) => ({
              id: m.id || `msg-${idx}`,
              role: m.sender === "admin" ? "admin" : m.sender === "assistant" ? "assistant" : "user",
              senderName: m.senderName,
              text: m.text || "",
              timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
              courses: m.courses
            }));
            // Merge with welcome message at the top
            setMessages([WELCOME_MESSAGE, ...mapped]);
          }
        }
      }, (err) => {
        console.warn("Real-time chat listener note:", err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Could not attach real-time chat listener:", e);
    }
  }, [sessionId]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
      setHasUnread(false);
    }
  }, [isOpen, messages]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSendMessage = async (customQuery?: string) => {
    const queryToSend = customQuery || input.trim();
    if (!queryToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: queryToSend,
      timestamp: new Date()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!customQuery) setInput("");
    setIsLoading(true);

    try {
      const historyToSend = newMessages
        .filter((m) => m.id !== "welcome-msg")
        .map((m) => ({
          role: m.role,
          text: m.text
        }));

      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: queryToSend,
          history: historyToSend,
          sessionId
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: data.reply || "I couldn't retrieve that information right now. Please try asking again.",
        timestamp: new Date(),
        courses: Array.isArray(data.courses) && data.courses.length > 0 ? data.courses : undefined
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("L2F Chatbot request error:", err);
      const errorMsg: ChatMessage = {
        id: `assistant-err-${Date.now()}`,
        role: "assistant",
        text: "Sorry, I'm having trouble connecting right now. Please check your internet connection or try again in a moment.",
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([WELCOME_MESSAGE]);
  };

  const handleNavigateToCourse = (slugOrId: string) => {
    navigate(`/course/${slugOrId}`);
    // Keep chatbot open or close based on mobile viewport
    if (window.innerWidth < 640) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button (Bottom-Right) */}
      <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end pointer-events-none select-none">
        {/* Callout Badge Tooltip for First-time visitors */}
        {!isOpen && hasUnread && (
          <div
            onClick={() => setIsOpen(true)}
            className="pointer-events-auto mb-2 px-3.5 py-2 bg-black/90 dark:bg-[#161616]/95 border border-brand-gold/40 text-brand-gold text-[11px] font-mono font-bold rounded-2xl shadow-[0_8px_25px_rgba(234,179,8,0.2)] flex items-center gap-2 animate-bounce cursor-pointer hover:border-brand-gold transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-brand-gold animate-pulse" />
            <span>Need help? Ask <strong>L2F Chatbot</strong></span>
            <X
              className="w-3 h-3 text-neutral-400 hover:text-white shrink-0 ml-1"
              onClick={(e) => {
                e.stopPropagation();
                setHasUnread(false);
              }}
            />
          </div>
        )}

        {/* Floating Toggle Button */}
        <button
          type="button"
          aria-expanded={isOpen}
          aria-label="Toggle L2F AI Chatbot"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`pointer-events-auto relative group flex items-center justify-center rounded-2xl transition-all duration-300 shadow-2xl cursor-pointer ${
            isOpen
              ? "w-12 h-12 bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800"
              : "w-14 h-14 bg-[#0a0a0a] border-2 border-brand-gold/60 text-brand-gold hover:border-brand-gold hover:scale-105 shadow-[0_0_25px_rgba(234,179,8,0.25)]"
          }`}
        >
          {isOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <div className="relative flex items-center justify-center">
              <Bot className="w-6 h-6 text-brand-gold group-hover:rotate-12 transition-transform duration-300" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Main Chat Drawer / Window */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="L2F Chatbot Window"
          className="fixed bottom-20 right-3 sm:right-6 w-[calc(100vw-1.5rem)] sm:w-[410px] h-[580px] max-h-[82vh] bg-[#0c0c0c] border border-neutral-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200"
        >
          {/* Header */}
          <div className="px-4 py-3.5 bg-[#121212]/90 backdrop-blur-md border-b border-neutral-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-brand-gold/20 to-amber-500/10 border border-brand-gold/40 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-brand-gold" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#121212]" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-mono font-bold text-white tracking-wide uppercase">
                    L2F Chatbot
                  </h3>
                  <span className="bg-brand-gold/15 text-brand-gold text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border border-brand-gold/30">
                    AI
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-neutral-400 font-mono">
                    Learn2Future Assistant • Online
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleReset}
                title="Reset Conversation"
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close Chatbot"
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-neutral-800">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              const isAdmin = msg.role === "admin";

              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isAdmin 
                        ? "bg-blue-500/20 border border-blue-400/50 text-blue-400" 
                        : "bg-brand-gold/15 border border-brand-gold/30 text-brand-gold"
                    }`}>
                      {isAdmin ? <UserCheck className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                  )}

                  <div className={`max-w-[85%] space-y-1`}>
                    {isAdmin && (
                      <div className="flex items-center gap-1.5 px-1 text-[10px] font-semibold text-blue-400 uppercase tracking-wider">
                        <UserCheck className="w-3 h-3" />
                        <span>Live Admin Support {msg.senderName ? `(${msg.senderName})` : ""}</span>
                      </div>
                    )}

                    <div
                      className={`p-3.5 rounded-2xl ${
                        isUser
                          ? "bg-brand-gold text-black font-semibold rounded-tr-none text-xs leading-relaxed shadow-md"
                          : isAdmin
                          ? "bg-blue-950/40 border border-blue-500/30 text-neutral-100 rounded-tl-none shadow-sm"
                          : "bg-[#161616] border border-neutral-800 text-neutral-200 rounded-tl-none shadow-sm"
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      ) : (
                        renderFormattedText(msg.text)
                      )}
                    </div>

                    {/* Course Cards Grid inside Assistant Message */}
                    {!isUser && msg.courses && msg.courses.length > 0 && (
                      <div className="space-y-2 mt-2 pt-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 uppercase tracking-wider px-1">
                          <span>Matching Courses ({msg.courses.length})</span>
                          <span className="text-brand-gold">Click to view</span>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          {msg.courses.map((course) => (
                            <div
                              key={course.id || course.slug}
                              onClick={() => handleNavigateToCourse(course.slug || course.id)}
                              className="group bg-[#161616] border border-neutral-800 hover:border-brand-gold/60 rounded-xl p-2.5 flex items-center gap-3 transition-all duration-200 cursor-pointer hover:bg-[#1d1d1d]"
                            >
                              {course.thumbnail ? (
                                <img
                                  src={course.thumbnail}
                                  alt={course.title}
                                  className="w-16 h-12 object-cover rounded-lg shrink-0 group-hover:scale-105 transition-transform duration-200"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-16 h-12 bg-neutral-800 rounded-lg flex items-center justify-center text-neutral-500 shrink-0">
                                  <BookOpen className="w-5 h-5" />
                                </div>
                              )}

                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[9px] font-mono text-brand-gold font-semibold uppercase truncate">
                                    {course.category}
                                  </span>
                                  <span className="text-xs font-mono font-bold text-brand-gold shrink-0">
                                    ₹{course.price}
                                  </span>
                                </div>
                                <h4 className="text-[11.5px] font-bold text-white truncate group-hover:text-brand-gold transition-colors">
                                  {course.title}
                                </h4>
                                {course.shortDescription && (
                                  <p className="text-[10px] text-neutral-400 truncate">
                                    {course.shortDescription}
                                  </p>
                                )}
                              </div>

                              <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-brand-gold transition-colors shrink-0" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <span
                      className={`block text-[9px] font-mono text-neutral-500 ${
                        isUser ? "text-right" : "text-left"
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 items-start">
                <div className="w-7 h-7 rounded-lg bg-brand-gold/15 border border-brand-gold/30 flex items-center justify-center text-brand-gold shrink-0">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-[#161616] border border-neutral-800 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                  <span className="text-xs font-mono text-neutral-400">
                    L2F is searching catalog
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Chips Bar */}
          <div className="px-3 py-2 bg-[#101010] border-t border-neutral-850 overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-1.5 shrink-0">
            {QUICK_ACTIONS.map((action, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(action.query)}
                disabled={isLoading}
                className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-brand-gold/40 text-neutral-300 hover:text-brand-gold rounded-full text-[10.5px] font-medium transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                {action.label}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-[#121212] border-t border-neutral-800 flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me about courses, prices, categories or Learn2Future..."
              disabled={isLoading}
              className="flex-1 bg-black border border-neutral-800 focus:border-brand-gold/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 font-medium focus:outline-none transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Send Message"
              className="w-9 h-9 rounded-xl bg-brand-gold hover:bg-[#ffd34d] disabled:bg-neutral-800 disabled:text-neutral-600 text-black flex items-center justify-center transition-colors shrink-0 cursor-pointer font-bold"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
