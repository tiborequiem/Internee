"use client";

import { useState } from "react";
import { InternshipWithCompany } from "@/db/schema";
import { useSavedInternships, TrackingStatus } from "@/hooks/useSavedInternships";
import { formatRelativeTime } from "@/lib/utils";
import {
  ExternalLink,
  Bookmark,
  CheckCircle2,
  Clock,
  MapPin,
  Briefcase,
  ChevronDown,
  Trash2,
} from "lucide-react";

interface InternshipCardProps {
  internship: InternshipWithCompany;
}

export function InternshipCard({ internship }: InternshipCardProps) {
  const { savedItems, setItemStatus, removeItem, isLoaded } = useSavedInternships();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const currentStatus: TrackingStatus | null = isLoaded ? savedItems[internship.id] || null : null;

  const handleStatusSelect = (status: TrackingStatus) => {
    setItemStatus(internship.id, status);
    setDropdownOpen(false);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeItem(internship.id);
    setDropdownOpen(false);
  };

  // Status visual styles
  const statusConfig = {
    open: { label: "Open Now", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    upcoming: { label: "Upcoming", bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
    closed: { label: "Closed", bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" },
    pending_review: { label: "Pending", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  };

  const currentStatusBadge =
    statusConfig[internship.status as keyof typeof statusConfig] || statusConfig.open;

  // Sector visual badge
  const sectorColors: Record<string, string> = {
    Tech: "bg-indigo-50 text-indigo-700 border-indigo-200",
    "Banking & Fintech": "bg-blue-50 text-blue-700 border-blue-200",
    FMCG: "bg-amber-50 text-amber-700 border-amber-200",
    Telecom: "bg-purple-50 text-purple-700 border-purple-200",
    Consulting: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Gov: "bg-slate-100 text-slate-700 border-slate-200",
    Engineering: "bg-orange-50 text-orange-700 border-orange-200",
  };

  const sectorBadgeClass = sectorColors[internship.company.sector] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-teal-500/40 transition-all p-5 flex flex-col justify-between group">
      <div>
        {/* Header: Company & Sector & Status */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm overflow-hidden flex-shrink-0">
              {internship.company.logoUrl ? (
                <img
                  src={internship.company.logoUrl}
                  alt={internship.company.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback to text initials
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                internship.company.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm leading-snug group-hover:text-teal-700 transition-colors">
                {internship.company.name}
              </h3>
              <span
                className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full border mt-0.5 ${sectorBadgeClass}`}
              >
                {internship.company.sector}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${currentStatusBadge.bg} ${currentStatusBadge.text} ${currentStatusBadge.border}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                internship.status === "open"
                  ? "bg-emerald-500 animate-pulse"
                  : internship.status === "upcoming"
                  ? "bg-sky-500"
                  : "bg-slate-400"
              }`}
            />
            {currentStatusBadge.label}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-base font-bold text-slate-900 leading-snug mb-3">
          {internship.title}
        </h2>

        {/* Meta tags: Category & Location */}
        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 font-medium text-slate-700">
            <Briefcase className="w-3.5 h-3.5 text-slate-500" />
            {internship.category}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 font-medium text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            {internship.location}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 ml-auto">
            <Clock className="w-3 h-3" />
            {formatRelativeTime(internship.postedAt || internship.createdAt)}
          </span>
        </div>
      </div>

      {/* Footer Actions: Apply & Tracker State */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        {/* Tracking Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              currentStatus === "applied"
                ? "bg-blue-50 text-blue-700 border-blue-300"
                : currentStatus === "interviewing"
                ? "bg-purple-50 text-purple-700 border-purple-300"
                : currentStatus === "saved"
                ? "bg-amber-50 text-amber-800 border-amber-300"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            {currentStatus === "applied" ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            ) : currentStatus === "interviewing" ? (
              <Clock className="w-3.5 h-3.5 text-purple-600" />
            ) : (
              <Bookmark className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>
              {currentStatus
                ? currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)
                : "Track Role"}
            </span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {/* Status selector popover */}
          {dropdownOpen && (
            <div className="absolute left-0 bottom-full mb-1 w-44 rounded-xl bg-white shadow-xl border border-slate-200 py-1.5 z-20 text-xs">
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Update Status
              </div>
              <button
                type="button"
                onClick={() => handleStatusSelect("saved")}
                className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-50 ${
                  currentStatus === "saved" ? "font-bold text-amber-700" : "text-slate-700"
                }`}
              >
                <span>Saved</span>
                {currentStatus === "saved" && <span className="text-[10px]">Active</span>}
              </button>
              <button
                type="button"
                onClick={() => handleStatusSelect("applied")}
                className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-50 ${
                  currentStatus === "applied" ? "font-bold text-blue-700" : "text-slate-700"
                }`}
              >
                <span>Applied</span>
                {currentStatus === "applied" && <span className="text-[10px]">Active</span>}
              </button>
              <button
                type="button"
                onClick={() => handleStatusSelect("interviewing")}
                className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-50 ${
                  currentStatus === "interviewing" ? "font-bold text-purple-700" : "text-slate-700"
                }`}
              >
                <span>Interviewing</span>
                {currentStatus === "interviewing" && <span className="text-[10px]">Active</span>}
              </button>

              {currentStatus && (
                <>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="w-full text-left px-3 py-1.5 flex items-center gap-1.5 text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Untrack</span>
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
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-all active:scale-95"
        >
          <span>Apply Direct</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
