"use client";

import { useState } from "react";
import { Link2, AtSign, ArrowRight, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
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
        text: data.message || "Role submitted successfully.",
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
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 rounded-md bg-[#181825] border border-[#313244] focus-within:border-[#cba6f7] transition-colors duration-120"
      >
        {/* URL Input */}
        <div className="relative flex-1 flex items-center">
          <Link2 className="w-3.5 h-3.5 text-[#a6adc8] ml-2.5 flex-shrink-0" strokeWidth={1.75} />
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste LinkedIn, Google Form, or career URL..."
            className="w-full bg-transparent px-2.5 py-1 text-xs text-[#cdd6f4] placeholder-[#6c7086] focus:outline-none font-mono"
          />
        </div>

        {/* Optional Credit Handle */}
        <div className="relative sm:w-32 flex items-center border-t sm:border-t-0 sm:border-l border-[#313244] pt-1.5 sm:pt-0 sm:pl-1">
          <AtSign className="w-3.5 h-3.5 text-[#6c7086] ml-2 flex-shrink-0" strokeWidth={1.75} />
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="handle"
            title="Optional @handle for credit"
            className="w-full bg-transparent px-2 py-1 text-xs text-[#cdd6f4] placeholder-[#6c7086] focus:outline-none font-mono"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded bg-[#cba6f7] hover:bg-[#b4befe] text-[#11111b] text-xs font-mono font-medium transition-colors duration-120 disabled:opacity-50 flex-shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.75} />
              <span>Parsing...</span>
            </>
          ) : (
            <>
              <span>Add link</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            </>
          )}
        </button>
      </form>

      {/* Message alert */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className={`p-2 rounded text-xs font-mono flex items-center gap-2 border ${
              message.type === "success"
                ? "bg-[#181825] border-[#a6e3a1]/40 text-[#a6e3a1]"
                : "bg-[#181825] border-[#f38ba8]/40 text-[#f38ba8]"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-[#a6e3a1]" strokeWidth={1.75} />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-[#f38ba8]" strokeWidth={1.75} />
            )}
            <span className="flex-1">{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="text-[#a6adc8] hover:text-[#cdd6f4]"
            >
              <X className="w-3 h-3" strokeWidth={1.75} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
