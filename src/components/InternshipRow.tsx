"use client";

import { useState } from "react";
import { InternshipWithCompany } from "@/db/schema";
import { useSavedInternships, TrackingStatus } from "@/hooks/useSavedInternships";
import { formatRelativeTime } from "@/lib/utils";
import { ChevronDown, Check, Bookmark } from "lucide-react";

interface InternshipRowProps {
  internship: InternshipWithCompany;
  isSelected?: boolean;
}

function getSourceMeta(internship: InternshipWithCompany) {
  const src = (internship.source || "").toLowerCase();
  const url = (internship.applicationUrl || "").toLowerCase();
  const st = (internship.sourceType || "").toLowerCase();

  if (src === "wuzzuf" || url.includes("wuzzuf.net")) {
    return { name: "Wuzzuf", dotColor: "#89b4fa" };
  }
  if (src === "indeed" || url.includes("indeed.com")) {
    return { name: "Indeed", dotColor: "#fab387" };
  }
  if (src === "glassdoor" || url.includes("glassdoor.com")) {
    return { name: "Glassdoor", dotColor: "#a6e3a1" };
  }
  if (src === "workable" || url.includes("workable.com") || url.includes("smartrecruiters.com")) {
    return { name: "Workable", dotColor: "#94e2d5" };
  }
  if (src.includes("linkedin") || st === "linkedin_post" || url.includes("linkedin.com")) {
    return { name: "LinkedIn", dotColor: "#74c7ec" };
  }
  if (src === "community" || src === "community_drop") {
    return { name: "Community", dotColor: "#cba6f7" };
  }
  if (st === "google_form" || url.includes("docs.google.com/forms")) {
    return { name: "Google Form", dotColor: "#fab387" };
  }
  if (st === "tiktok" || url.includes("tiktok.com")) {
    return { name: "TikTok", dotColor: "#f5c2e7" };
  }
  if (st === "instagram" || url.includes("instagram.com")) {
    return { name: "Instagram", dotColor: "#f5c2e7" };
  }
  return { name: "Portal", dotColor: "#94e2d5" };
}

export function InternshipRow({ internship, isSelected = false }: InternshipRowProps) {
  const { savedItems, setItemStatus, removeItem, isLoaded } = useSavedInternships();
  const [dropdownOpen, setDropdownOpen] = useState(false);

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

  const sourceMeta = getSourceMeta(internship);
  const timeAgo = formatRelativeTime(internship.postedAt || internship.createdAt);

  return (
    <div
      className={`group relative py-2.5 px-3 border-b border-[#313244]/60 transition-colors duration-120 flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs ${
        isSelected ? "bg-[#313244]/50 border-l-2 border-l-[#cba6f7]" : "hover:bg-[#313244]/25"
      }`}
    >
      {/* Left: Company (Fixed Width), Title */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Company Name (Fixed 44 Width) */}
        <span className="w-40 sm:w-44 flex-shrink-0 font-mono text-xs text-[#a6adc8] truncate">
          {internship.company.name}
        </span>

        {/* Role Title */}
        <a
          href={internship.applicationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-[#cdd6f4] hover:text-[#cba6f7] transition-colors duration-120 truncate flex-1"
        >
          {internship.title}
        </a>
      </div>

      {/* Right: Plain Editorial Metadata (City · Category · Dot Source · Recency) + Actions */}
      <div className="flex items-center justify-between md:justify-end gap-4 text-xs font-mono text-[#a6adc8] flex-shrink-0">
        <div className="flex items-center gap-2 text-[#a6adc8]">
          <span>{internship.location}</span>
          <span className="text-[#45475a]">·</span>
          <span className="hidden lg:inline">{internship.category}</span>
          <span className="hidden lg:inline text-[#45475a]">·</span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: sourceMeta.dotColor }}
            />
            <span>{sourceMeta.name}</span>
          </span>
          <span className="text-[#45475a]">·</span>
          <span className="text-[#6c7086]">{timeAgo}</span>
        </div>

        {/* Actions: Save popover + Apply link */}
        <div className="flex items-center gap-2">
          {/* Status / Save Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono transition-colors duration-120 border ${
                currentStatus
                  ? "bg-[#313244] text-[#cba6f7] border-[#cba6f7]/40"
                  : "bg-transparent text-[#6c7086] border-transparent hover:text-[#cdd6f4] hover:border-[#45475a]"
              }`}
            >
              <Bookmark className="w-3 h-3" strokeWidth={1.75} />
              <span>
                {currentStatus
                  ? currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)
                  : "Save"}
              </span>
              <ChevronDown className="w-2.5 h-2.5 opacity-50" strokeWidth={1.75} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-32 rounded bg-[#181825] shadow-xl border border-[#313244] py-1 z-30 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => handleSelect("saved")}
                  className={`w-full text-left px-3 py-1 flex items-center justify-between hover:bg-[#313244] ${
                    currentStatus === "saved" ? "text-[#cba6f7] font-medium" : "text-[#a6adc8]"
                  }`}
                >
                  <span>Saved</span>
                  {currentStatus === "saved" && <Check className="w-3 h-3 text-[#cba6f7]" strokeWidth={1.75} />}
                </button>
                <button
                  type="button"
                  onClick={() => handleSelect("applied")}
                  className={`w-full text-left px-3 py-1 flex items-center justify-between hover:bg-[#313244] ${
                    currentStatus === "applied" ? "text-[#74c7ec] font-medium" : "text-[#a6adc8]"
                  }`}
                >
                  <span>Applied</span>
                  {currentStatus === "applied" && <Check className="w-3 h-3 text-[#74c7ec]" strokeWidth={1.75} />}
                </button>
                <button
                  type="button"
                  onClick={() => handleSelect("interviewing")}
                  className={`w-full text-left px-3 py-1 flex items-center justify-between hover:bg-[#313244] ${
                    currentStatus === "interviewing" ? "text-[#b4befe] font-medium" : "text-[#a6adc8]"
                  }`}
                >
                  <span>Interviewing</span>
                  {currentStatus === "interviewing" && <Check className="w-3 h-3 text-[#b4befe]" strokeWidth={1.75} />}
                </button>

                {currentStatus && (
                  <>
                    <div className="border-t border-[#313244] my-1" />
                    <button
                      type="button"
                      onClick={handleRemove}
                      className="w-full text-left px-3 py-1 text-[#f38ba8] hover:bg-[#313244]"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Apply ↗ Link */}
          <a
            href={internship.applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-[#a6adc8] hover:text-[#cba6f7] transition-colors duration-120 whitespace-nowrap pl-1"
          >
            Apply ↗
          </a>
        </div>
      </div>
    </div>
  );
}
