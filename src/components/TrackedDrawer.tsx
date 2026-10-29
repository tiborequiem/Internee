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
        <div className="w-screen max-w-md bg-[#1e1e2e] border-l border-[#45475a] shadow-2xl flex flex-col text-[#cdd6f4]">
          {/* Header */}
          <div className="p-4 border-b border-[#313244] flex items-center justify-between bg-[#181825]">
            <div className="flex items-center gap-2">
              <Bookmark className="w-3.5 h-3.5 text-[#cba6f7]" strokeWidth={1.75} />
              <h2 className="text-sm font-medium text-[#cdd6f4]">Saved roles</h2>
              <span className="text-[11px] font-mono text-[#6c7086]">
                ({trackedInternshipIds.length})
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244] transition-colors"
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="px-4 pt-2 border-b border-[#313244] flex gap-2 font-mono text-xs bg-[#181825]">
            <button
              onClick={() => setActiveTab("all")}
              className={`pb-2 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === "all"
                  ? "border-[#cba6f7] text-[#cdd6f4] font-medium"
                  : "border-transparent text-[#6c7086] hover:text-[#a6adc8]"
              }`}
            >
              All <span>({countByStatus.all})</span>
            </button>
            <button
              onClick={() => setActiveTab("saved")}
              className={`pb-2 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === "saved"
                  ? "border-[#cba6f7] text-[#cba6f7] font-medium"
                  : "border-transparent text-[#6c7086] hover:text-[#a6adc8]"
              }`}
            >
              Saved <span>({countByStatus.saved})</span>
            </button>
            <button
              onClick={() => setActiveTab("applied")}
              className={`pb-2 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === "applied"
                  ? "border-[#74c7ec] text-[#74c7ec] font-medium"
                  : "border-transparent text-[#6c7086] hover:text-[#a6adc8]"
              }`}
            >
              Applied <span>({countByStatus.applied})</span>
            </button>
            <button
              onClick={() => setActiveTab("interviewing")}
              className={`pb-2 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === "interviewing"
                  ? "border-[#b4befe] text-[#b4befe] font-medium"
                  : "border-transparent text-[#6c7086] hover:text-[#a6adc8]"
              }`}
            >
              Interviewing <span>({countByStatus.interviewing})</span>
            </button>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto px-4 py-2 font-mono divide-y divide-[#313244]/60">
            {trackedList.length === 0 ? (
              <p className="py-12 text-center text-xs text-[#6c7086]">No saved roles.</p>
            ) : (
              trackedList.map((item) => (
                <div
                  key={item.id}
                  className="py-3 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] text-[#6c7086] block">
                        {item.company.name}
                      </span>
                      <h4 className="font-sans font-medium text-sm text-[#cdd6f4] leading-snug">
                        {item.title}
                      </h4>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 text-[#6c7086] hover:text-[#f38ba8] transition-colors"
                      title="Untrack role"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setItemStatus(item.id, "saved")}
                        className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                          item.userStatus === "saved"
                            ? "bg-[#cba6f7]/20 text-[#cba6f7]"
                            : "text-[#6c7086] hover:text-[#a6adc8]"
                        }`}
                      >
                        Saved
                      </button>
                      <button
                        onClick={() => setItemStatus(item.id, "applied")}
                        className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                          item.userStatus === "applied"
                            ? "bg-[#74c7ec]/20 text-[#74c7ec]"
                            : "text-[#6c7086] hover:text-[#a6adc8]"
                        }`}
                      >
                        Applied
                      </button>
                      <button
                        onClick={() => setItemStatus(item.id, "interviewing")}
                        className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                          item.userStatus === "interviewing"
                            ? "bg-[#b4befe]/20 text-[#b4befe]"
                            : "text-[#6c7086] hover:text-[#a6adc8]"
                        }`}
                      >
                        Interviewing
                      </button>
                    </div>

                    <a
                      href={item.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#a6adc8] hover:text-[#cba6f7] transition-colors"
                    >
                      <span>Apply</span>
                      <ArrowUpRight className="w-3 h-3" strokeWidth={1.75} />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer */}
          {trackedInternshipIds.length > 0 && (
            <div className="p-3 border-t border-[#313244] bg-[#181825] flex items-center justify-between text-xs font-mono text-[#6c7086]">
              <span>Saved locally</span>
              <button
                onClick={clearAll}
                className="text-[#f38ba8] hover:text-[#eba0ac] transition-colors"
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
