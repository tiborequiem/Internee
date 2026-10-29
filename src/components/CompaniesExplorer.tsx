"use client";

import { useState, useMemo, useRef, MouseEvent } from "react";
import { Company } from "@/db/schema";
import { Search, X, ArrowUpRight, Radio } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CompanyWithStats extends Company {
  activeInternshipsCount: number;
  totalInternshipsCount: number;
}

interface CompaniesExplorerProps {
  companies: CompanyWithStats[];
}

const SECTORS = [
  "All",
  "Tech",
  "Telecom",
  "Banking & Fintech",
  "FMCG",
  "Consulting",
  "Engineering",
];

function CompanyCard({ company }: { company: CompanyWithStats }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty("--mouse-x", `${x}px`);
    cardRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className="relative p-4 rounded-lg bg-[#161614] border border-[#262624] hover:border-[#383834] transition-colors flex flex-col justify-between space-y-3 group overflow-hidden"
      style={
        {
          "--mouse-x": "0px",
          "--mouse-y": "0px",
        } as any
      }
    >
      {/* Subtle radial spotlight */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), rgba(217, 119, 87, 0.08), transparent 40%)",
        }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h2 className="text-sm font-semibold text-[#ECECEC] group-hover:text-white transition-colors">
              {company.name}
            </h2>
            <span className="text-[11px] font-mono text-[#8E8D8A]">
              {company.sector}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                company.activeInternshipsCount > 0 ? "bg-[#4ADE80]" : "bg-[#8E8D8A]/40"
              }`}
            />
            <span className="text-[#8E8D8A]">
              {company.activeInternshipsCount > 0
                ? `${company.activeInternshipsCount} open`
                : "Off-season"}
            </span>
          </div>
        </div>

        {/* Typical Season */}
        <div className="bg-[#0D0D0C] border border-[#222220] rounded p-2.5 space-y-1">
          <span className="text-[10px] uppercase font-mono text-[#8E8D8A] tracking-wider block">
            Typical Intake Window
          </span>
          <p className="text-xs text-[#ECECEC] font-mono">
            {company.typicalSeason || "Spring & Summer"}
          </p>
        </div>
      </div>

      {/* Direct Portal Link */}
      <div className="relative z-10 pt-2 border-t border-[#222220] flex items-center justify-between">
        <span className="text-[10px] font-mono text-[#8E8D8A]">
          Crawler: {company.scraperType}
        </span>
        <a
          href={company.careersUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-mono text-[#8E8D8A] hover:text-[#ECECEC] transition-colors"
        >
          <span>Career Portal</span>
          <ArrowUpRight className="w-3 h-3" />
        </a>
      </div>
    </motion.div>
  );
}

export function CompaniesExplorer({ companies }: CompaniesExplorerProps) {
  const [search, setSearch] = useState("");
  const [selectedSector, setSelectedSector] = useState("All");
  const [onlyActive, setOnlyActive] = useState(false);

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !c.name.toLowerCase().includes(q) &&
          !c.sector.toLowerCase().includes(q) &&
          !(c.typicalSeason && c.typicalSeason.toLowerCase().includes(q))
        ) {
          return false;
        }
      }

      if (selectedSector !== "All" && c.sector !== selectedSector) {
        return false;
      }

      if (onlyActive && c.activeInternshipsCount === 0) {
        return false;
      }

      return true;
    });
  }, [companies, search, selectedSector, onlyActive]);

  return (
    <div className="space-y-6">
      {/* Top Bar: Title & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262624] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#D97757]" />
            <h1 className="text-base font-semibold text-[#ECECEC] tracking-tight">
              Company Radar — 16 Monitored Egyptian Employers
            </h1>
          </div>
          <p className="text-xs text-[#8E8D8A] font-mono mt-0.5">
            Verified root career portals & historical intake seasons.
          </p>
        </div>

        {/* Search & Sector Filters */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8D8A]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employer..."
              className="w-48 sm:w-56 bg-[#161614] border border-[#262624] focus:border-[#383834] rounded-md pl-8 pr-7 py-1.5 text-xs text-[#ECECEC] placeholder-[#8E8D8A]/60 focus:outline-none font-mono"
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

          <button
            type="button"
            onClick={() => setOnlyActive(!onlyActive)}
            className={`px-2.5 py-1.5 rounded-md text-xs font-mono border transition-colors ${
              onlyActive
                ? "bg-[#161614] text-[#4ADE80] border-[#4ADE80]/40"
                : "bg-[#161614] text-[#8E8D8A] border-[#262624] hover:text-[#ECECEC]"
            }`}
          >
            Hiring Only
          </button>
        </div>
      </div>

      {/* Sector filter pills */}
      <div className="flex flex-wrap gap-1.5 font-mono text-xs">
        {SECTORS.map((sec) => (
          <button
            key={sec}
            onClick={() => setSelectedSector(sec)}
            className={`px-2.5 py-1 rounded text-[11px] transition-colors border ${
              selectedSector === sec
                ? "bg-[#161614] text-[#ECECEC] border-[#383834]"
                : "bg-[#0D0D0C] text-[#8E8D8A] border-[#222220] hover:text-[#ECECEC]"
            }`}
          >
            {sec}
          </button>
        ))}
      </div>

      {/* Grid of Company Radar Cards with AnimatePresence & Spotlight */}
      <AnimatePresence mode="popLayout">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}
