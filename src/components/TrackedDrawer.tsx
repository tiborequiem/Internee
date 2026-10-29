"use client";

import { useState } from "react";
import { InternshipWithCompany } from "@/db/schema";
import { useSavedInternships, TrackingStatus } from "@/hooks/useSavedInternships";
import { X, ArrowUpRight, Trash2, Bookmark } from "lucide-react";

interface TrackedDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  allInternships: InternshipWithCompany[];
}

export function TrackedDrawer({ isOpen, onClose, allInternships }: TrackedDrawerProps) {
  const { savedItems, setItemStatus, removeItem, clearAll, isLoaded } = useSavedInternships();
  const [activeTab, setActiveTab] = useState<"all" | TrackingStatus>("all");

  if (!isOpen) return null;

  const trackedInternshipIds = isLoaded ? Object.keys(savedItems).map(Number) : [];

  const trackedList = allInternships
    .filter((item) => trackedInternshipIds.includes(item.id))
    .map((item) => ({
      ...item,
      userStatus: savedItems[item.id],
    }))
    .filter((item) => (activeTab === "all" ? true : item.userStatus === activeTab));

  const countByStatus = {
    all: trackedInternshipIds.length,
    saved: Object.values(savedItems).filter((s) => s === "saved").length,
    applied: Object.values(savedItems).filter((s) => s === "applied").length,
    interviewing: Object.values(savedItems).filter((s) => s === "interviewing").length,
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0D0D0C] border-l border-[#262624] shadow-2xl flex flex-col text-[#ECECEC]">
          {/* Header */}
          <div className="p-4 border-b border-[#262624] flex items-center justify-between bg-[#161614]">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-[#D97757]" />
              <h2 className="text-sm font-semibold text-[#ECECEC]">Saved Applications</h2>
              <span className="text-[11px] font-mono text-[#8E8D8A]">
                ({trackedInternshipIds.length})
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded text-[#8E8D8A] hover:text-[#ECECEC] hover:bg-[#222220]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="px-4 pt-2 border-b border-[#262624] flex gap-2 font-mono text-xs">
            <button
              onClick={() => setActiveTab("all")}
              className={`pb-2 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === "all"
                  ? "border-[#D97757] text-[#ECECEC] font-bold"
                  : "border-transparent text-[#8E8D8A] hover:text-[#ECECEC]"
              }`}
            >
              All <span>({countByStatus.all})</span>
            </button>
            <button
              onClick={() => setActiveTab("saved")}
              className={`pb-2 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === "saved"
                  ? "border-[#D97757] text-[#ECECEC] font-bold"
                  : "border-transparent text-[#8E8D8A] hover:text-[#ECECEC]"
              }`}
            >
              Saved <span>({countByStatus.saved})</span>
            </button>
            <button
              onClick={() => setActiveTab("applied")}
              className={`pb-2 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === "applied"
                  ? "border-blue-400 text-[#ECECEC] font-bold"
                  : "border-transparent text-[#8E8D8A] hover:text-[#ECECEC]"
              }`}
            >
              Applied <span>({countByStatus.applied})</span>
            </button>
            <button
              onClick={() => setActiveTab("interviewing")}
              className={`pb-2 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === "interviewing"
                  ? "border-purple-400 text-[#ECECEC] font-bold"
                  : "border-transparent text-[#8E8D8A] hover:text-[#ECECEC]"
              }`}
            >
              Interviewing <span>({countByStatus.interviewing})</span>
            </button>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono">
            {trackedList.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <Bookmark className="w-6 h-6 text-[#8E8D8A]/50 mx-auto" />
                <p className="text-xs text-[#8E8D8A]">
                  No {activeTab !== "all" ? activeTab : "tracked"} internships saved in this browser.
                </p>
              </div>
            ) : (
              trackedList.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded border border-[#262624] bg-[#161614] hover:border-[#383834] transition-colors space-y-2.5 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-[#8E8D8A] block">
                        {item.company.name}
                      </span>
                      <h4 className="font-sans font-medium text-sm text-[#ECECEC] leading-snug">
                        {item.title}
                      </h4>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 text-[#8E8D8A] hover:text-rose-400"
                      title="Untrack role"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#222220]">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setItemStatus(item.id, "saved")}
                        className={`px-1.5 py-0.5 rounded text-[10px] border transition-colors ${
                          item.userStatus === "saved"
                            ? "bg-[#D97757]/20 text-[#D97757] border-[#D97757]"
                            : "bg-[#0D0D0C] text-[#8E8D8A] border-[#222220]"
                        }`}
                      >
                        Saved
                      </button>
                      <button
                        onClick={() => setItemStatus(item.id, "applied")}
                        className={`px-1.5 py-0.5 rounded text-[10px] border transition-colors ${
                          item.userStatus === "applied"
                            ? "bg-blue-500/20 text-blue-400 border-blue-400"
                            : "bg-[#0D0D0C] text-[#8E8D8A] border-[#222220]"
                        }`}
                      >
                        Applied
                      </button>
                      <button
                        onClick={() => setItemStatus(item.id, "interviewing")}
                        className={`px-1.5 py-0.5 rounded text-[10px] border transition-colors ${
                          item.userStatus === "interviewing"
                            ? "bg-purple-500/20 text-purple-400 border-purple-400"
                            : "bg-[#0D0D0C] text-[#8E8D8A] border-[#222220]"
                        }`}
                      >
                        Interviewing
                      </button>
                    </div>

                    <a
                      href={item.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#8E8D8A] hover:text-[#ECECEC]"
                    >
                      <span>Apply</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer */}
          {trackedInternshipIds.length > 0 && (
            <div className="p-3 border-t border-[#262624] bg-[#161614] flex items-center justify-between text-xs font-mono text-[#8E8D8A]">
              <span>Browser localStorage</span>
              <button
                onClick={clearAll}
                className="text-rose-400 hover:text-rose-300"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
