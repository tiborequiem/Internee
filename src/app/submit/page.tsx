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
    <div className="max-w-xl mx-auto py-8 space-y-6 font-mono text-xs">
      <div className="flex items-center gap-2 text-[#a6adc8]">
        <Link href="/" className="hover:text-[#cdd6f4] flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Active Openings</span>
        </Link>
        <span>/</span>
        <span className="text-[#cdd6f4]">1-Click Drop Link</span>
      </div>

      <div className="space-y-1">
        <h1 className="font-sans text-xl font-semibold text-[#cdd6f4] tracking-tight">
          Drop an Internship Link
        </h1>
        <p className="text-[#a6adc8]">
          Paste any LinkedIn post, Google Form, TikTok, or job link. Our parser auto-extracts role details.
        </p>
      </div>

      {/* 1-Click Drop Bar (Primary) */}
      <div className="p-4 rounded-lg bg-[#181825] border border-[#45475a] space-y-3 shadow-xl">
        <div className="flex items-center gap-1.5 text-xs text-[#cdd6f4] font-sans font-medium">
          <Sparkles className="w-4 h-4 text-[#cba6f7]" />
          <span>Instant 1-Click Link Drop</span>
        </div>
        <QuickDropBar />
      </div>

      {/* Quality Standards Alert */}
      <div className="p-3.5 rounded-lg bg-[#181825] border border-[#45475a] text-[#a6adc8] space-y-1">
        <span className="text-[#cdd6f4] font-semibold block">Quality Standard</span>
        <p className="leading-relaxed">
          Must be an undergraduate or graduate internship located in Egypt. Full-time, junior, and
          past-year roles are automatically blocked by the filter.
        </p>
      </div>

      {/* Advanced Manual Entry Toggle */}
      <div className="pt-2 border-t border-[#313244]">
        <button
          onClick={() => setShowManualForm(!showManualForm)}
          className="flex items-center justify-between w-full text-[#a6adc8] hover:text-[#cdd6f4] py-1"
        >
          <span>Need custom manual entry?</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showManualForm ? "rotate-180" : ""}`} />
        </button>

        {showManualForm && (
          <form
            onSubmit={handleManualSubmit}
            className="mt-3 bg-[#181825] border border-[#45475a] rounded-lg p-4 space-y-3 animate-in fade-in"
          >
            {manualMessage && (
              <div
                className={`p-2 rounded text-[11px] ${
                  manualMessage.type === "success"
                    ? "bg-[#a6e3a1]/15 text-[#a6e3a1] border border-[#a6e3a1]/40"
                    : "bg-[#f38ba8]/15 text-[#f38ba8] border border-[#f38ba8]/40"
                }`}
              >
                {manualMessage.text}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] uppercase text-[#a6adc8] font-semibold block">
                Company Name
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Swvl, Instabug"
                className="w-full bg-[#11111b] border border-[#313244] focus:border-[#cba6f7] rounded px-3 py-1.5 text-[#cdd6f4] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase text-[#a6adc8] font-semibold block">
                Role Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Operations Summer Intern"
                className="w-full bg-[#11111b] border border-[#313244] focus:border-[#cba6f7] rounded px-3 py-1.5 text-[#cdd6f4] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase text-[#a6adc8] font-semibold block">
                Application URL
              </label>
              <input
                type="url"
                required
                value={applicationUrl}
                onChange={(e) => setApplicationUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#11111b] border border-[#313244] focus:border-[#cba6f7] rounded px-3 py-1.5 text-[#cdd6f4] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-[#a6adc8] font-semibold block">
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
                <label className="text-[10px] uppercase text-[#a6adc8] font-semibold block">
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
              className="w-full py-2 rounded bg-[#313244] hover:bg-[#45475a] border border-[#45475a] text-[#cdd6f4] font-sans font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Manual Form"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
