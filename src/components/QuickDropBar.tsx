"use client";

import { useState } from "react";
import { Link2, AtSign, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface QuickDropBarProps {
  onSuccess?: () => void;
}

export function QuickDropBar({ onSuccess }: QuickDropBarProps) {
  const [url, setUrl] = useState("");
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/community/quick-drop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), handle: handle.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to drop link.");
      }

      setMessage({
        type: "success",
        text: data.message || "Internship dropped successfully! Live on the board.",
      });

      setUrl("");
      setHandle("");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-2">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 rounded-lg bg-[#181825] border border-[#45475a] focus-within:border-[#cba6f7] transition-colors"
      >
        {/* URL Input */}
        <div className="relative flex-1 flex items-center">
          <Link2 className="w-4 h-4 text-[#a6adc8] ml-2.5 flex-shrink-0" />
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Drop a LinkedIn post, Google Form, TikTok, IG Reel, or careers URL..."
            className="w-full bg-transparent px-3 py-1.5 text-xs text-[#cdd6f4] placeholder-[#6c7086] focus:outline-none font-mono"
          />
        </div>

        {/* Optional Credit Handle */}
        <div className="relative sm:w-36 flex items-center border-t sm:border-t-0 sm:border-l border-[#45475a] pt-1.5 sm:pt-0 sm:pl-1">
          <AtSign className="w-3.5 h-3.5 text-[#a6adc8] ml-2 flex-shrink-0" />
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="handle"
            title="Optional @handle for credit"
            className="w-full bg-transparent px-2 py-1.5 text-xs text-[#cdd6f4] placeholder-[#6c7086] focus:outline-none font-mono"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded bg-[#cba6f7] hover:bg-[#b4befe] text-[#11111b] text-xs font-mono font-semibold transition-colors disabled:opacity-50 flex-shrink-0 shadow-md shadow-[#cba6f7]/20"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Parsing...</span>
            </>
          ) : (
            <>
              <span>Drop Link</span>
              <ArrowRight className="w-3 h-3" />
            </>
          )}
        </button>
      </form>

      {/* Animated notification message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className={`p-2 rounded text-[11px] font-mono flex items-center gap-2 border ${
              message.type === "success"
                ? "bg-[#181825] border-[#a6e3a1]/40 text-[#a6e3a1]"
                : "bg-[#181825] border-[#f38ba8]/40 text-[#f38ba8]"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-[#a6e3a1]" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-[#f38ba8]" />
            )}
            <span className="flex-1">{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="text-[#a6adc8] hover:text-[#cdd6f4] text-[10px]"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
