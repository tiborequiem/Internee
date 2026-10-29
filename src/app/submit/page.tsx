"use client";

import { useState } from "react";
import Link from "next/link";
import { QuickDropBar } from "@/components/QuickDropBar";
import { ArrowLeft, Sparkles, ChevronDown } from "lucide-react";

export default function SubmitPage() {
  const [showManualForm, setShowManualForm] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [title, setTitle] = useState("");
  const [applicationUrl, setApplicationUrl] = useState("");
  const [category, setCategory] = useState("Software & Data");
  const [location, setLocation] = useState("Cairo");

  const [loading, setLoading] = useState(false);
  const [manualMessage, setManualMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualMessage(null);

    if (!companyName.trim() || !title.trim() || !applicationUrl.trim()) {
      setManualMessage({ type: "error", text: "Please complete all fields." });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/community/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          title: title.trim(),
          applicationUrl: applicationUrl.trim(),
          category,
          location,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit internship.");
      }

      setManualMessage({
        type: "success",
        text: "Internship submitted successfully! In review by moderators.",
      });

      setCompanyName("");
      setTitle("");
      setApplicationUrl("");
    } catch (err: any) {
      setManualMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-6 space-y-6 font-mono text-xs">
      <div className="flex items-center gap-2 text-[#6c7086]">
        <Link href="/" className="hover:text-[#cdd6f4] flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>Roles</span>
        </Link>
        <span>/</span>
        <span className="text-[#cdd6f4]">Add role</span>
      </div>

      <h1 className="font-sans text-base font-medium text-[#cdd6f4]">
        Add role
      </h1>

      {/* Link Drop Bar */}
      <div>
        <QuickDropBar />
      </div>

      {/* Manual Entry Toggle */}
      <div className="pt-2 border-t border-[#313244]/60">
        <button
          onClick={() => setShowManualForm(!showManualForm)}
          className="flex items-center justify-between w-full text-[#6c7086] hover:text-[#cdd6f4] py-1 transition-colors"
        >
          <span>Manual entry</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showManualForm ? "rotate-180" : ""}`} strokeWidth={1.75} />
        </button>

        {showManualForm && (
          <form
            onSubmit={handleManualSubmit}
            className="mt-3 border border-[#313244]/60 rounded p-4 space-y-3 bg-[#181825]"
          >
            {manualMessage && (
              <div
                className={`p-2 rounded text-xs ${
                  manualMessage.type === "success"
                    ? "bg-[#a6e3a1]/15 text-[#a6e3a1]"
                    : "bg-[#f38ba8]/15 text-[#f38ba8]"
                }`}
              >
                {manualMessage.text}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs text-[#6c7086] block">
                Company
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Swvl, Instabug"
                className="w-full bg-[#11111b] border border-[#313244] focus:border-[#cba6f7] rounded px-3 py-1.5 text-[#cdd6f4] placeholder-[#6c7086] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#6c7086] block">
                Role title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Operations Intern"
                className="w-full bg-[#11111b] border border-[#313244] focus:border-[#cba6f7] rounded px-3 py-1.5 text-[#cdd6f4] placeholder-[#6c7086] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#6c7086] block">
                Application URL
              </label>
              <input
                type="url"
                required
                value={applicationUrl}
                onChange={(e) => setApplicationUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#11111b] border border-[#313244] focus:border-[#cba6f7] rounded px-3 py-1.5 text-[#cdd6f4] placeholder-[#6c7086] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-[#6c7086] block">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#11111b] border border-[#313244] focus:border-[#cba6f7] rounded px-2.5 py-1.5 text-[#cdd6f4] focus:outline-none"
                >
                  <option value="Software & Data">Software &amp; Data</option>
                  <option value="Finance">Finance</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Business">Business</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#6c7086] block">
                  Location
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#11111b] border border-[#313244] focus:border-[#cba6f7] rounded px-2.5 py-1.5 text-[#cdd6f4] focus:outline-none"
                >
                  <option value="Cairo">Cairo</option>
                  <option value="Giza">Giza</option>
                  <option value="Alexandria">Alexandria</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded bg-[#313244] hover:bg-[#45475a] text-[#cdd6f4] font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
