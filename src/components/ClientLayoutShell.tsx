"use client";

import { useState, useEffect } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { TrackedDrawer } from "./TrackedDrawer";
import { InternshipWithCompany } from "@/db/schema";

interface ClientLayoutShellProps {
  children: React.ReactNode;
}

export function ClientLayoutShell({ children }: ClientLayoutShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [allInternships, setAllInternships] = useState<InternshipWithCompany[]>([]);

  useEffect(() => {
    fetch("/api/internships")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setAllInternships(data);
        }
      })
      .catch(() => {});
  }, []);

  const openCount = allInternships.filter((i) => i.status === "open").length;

  return (
    <div className="flex flex-col min-h-screen bg-[#1e1e2e] text-[#cdd6f4]">
      <Navbar onOpenTracker={() => setDrawerOpen(true)} activeCount={openCount} />
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-6">
        {children}
      </main>
      <Footer />
      <TrackedDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        allInternships={allInternships}
      />
    </div>
  );
}
