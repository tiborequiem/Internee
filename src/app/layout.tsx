import type { Metadata } from "next";
import "./globals.css";
import { ClientLayoutShell } from "@/components/ClientLayoutShell";

export const metadata: Metadata = {
  title: "Internee 🇪🇬 | Egypt Internships Directory & Automated Tracker",
  description:
    "Discover verified student internships, summer training, and graduate academies across Egypt. Automated crawler for tech, telecom, finance, and multinationals.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
        <ClientLayoutShell>{children}</ClientLayoutShell>
      </body>
    </html>
  );
}
