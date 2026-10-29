import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-[#45475a] bg-[#181825] py-8 text-[#a6adc8] text-xs">
      <div className="max-w-[1400px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-[#cdd6f4] font-medium">Internee</span>
          <span className="text-[#45475a]">|</span>
          <span>Verified undergraduate internship tracker for Egypt</span>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono">
          <Link href="/" className="hover:text-[#cdd6f4] transition-colors">
            Active Openings
          </Link>
          <Link href="/companies" className="hover:text-[#cdd6f4] transition-colors">
            Company Radar (16)
          </Link>
          <Link href="/submit" className="hover:text-[#cdd6f4] transition-colors">
            Submit Link
          </Link>
          <Link href="/admin" className="hover:text-[#cdd6f4] transition-colors">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
