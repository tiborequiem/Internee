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
    { href: "/", label: "Roles" },
    { href: "/companies", label: "Companies" },
    { href: "/submit", label: "Add role" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#313244]/60 bg-[#181825]/95 backdrop-blur-md h-13">
      <div className="max-w-[1400px] mx-auto px-6 h-full flex items-center justify-between">
        {/* Left: Brand + Count */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-semibold text-sm tracking-tight text-[#cdd6f4] group-hover:text-white transition-colors">
              Internee <span className="text-[#6c7086] font-normal">— Egypt</span>
            </span>
          </Link>

          {/* Plain count without glowing ping */}
          <span className="hidden sm:inline font-mono text-xs text-[#6c7086]">
            {activeCount} roles
          </span>
        </div>

        {/* Center: Navigation */}
        <nav className="flex items-center gap-1 bg-[#11111b] p-1 rounded-md border border-[#313244]/80">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3 py-1 rounded text-xs font-mono transition-colors duration-120 ${
                  isActive ? "text-[#cdd6f4] font-medium" : "text-[#a6adc8] hover:text-[#cdd6f4]"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-[#313244] rounded border border-[#45475a]/80"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1">
                  {link.href === "/submit" && <Plus className="w-3.5 h-3.5 text-[#cba6f7]" strokeWidth={1.75} />}
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
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-colors duration-120 border ${
              trackedCount > 0
                ? "bg-[#313244] text-[#cba6f7] border-[#cba6f7]/50"
                : "bg-transparent text-[#a6adc8] border-[#313244] hover:text-[#cdd6f4] hover:border-[#45475a]"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Saved ({trackedCount})</span>
          </button>

          <Link
            href="/admin"
            title="Moderation"
            className={`p-1.5 rounded border text-xs transition-colors duration-120 ${
              pathname === "/admin"
                ? "bg-[#313244] text-[#cdd6f4] border-[#45475a]"
                : "text-[#a6adc8] border-transparent hover:text-[#cdd6f4] hover:bg-[#313244]"
            }`}
          >
            <Shield className="w-3.5 h-3.5" strokeWidth={1.75} />
          </Link>
        </div>
      </div>
    </header>
  );
}
