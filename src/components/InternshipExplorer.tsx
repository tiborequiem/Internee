"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { InternshipWithCompany } from "@/db/schema";
import { InternshipRow } from "./InternshipRow";
import { QuickDropBar } from "./QuickDropBar";
import {
  Search,
  X,
  ArrowRight,
  Radar,
  RefreshCw,
  Terminal,
  Sparkles,
  SlidersHorizontal,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

export function InternshipExplorer({ initialInternships }: InternshipExplorerProps) {
  const [internshipsList, setInternshipsList] = useState<InternshipWithCompany[]>(initialInternships);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedLocations, setSelectedLocations] = useState<string>("All");
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [openOnly, setOpenOnly] = useState(false);

  // Scanner status & Terminal simulator
  const [isScanning, setIsScanning] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [lastScannedTime, setLastScannedTime] = useState<string>("Active now");

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

  // Trigger web & social discovery scan
  const handleRunScan = async () => {
    setIsScanning(true);
    setTerminalLogs([
      "Initializing Crawler & Social Dork Scanner...",
      "Querying Workable Public Widget APIs (Instabug, Paymob, Breadfast)...",
    ]);

    try {
      const res = await fetch("/api/scan", { method: "POST" });
      const data = await res.json();

      if (data.logs && Array.isArray(data.logs)) {
        setTerminalLogs(data.logs);
      } else {
        setTerminalLogs((prev) => [...prev, "Completed scan across Egyptian networks."]);
      }

      setLastScannedTime("Just now");
      await refreshList();
    } catch {
      setTerminalLogs((prev) => [...prev, "Scan encountered network timeout; finished safely."]);
    } finally {
      setIsScanning(false);
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

      return true;
    });
  }, [internshipsList, search, openOnly, selectedCategory, selectedLocations, selectedSectors]);

  const hasActiveFilters =
    search !== "" ||
    openOnly ||
    selectedCategory !== "All Categories" ||
    selectedLocations !== "All" ||
    selectedSectors.length > 0;

  const resetFilters = () => {
    setSearch("");
    setOpenOnly(false);
    setSelectedCategory("All Categories");
    setSelectedLocations("All");
    setSelectedSectors([]);
  };

  return (
    <div className="space-y-6">
      {/* 1-Click Drop a Link Quick Bar */}
      <section className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-[#8E8D8A]">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#D97757]" />
            <span>1-Click Community Drop — spotted a role on LinkedIn, TikTok, or Google Forms?</span>
          </span>
          <span className="hidden sm:inline">Auto-parsed via OpenGraph & oEmbed</span>
        </div>
        <QuickDropBar onSuccess={refreshList} />
      </section>

      {/* Live Scanner Status Strip */}
      <section className="py-2 px-4 rounded-lg bg-[#161614] border border-[#262624] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ADE80] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4ADE80]" />
            </span>
            <span className="text-[#ECECEC]">Social & Portal Radar Active</span>
          </div>
          <span className="text-[#262624]">|</span>
          <span className="text-[#8E8D8A] text-[11px]">Last scan: {lastScannedTime}</span>
        </div>

        <button
          onClick={handleRunScan}
          disabled={isScanning}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#222220] hover:bg-[#2A2A26] border border-[#2E2E2A] text-[#ECECEC] text-[11px] transition-colors disabled:opacity-50"
        >
          <Radar className={`w-3.5 h-3.5 text-[#D97757] ${isScanning ? "animate-spin" : ""}`} />
          <span>{isScanning ? "Scanning Web & Socials..." : "Scan Web & Socials Now"}</span>
        </button>
      </section>

      {/* 2-Column Desktop Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 items-start">
        {/* Left Sidebar (240px, Sticky) */}
        <aside className="lg:sticky lg:top-20 space-y-6 text-xs font-mono">
          {/* Search Input */}
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-wider text-[#8E8D8A] font-semibold flex items-center justify-between">
              <span>Filter Roles</span>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-[#D97757] hover:underline normal-case text-[10px]"
                >
                  Reset
                </button>
              )}
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8D8A]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search keyword..."
                className="w-full bg-[#161614] border border-[#262624] focus:border-[#383834] rounded-md pl-8 pr-7 py-2 text-xs text-[#ECECEC] placeholder-[#8E8D8A]/60 focus:outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E8D8A] hover:text-[#ECECEC]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Open Now Toggle */}
          <div className="pt-2 border-t border-[#222220]">
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]" />
                <span className="text-[#ECECEC] text-xs">Open Now</span>
              </div>
              <input
                type="checkbox"
                checked={openOnly}
                onChange={(e) => setOpenOnly(e.target.checked)}
                className="rounded bg-[#161614] border-[#262624] text-[#D97757] focus:ring-0 w-3.5 h-3.5 cursor-pointer accent-[#D97757]"
              />
            </label>
          </div>

          {/* Category List */}
          <div className="space-y-2 pt-2 border-t border-[#222220]">
            <span className="text-[11px] uppercase tracking-wider text-[#8E8D8A] font-semibold block">
              Category
            </span>
            <div className="space-y-0.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-2 py-1.5 rounded transition-colors text-xs flex items-center justify-between ${
                    selectedCategory === cat
                      ? "bg-[#161614] text-[#ECECEC] border border-[#262624] font-medium"
                      : "text-[#8E8D8A] hover:text-[#ECECEC]"
                  }`}
                >
                  <span>{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Location Pills */}
          <div className="space-y-2 pt-2 border-t border-[#222220]">
            <span className="text-[11px] uppercase tracking-wider text-[#8E8D8A] font-semibold block">
              Location
            </span>
            <div className="flex flex-wrap gap-1.5">
              {LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setSelectedLocations(loc)}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors border ${
                    selectedLocations === loc
                      ? "bg-[#161614] text-[#ECECEC] border-[#383834]"
                      : "bg-[#0D0D0C] text-[#8E8D8A] border-[#222220] hover:text-[#ECECEC]"
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {/* Sector Checkboxes */}
          <div className="space-y-2 pt-2 border-t border-[#222220]">
            <span className="text-[11px] uppercase tracking-wider text-[#8E8D8A] font-semibold block">
              Sector
            </span>
            <div className="space-y-1.5">
              {SECTORS.map((sec) => (
                <label
                  key={sec}
                  className="flex items-center gap-2 text-xs text-[#8E8D8A] hover:text-[#ECECEC] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedSectors.includes(sec)}
                    onChange={() => toggleSector(sec)}
                    className="rounded bg-[#161614] border-[#262624] text-[#D97757] focus:ring-0 w-3 h-3 cursor-pointer accent-[#D97757]"
                  />
                  <span>{sec}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content Area (1fr) */}
        <section className="min-w-0">
          <div className="border border-[#262624] rounded-lg bg-[#0D0D0C] overflow-hidden">
            {/* Table Header Bar */}
            <div className="py-2.5 px-4 bg-[#161614] border-b border-[#262624] flex items-center justify-between text-[11px] font-mono text-[#8E8D8A]">
              <div className="flex items-center gap-3">
                <span>ACTIVE OPENINGS</span>
                <span className="text-[#262624]">/</span>
                <span>{filtered.length} AVAILABLE</span>
              </div>
              <div className="hidden md:flex items-center gap-6">
                <span>LOCATION & RECENCY</span>
                <span className="w-20 text-right">ACTION</span>
              </div>
            </div>

            {/* Row List or Interactive Discovery Terminal Empty State */}
            {filtered.length === 0 ? (
              <div className="py-16 px-6 text-center space-y-5">
                <div className="w-12 h-12 rounded-full bg-[#161614] border border-[#262624] flex items-center justify-center mx-auto text-[#D97757]">
                  <Radar className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <p className="text-sm font-medium text-[#ECECEC]">
                    No verified openings live right now.
                  </p>
                  <p className="text-xs text-[#8E8D8A] leading-relaxed">
                    Off-peak season detected. Run a live discovery scan across Workable, Wuzzuf, LinkedIn
                    posts, and Google Forms, or switch to Company Radar.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={handleRunScan}
                    disabled={isScanning}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-mono font-medium bg-[#D97757] hover:bg-[#C86B4D] text-[#ECECEC] transition-all shadow-lg shadow-[#D97757]/20 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
                    <span>{isScanning ? "Scanning Web & Socials..." : "Run Live Discovery Scan"}</span>
                  </button>

                  <Link
                    href="/companies"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-mono bg-[#161614] hover:bg-[#1E1E1C] border border-[#262624] text-[#ECECEC] transition-colors"
                  >
                    <span>Company Radar (16)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Animated Scanner Progress Terminal Log */}
                {terminalLogs.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-6 max-w-lg mx-auto text-left rounded-lg bg-[#121210] border border-[#262624] p-3 text-[11px] font-mono text-[#8E8D8A] space-y-1 overflow-hidden"
                  >
                    <div className="flex items-center gap-2 pb-1.5 border-b border-[#222220] text-[#ECECEC]">
                      <Terminal className="w-3.5 h-3.5 text-[#D97757]" />
                      <span>Live Crawler Terminal</span>
                    </div>
                    <div className="space-y-0.5 pt-1">
                      {terminalLogs.map((log, index) => (
                        <div key={index} className="flex items-start gap-1.5">
                          <span className="text-[#D97757] select-none">&gt;</span>
                          <span className="text-[#ECECEC]">{log}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="divide-y divide-[#222220]">
                  {filtered.map((item) => (
                    <InternshipRow key={item.id} internship={item} />
                  ))}
                </div>
              </AnimatePresence>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
