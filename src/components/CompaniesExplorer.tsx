"use client";

import { useState, useMemo } from "react";
import { Company } from "@/db/schema";
import { Search, X, ArrowUpRight } from "lucide-react";

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
  return (
    <div className="p-3.5 rounded border border-[#313244]/60 bg-[#181825] hover:border-[#45475a] transition-colors flex flex-col justify-between space-y-3">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h2 className="text-sm font-medium text-[#cdd6f4]">
              {company.name}
            </h2>
            <span className="text-[11px] font-mono text-[#6c7086]">
              {company.sector}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                company.activeInternshipsCount > 0
                  ? "bg-[#a6e3a1]"
                  : "bg-[#6c7086]"
              }`}
            />
            <span className="text-[#a6adc8]">
              {company.activeInternshipsCount > 0
                ? `${company.activeInternshipsCount} open`
                : "Off-season"}
            </span>
          </div>
        </div>

        <div className="text-xs">
          <span className="text-[11px] text-[#6c7086] block">Intake window</span>
          <span className="text-xs text-[#a6adc8] font-mono">
            {company.typicalSeason || "Spring & Summer"}
          </span>
        </div>
      </div>

      <div className="pt-2 border-t border-[#313244]/60 flex items-center justify-between text-xs font-mono">
        <span className="text-[11px] text-[#6c7086]">
          {company.scraperType}
        </span>
        <a
          href={company.careersUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[#a6adc8] hover:text-[#cba6f7] transition-colors"
        >
          <span>Portal</span>
          <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.75} />
        </a>
      </div>
    </div>
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
    <div className="space-y-4">
      {/* Top Bar: Title & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#313244] pb-3">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-medium text-[#cdd6f4]">
            Companies
          </h1>
          <span className="font-mono text-xs text-[#6c7086]">
            ({companies.length})
          </span>
        </div>

        {/* Search & Sector Filters */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6c7086]" strokeWidth={1.75} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter employers..."
              className="w-44 sm:w-52 bg-[#181825] border border-[#313244] focus:border-[#cba6f7] rounded pl-8 pr-7 py-1 text-xs text-[#cdd6f4] placeholder-[#6c7086] focus:outline-none font-mono"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6c7086] hover:text-[#cdd6f4]"
              >
                <X className="w-3 h-3" strokeWidth={1.75} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOnlyActive(!onlyActive)}
            className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
              onlyActive
                ? "bg-[#313244] text-[#a6e3a1]"
                : "text-[#6c7086] hover:text-[#a6adc8]"
            }`}
          >
            Hiring only
          </button>
        </div>
      </div>

      {/* Sector filter pills */}
      <div className="flex flex-wrap gap-1 font-mono text-xs">
        {SECTORS.map((sec) => (
          <button
            key={sec}
            onClick={() => setSelectedSector(sec)}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
              selectedSector === sec
                ? "bg-[#313244] text-[#cdd6f4] font-medium"
                : "text-[#6c7086] hover:text-[#a6adc8]"
            }`}
          >
            {sec}
          </button>
        ))}
      </div>

      {/* Grid of Company Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((company) => (
          <CompanyCard key={company.id} company={company} />
        ))}
      </div>
    </div>
  );
}
