import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-[#262624] bg-[#0D0D0C] py-8 text-[#8E8D8A] text-xs">
      <div className="max-w-[1400px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-[#ECECEC] font-medium">Internee</span>
          <span className="text-[#262624]">|</span>
          <span>Verified undergraduate internship tracker for Egypt</span>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono">
          <Link href="/" className="hover:text-[#ECECEC] transition-colors">
            Active Openings
          </Link>
          <Link href="/companies" className="hover:text-[#ECECEC] transition-colors">
            Company Radar (16)
          </Link>
          <Link href="/submit" className="hover:text-[#ECECEC] transition-colors">
            Submit Link
          </Link>
          <Link href="/admin" className="hover:text-[#ECECEC] transition-colors">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
