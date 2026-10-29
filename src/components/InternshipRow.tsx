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

  // Source type badge styling
  const sourceType = internship.sourceType || "portal";
  const renderSourceBadge = () => {
    switch (sourceType) {
      case "linkedin_post":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#0A66C2]/15 text-[#70B5F9] border border-[#0A66C2]/30">
            <Linkedin className="w-2.5 h-2.5" />
            <span>LinkedIn</span>
          </span>
        );
      case "google_form":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#7248B9]/15 text-[#B89CF5] border border-[#7248B9]/30">
            <FileSpreadsheet className="w-2.5 h-2.5" />
            <span>Google Form</span>
          </span>
        );
      case "tiktok":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#FE2C55]/15 text-[#FF758F] border border-[#FE2C55]/30">
            <span>TikTok</span>
          </span>
        );
      case "instagram":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#E1306C]/15 text-[#FFA0B4] border border-[#E1306C]/30">
            <span>Instagram</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#161614] text-[#8E8D8A] border border-[#262624]">
            <Globe className="w-2.5 h-2.5" />
            <span>Portal</span>
          </span>
        );
    }
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
      className="relative py-3.5 px-4 border-b border-[#222220] hover:bg-[#161614] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs overflow-hidden group"
      style={
        {
          "--mouse-x": "0px",
          "--mouse-y": "0px",
        } as any
      }
    >
      {/* Subtle radial mouse-spotlight background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), rgba(217, 119, 87, 0.08), transparent 40%)",
        }}
      />

      {/* Left: Company, Role Title, Category, Source Tag */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-2 md:gap-3 flex-1 min-w-0">
        <div className="flex items-center gap-2 md:w-36 flex-shrink-0">
          <span className="font-mono text-[11px] text-[#8E8D8A] truncate">
            {internship.company.name}
          </span>
        </div>

        <div className="flex items-center gap-2 min-w-0">
          {internship.status === "open" && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] flex-shrink-0"
              title="Open Role"
            />
          )}
          <a
            href={internship.applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-sm text-[#ECECEC] hover:text-white truncate"
          >
            {internship.title}
          </a>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#161614] text-[#8E8D8A] border border-[#262624]">
            {internship.category}
          </span>

          {renderSourceBadge()}

          {internship.submittedBy && (
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#D97757]/10 text-[#D97757] border border-[#D97757]/30">
              via {internship.submittedBy}
            </span>
          )}
        </div>
      </div>

      {/* Middle: Location & Date posted (font-mono) */}
      <div className="relative z-10 flex items-center gap-3 text-[#8E8D8A] font-mono text-xs flex-shrink-0">
        <span>{internship.location}</span>
        <span className="text-[#262624]">/</span>
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
                ? "bg-[#161614] text-blue-400 border-blue-400/40"
                : currentStatus === "interviewing"
                ? "bg-[#161614] text-purple-400 border-purple-400/40"
                : currentStatus === "saved"
                ? "bg-[#161614] text-[#D97757] border-[#D97757]/40"
                : "bg-[#161614] text-[#8E8D8A] border-[#262624] hover:text-[#ECECEC] hover:border-[#383834]"
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
            <div className="absolute right-0 top-full mt-1 w-36 rounded-md bg-[#161614] shadow-xl border border-[#262624] py-1 z-30 text-xs font-mono">
              <button
                type="button"
                onClick={() => handleSelect("saved")}
                className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[#222220] ${
                  currentStatus === "saved" ? "text-[#D97757] font-bold" : "text-[#8E8D8A]"
                }`}
              >
                <span>Saved</span>
                {currentStatus === "saved" && <Check className="w-3 h-3" />}
              </button>
              <button
                type="button"
                onClick={() => handleSelect("applied")}
                className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[#222220] ${
                  currentStatus === "applied" ? "text-blue-400 font-bold" : "text-[#8E8D8A]"
                }`}
              >
                <span>Applied</span>
                {currentStatus === "applied" && <Check className="w-3 h-3" />}
              </button>
              <button
                type="button"
                onClick={() => handleSelect("interviewing")}
                className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[#222220] ${
                  currentStatus === "interviewing" ? "text-purple-400 font-bold" : "text-[#8E8D8A]"
                }`}
              >
                <span>Interviewing</span>
                {currentStatus === "interviewing" && <Check className="w-3 h-3" />}
              </button>

              {currentStatus && (
                <>
                  <div className="border-t border-[#262624] my-1" />
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="w-full text-left px-3 py-1.5 text-rose-400 hover:bg-[#222220]"
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
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono text-[#8E8D8A] hover:text-[#ECECEC] bg-[#161614] border border-[#262624] hover:border-[#383834] transition-colors"
        >
          <span>Apply</span>
          <ArrowUpRight className="w-3 h-3" />
        </a>
      </div>
    </motion.div>
  );
}
