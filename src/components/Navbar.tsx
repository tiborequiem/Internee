"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSavedInternships } from "@/hooks/useSavedInternships";
import { Bookmark, Shield, Plus } from "lucide-react";
import { motion } from "framer-motion";

interface NavbarProps {
  onOpenTracker?: () => void;
  activeCount?: number;
}

export function Navbar({ onOpenTracker, activeCount = 0 }: NavbarProps) {
  const pathname = usePathname();
  const { savedItems, isLoaded } = useSavedInternships();

  const trackedCount = isLoaded ? Object.keys(savedItems).length : 0;

  const navLinks = [
    { href: "/", label: "Active Openings" },
    { href: "/companies", label: "Company Radar (16)" },
    { href: "/submit", label: "Drop a Link" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#45475a] bg-[#181825]/95 backdrop-blur-md h-14">
      <div className="max-w-[1400px] mx-auto px-6 h-full flex items-center justify-between">
        {/* Left: Brand + Live Count */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-semibold text-sm tracking-tight text-[#cdd6f4] group-hover:text-white transition-colors">
              Internee <span className="text-[#a6adc8] font-normal">— Egypt</span>
            </span>
          </Link>

          {/* Live Count Pill */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#313244] border border-[#45475a] text-[11px] font-mono text-[#a6adc8]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                activeCount > 0 ? "bg-[#a6e3a1] animate-pulse" : "bg-[#6c7086]"
              }`}
            />
            <span className="text-[#cdd6f4] font-medium">{activeCount} active</span>
          </div>
        </div>

        {/* Center: Sliding Pill Navigation */}
        <nav className="flex items-center gap-1 bg-[#11111b] p-1 rounded-lg border border-[#313244]">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3 py-1 rounded-md text-xs font-mono transition-colors ${
                  isActive ? "text-[#cdd6f4] font-medium" : "text-[#a6adc8] hover:text-[#cdd6f4]"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-[#313244] rounded-md border border-[#45475a]"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1">
                  {link.href === "/submit" && <Plus className="w-3 h-3 text-[#cba6f7]" />}
                  {link.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Right: Saved Drawer Button + Admin */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTracker}
            type="button"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-colors border ${
              trackedCount > 0
                ? "bg-[#313244] text-[#cba6f7] border-[#cba6f7]/50 hover:border-[#cba6f7]"
                : "bg-[#181825] text-[#a6adc8] border-[#45475a] hover:text-[#cdd6f4] hover:border-[#585b70]"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved ({trackedCount})</span>
          </button>

          <Link
            href="/admin"
            title="Moderation Portal"
            className={`p-1.5 rounded-md border text-xs transition-colors ${
              pathname === "/admin"
                ? "bg-[#313244] text-[#cdd6f4] border-[#45475a]"
                : "text-[#a6adc8] border-transparent hover:text-[#cdd6f4] hover:bg-[#313244]"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
