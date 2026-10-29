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
      className="relative p-4 rounded-lg bg-[#181825] border border-[#45475a] hover:border-[#cba6f7]/60 transition-colors flex flex-col justify-between space-y-3 group overflow-hidden"
      style={
        {
          "--mouse-x": "0px",
          "--mouse-y": "0px",
        } as any
      }
    >
      {/* Subtle radial spotlight in Mocha Mauve */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), rgba(203, 166, 247, 0.08), transparent 40%)",
        }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h2 className="text-sm font-semibold text-[#cdd6f4] group-hover:text-white transition-colors">
              {company.name}
            </h2>
            <span className="text-[11px] font-mono text-[#a6adc8]">
              {company.sector}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                company.activeInternshipsCount > 0
                  ? "bg-[#a6e3a1] shadow-[0_0_6px_#a6e3a1]"
                  : "bg-[#6c7086]/50"
              }`}
            />
            <span className="text-[#a6adc8]">
              {company.activeInternshipsCount > 0
                ? `${company.activeInternshipsCount} open`
                : "Off-season"}
            </span>
          </div>
        </div>

        {/* Typical Season */}
        <div className="bg-[#11111b] border border-[#313244] rounded p-2.5 space-y-1">
          <span className="text-[10px] uppercase font-mono text-[#a6adc8] tracking-wider block">
            Typical Intake Window
          </span>
          <p className="text-xs text-[#cdd6f4] font-mono">
            {company.typicalSeason || "Spring & Summer"}
          </p>
        </div>
      </div>

      {/* Direct Portal Link */}
      <div className="relative z-10 pt-2 border-t border-[#313244] flex items-center justify-between">
        <span className="text-[10px] font-mono text-[#a6adc8]">
          Crawler: {company.scraperType}
        </span>
        <a
          href={company.careersUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-mono text-[#a6adc8] hover:text-[#cba6f7] transition-colors"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#45475a] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#cba6f7]" />
            <h1 className="text-base font-semibold text-[#cdd6f4] tracking-tight">
              Company Radar — 16 Monitored Egyptian Employers
            </h1>
          </div>
          <p className="text-xs text-[#a6adc8] font-mono mt-0.5">
            Verified root career portals &amp; historical intake seasons.
          </p>
        </div>

        {/* Search & Sector Filters */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#a6adc8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employer..."
              className="w-48 sm:w-56 bg-[#181825] border border-[#45475a] focus:border-[#cba6f7] rounded-md pl-8 pr-7 py-1.5 text-xs text-[#cdd6f4] placeholder-[#6c7086] focus:outline-none font-mono"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#a6adc8] hover:text-[#cdd6f4]"
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
                ? "bg-[#313244] text-[#a6e3a1] border-[#a6e3a1]/50"
                : "bg-[#181825] text-[#a6adc8] border-[#45475a] hover:text-[#cdd6f4]"
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
                ? "bg-[#313244] text-[#cdd6f4] border-[#cba6f7]/60 font-medium"
                : "bg-[#181825] text-[#a6adc8] border-[#45475a] hover:text-[#cdd6f4]"
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
