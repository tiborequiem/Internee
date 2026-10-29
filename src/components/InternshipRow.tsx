"use client";

import { useState, useRef, MouseEvent } from "react";
import { InternshipWithCompany } from "@/db/schema";
import { useSavedInternships, TrackingStatus } from "@/hooks/useSavedInternships";
import { formatRelativeTime } from "@/lib/utils";
import { ArrowUpRight, ChevronDown, Check, Bookmark, FileSpreadsheet, Linkedin, Globe } from "lucide-react";
import { motion } from "framer-motion";

interface InternshipRowProps {
  internship: InternshipWithCompany;
}

export function InternshipRow({ internship }: InternshipRowProps) {
  const { savedItems, setItemStatus, removeItem, isLoaded } = useSavedInternships();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  const currentStatus: TrackingStatus | null = isLoaded ? savedItems[internship.id] || null : null;

  const handleSelect = (status: TrackingStatus) => {
    setItemStatus(internship.id, status);
    setDropdownOpen(false);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeItem(internship.id);
    setDropdownOpen(false);
  };

  // Mouse-tracking spotlight coordinates
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!rowRef.current) return;
    const rect = rowRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    rowRef.current.style.setProperty("--mouse-x", `${x}px`);
    rowRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

  // Source type badge styling adhering to Catppuccin Mocha
  const renderSourceBadge = () => {
    const src = (internship.source || "").toLowerCase();
    const url = (internship.applicationUrl || "").toLowerCase();
    const st = (internship.sourceType || "").toLowerCase();

    if (src === "wuzzuf" || url.includes("wuzzuf.net")) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#89b4fa]/15 text-[#89b4fa] border border-[#89b4fa]/35">
          <span>Wuzzuf</span>
        </span>
      );
    }
    if (src === "indeed" || url.includes("indeed.com")) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#fab387]/15 text-[#fab387] border border-[#fab387]/35">
          <span>Indeed</span>
        </span>
      );
    }
    if (src === "glassdoor" || url.includes("glassdoor.com")) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#a6e3a1]/15 text-[#a6e3a1] border border-[#a6e3a1]/35">
          <span>Glassdoor</span>
        </span>
      );
    }
    if (src === "workable" || url.includes("workable.com") || url.includes("smartrecruiters.com")) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#94e2d5]/15 text-[#94e2d5] border border-[#94e2d5]/35">
          <span>Workable</span>
        </span>
      );
    }
    if (src.includes("linkedin") || st === "linkedin_post" || url.includes("linkedin.com")) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#74c7ec]/15 text-[#74c7ec] border border-[#74c7ec]/35">
          <Linkedin className="w-2.5 h-2.5" />
          <span>LinkedIn</span>
        </span>
      );
    }
    if (src === "community" || src === "community_drop") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#cba6f7]/15 text-[#cba6f7] border border-[#cba6f7]/35">
          <span>Community</span>
        </span>
      );
    }
    if (st === "google_form" || url.includes("docs.google.com/forms")) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#fab387]/15 text-[#fab387] border border-[#fab387]/35">
          <FileSpreadsheet className="w-2.5 h-2.5" />
          <span>Google Form</span>
        </span>
      );
    }
    if (st === "tiktok" || url.includes("tiktok.com")) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#f5c2e7]/15 text-[#f5c2e7] border border-[#f5c2e7]/35">
          <span>TikTok</span>
        </span>
      );
    }
    if (st === "instagram" || url.includes("instagram.com")) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#f5c2e7]/15 text-[#f5c2e7] border border-[#f5c2e7]/35">
          <span>Instagram</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#94e2d5]/15 text-[#94e2d5] border border-[#94e2d5]/35">
        <Globe className="w-2.5 h-2.5" />
        <span>Portal</span>
      </span>
    );
  };

  return (
    <motion.div
      ref={rowRef}
      onMouseMove={handleMouseMove}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className="relative py-3.5 px-4 border-b border-[#313244] hover:bg-[#313244]/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs overflow-hidden group"
      style={
        {
          "--mouse-x": "0px",
          "--mouse-y": "0px",
        } as any
      }
    >
      {/* Subtle radial mouse-spotlight background in Mocha Mauve */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), rgba(203, 166, 247, 0.08), transparent 40%)",
        }}
      />

      {/* Left: Company, Role Title, Category, Source Tag */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-2 md:gap-3 flex-1 min-w-0">
        <div className="flex items-center gap-2 md:w-36 flex-shrink-0">
          <span className="font-mono text-[11px] text-[#a6adc8] truncate font-medium">
            {internship.company.name}
          </span>
        </div>

        <div className="flex items-center gap-2 min-w-0">
          {internship.status === "open" && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#a6e3a1] flex-shrink-0 shadow-[0_0_6px_#a6e3a1]"
              title="Open Role"
            />
          )}
          <a
            href={internship.applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-sm text-[#cdd6f4] hover:text-[#cba6f7] transition-colors truncate"
          >
            {internship.title}
          </a>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#313244] text-[#a6adc8] border border-[#45475a]">
            {internship.category}
          </span>

          {renderSourceBadge()}

          {internship.submittedBy && (
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#cba6f7]/15 text-[#cba6f7] border border-[#cba6f7]/35">
              via {internship.submittedBy}
            </span>
          )}
        </div>
      </div>

      {/* Middle: Location & Date posted (font-mono) */}
      <div className="relative z-10 flex items-center gap-3 text-[#a6adc8] font-mono text-xs flex-shrink-0">
        <span>{internship.location}</span>
        <span className="text-[#45475a]">/</span>
        <span>{formatRelativeTime(internship.postedAt || internship.createdAt)}</span>
      </div>

      {/* Right: Compact Bookmark Selector + Apply ↗ */}
      <div className="relative z-10 flex items-center gap-2 flex-shrink-0">
        {/* Bookmark Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-colors border ${
              currentStatus === "applied"
                ? "bg-[#313244] text-[#74c7ec] border-[#74c7ec]/50"
                : currentStatus === "interviewing"
                ? "bg-[#313244] text-[#b4befe] border-[#b4befe]/50"
                : currentStatus === "saved"
                ? "bg-[#313244] text-[#cba6f7] border-[#cba6f7]/50"
                : "bg-[#181825] text-[#a6adc8] border-[#45475a] hover:text-[#cdd6f4] hover:border-[#585b70]"
            }`}
          >
            <Bookmark className="w-3 h-3" />
            <span>
              {currentStatus
                ? currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)
                : "Save"}
            </span>
            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 rounded-md bg-[#181825] shadow-2xl border border-[#45475a] py-1 z-30 text-xs font-mono">
              <button
                type="button"
                onClick={() => handleSelect("saved")}
                className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[#313244] ${
                  currentStatus === "saved" ? "text-[#cba6f7] font-bold" : "text-[#a6adc8]"
                }`}
              >
                <span>Saved</span>
                {currentStatus === "saved" && <Check className="w-3 h-3 text-[#cba6f7]" />}
              </button>
              <button
                type="button"
                onClick={() => handleSelect("applied")}
                className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[#313244] ${
                  currentStatus === "applied" ? "text-[#74c7ec] font-bold" : "text-[#a6adc8]"
                }`}
              >
                <span>Applied</span>
                {currentStatus === "applied" && <Check className="w-3 h-3 text-[#74c7ec]" />}
              </button>
              <button
                type="button"
                onClick={() => handleSelect("interviewing")}
                className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[#313244] ${
                  currentStatus === "interviewing" ? "text-[#b4befe] font-bold" : "text-[#a6adc8]"
                }`}
              >
                <span>Interviewing</span>
                {currentStatus === "interviewing" && <Check className="w-3 h-3 text-[#b4befe]" />}
              </button>

              {currentStatus && (
                <>
                  <div className="border-t border-[#45475a] my-1" />
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="w-full text-left px-3 py-1.5 text-[#f38ba8] hover:bg-[#313244]"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Apply Link */}
        <a
          href={internship.applicationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono text-[#a6adc8] hover:text-[#cba6f7] bg-[#181825] border border-[#45475a] hover:border-[#cba6f7] transition-colors"
        >
          <span>Apply</span>
          <ArrowUpRight className="w-3 h-3" />
        </a>
      </div>
    </motion.div>
  );
}
