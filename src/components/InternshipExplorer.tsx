"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { InternshipWithCompany } from "@/db/schema";
import { InternshipRow } from "./InternshipRow";
import { QuickDropBar } from "./QuickDropBar";
import { Search, X } from "lucide-react";

interface InternshipExplorerProps {
  initialInternships: InternshipWithCompany[];
}

const CATEGORIES = [
  "All Categories",
  "Software & Data",
  "Finance",
  "Marketing",
  "Engineering",
  "Business",
];

const SECTORS = [
  "Tech",
  "Telecom",
  "Banking & Fintech",
  "FMCG",
  "Consulting",
  "Engineering",
];

const LOCATIONS = ["All", "Cairo", "Giza", "Alexandria", "Remote", "Hybrid"];

const SOURCES = ["All", "LinkedIn", "Wuzzuf", "Indeed", "Glassdoor", "Workable", "Community"];

export function InternshipExplorer({ initialInternships }: InternshipExplorerProps) {
  const [internshipsList, setInternshipsList] = useState<InternshipWithCompany[]>(initialInternships);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedLocations, setSelectedLocations] = useState<string>("All");
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>("All");
  const [openOnly, setOpenOnly] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const toggleSector = (sector: string) => {
    setSelectedSectors((prev) =>
      prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector]
    );
  };

  const refreshList = async () => {
    try {
      const res = await fetch("/api/internships");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setInternshipsList(data);
        }
      }
    } catch {
      // ignore
    }
  };

  const filtered = useMemo(() => {
    return internshipsList.filter((item) => {
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesCompany = item.company.name.toLowerCase().includes(query);
        const matchesLocation = item.location.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCompany && !matchesLocation) return false;
      }

      if (openOnly && item.status !== "open") return false;

      if (selectedCategory !== "All Categories" && item.category !== selectedCategory) {
        return false;
      }

      if (selectedLocations !== "All") {
        if (!item.location.toLowerCase().includes(selectedLocations.toLowerCase())) {
          return false;
        }
      }

      if (selectedSectors.length > 0 && !selectedSectors.includes(item.company.sector)) {
        return false;
      }

      if (selectedSource !== "All") {
        const srcLower = selectedSource.toLowerCase();
        const itemSrc = (item.source || "").toLowerCase();
        const itemUrl = (item.applicationUrl || "").toLowerCase();
        const itemType = (item.sourceType || "").toLowerCase();
        if (
          !itemSrc.includes(srcLower) &&
          !itemUrl.includes(srcLower) &&
          !itemType.includes(srcLower)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [internshipsList, search, openOnly, selectedCategory, selectedLocations, selectedSectors, selectedSource]);

  // Reset selected index when filters change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [search, openOnly, selectedCategory, selectedLocations, selectedSectors, selectedSource]);

  // Keyboard navigation shortcuts: '/' to focus search, 'j'/'k' to navigate rows, 'Enter' to open role
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // '/' to focus search input
      if (e.key === "/" && !isInputFocused) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Escape to blur search
      if (e.key === "Escape" && isInputFocused) {
        searchInputRef.current?.blur();
        return;
      }

      if (isInputFocused) return;

      // 'j' to navigate down
      if (e.key === "j") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : prev));
      }

      // 'k' to navigate up
      if (e.key === "k") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      }

      // 'Enter' to open active role
      if (e.key === "Enter" && selectedIndex >= 0 && selectedIndex < filtered.length) {
        e.preventDefault();
        const activeItem = filtered[selectedIndex];
        if (activeItem?.applicationUrl) {
          window.open(activeItem.applicationUrl, "_blank", "noopener,noreferrer");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filtered, selectedIndex]);

  const hasActiveFilters =
    search !== "" ||
    openOnly ||
    selectedCategory !== "All Categories" ||
    selectedLocations !== "All" ||
    selectedSectors.length > 0 ||
    selectedSource !== "All";

  const resetFilters = () => {
    setSearch("");
    setOpenOnly(false);
    setSelectedCategory("All Categories");
    setSelectedLocations("All");
    setSelectedSectors([]);
    setSelectedSource("All");
  };

  return (
    <div className="space-y-6">
      {/* Link Drop Bar */}
      <QuickDropBar onSuccess={refreshList} />

      {/* 2-Column Desktop Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 items-start">
        {/* Left Sidebar (240px, Sticky) */}
        <aside className="lg:sticky lg:top-20 space-y-5 text-xs font-mono">
          {/* Search Input with [/] shortcut hint */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-[#a6adc8]">
              <span>Filter</span>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-[#cba6f7] hover:underline text-[11px]"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6c7086]" strokeWidth={1.75} />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by company, role, city..."
                className="w-full bg-[#181825] border border-[#313244] focus:border-[#cba6f7] rounded pl-8 pr-10 py-1.5 text-xs text-[#cdd6f4] placeholder-[#6c7086] focus:outline-none transition-colors duration-120"
              />
              {search ? (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#a6adc8] hover:text-[#cdd6f4]"
                >
                  <X className="w-3 h-3" strokeWidth={1.75} />
                </button>
              ) : (
                <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#6c7086] border border-[#313244] px-1 rounded pointer-events-none">
                  /
                </kbd>
              )}
            </div>
          </div>

          {/* Open Only Toggle */}
          <div className="pt-2 border-t border-[#313244]/60">
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-[#a6adc8] text-xs group-hover:text-[#cdd6f4] transition-colors duration-120">
                Open only
              </span>
              <input
                type="checkbox"
                checked={openOnly}
                onChange={(e) => setOpenOnly(e.target.checked)}
                className="rounded bg-[#181825] border-[#313244] text-[#cba6f7] focus:ring-0 w-3.5 h-3.5 cursor-pointer accent-[#cba6f7]"
              />
            </label>
          </div>

          {/* Category List - clean unboxed inactive, active highlighted */}
          <div className="space-y-1.5 pt-2 border-t border-[#313244]/60">
            <span className="text-xs font-medium text-[#a6adc8] block">Category</span>
            <div className="space-y-0.5">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-2 py-1 rounded transition-colors duration-120 text-xs flex items-center justify-between ${
                      isActive
                        ? "bg-[#313244] text-[#cdd6f4] font-medium"
                        : "text-[#a6adc8] hover:text-[#cdd6f4]"
                    }`}
                  >
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location Pills - unbordered inactive, only active highlighted */}
          <div className="space-y-1.5 pt-2 border-t border-[#313244]/60">
            <span className="text-xs font-medium text-[#a6adc8] block">Location</span>
            <div className="flex flex-wrap gap-1">
              {LOCATIONS.map((loc) => {
                const isActive = selectedLocations === loc;
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setSelectedLocations(loc)}
                    className={`px-2 py-0.5 rounded text-xs transition-colors duration-120 ${
                      isActive
                        ? "bg-[#313244] text-[#cdd6f4] font-medium"
                        : "text-[#a6adc8] hover:text-[#cdd6f4]"
                    }`}
                  >
                    {loc}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Source Pills - unbordered inactive, only active highlighted */}
          <div className="space-y-1.5 pt-2 border-t border-[#313244]/60">
            <span className="text-xs font-medium text-[#a6adc8] block">Source</span>
            <div className="flex flex-wrap gap-1">
              {SOURCES.map((src) => {
                const isActive = selectedSource === src;
                return (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setSelectedSource(src)}
                    className={`px-2 py-0.5 rounded text-xs transition-colors duration-120 ${
                      isActive
                        ? "bg-[#313244] text-[#cdd6f4] font-medium"
                        : "text-[#a6adc8] hover:text-[#cdd6f4]"
                    }`}
                  >
                    {src}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sector Checkboxes */}
          <div className="space-y-1.5 pt-2 border-t border-[#313244]/60">
            <span className="text-xs font-medium text-[#a6adc8] block">Sector</span>
            <div className="space-y-1">
              {SECTORS.map((sec) => (
                <label
                  key={sec}
                  className="flex items-center gap-2 text-xs text-[#a6adc8] hover:text-[#cdd6f4] cursor-pointer transition-colors duration-120"
                >
                  <input
                    type="checkbox"
                    checked={selectedSectors.includes(sec)}
                    onChange={() => toggleSector(sec)}
                    className="rounded bg-[#181825] border-[#313244] text-[#cba6f7] focus:ring-0 w-3.5 h-3.5 cursor-pointer accent-[#cba6f7]"
                  />
                  <span>{sec}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content Area: Unwrapped direct list on #1e1e2e canvas */}
        <section className="min-w-0">
          {filtered.length === 0 ? (
            <div className="py-12 px-2 text-left font-mono text-xs text-[#6c7086] space-y-2">
              <p>No matching roles right now.</p>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-[#cba6f7] hover:underline"
                >
                  Reset all filters
                </button>
              )}
            </div>
          ) : (
            <div>
              {filtered.map((item, index) => (
                <InternshipRow
                  key={item.id}
                  internship={item}
                  isSelected={index === selectedIndex}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
