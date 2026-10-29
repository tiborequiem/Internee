import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-[#313244]/60 bg-[#181825] py-6 text-[#a6adc8] text-xs">
      <div className="max-w-[1400px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-[#cdd6f4] font-medium">Internee</span>
          <span className="text-[#45475a]">·</span>
          <span className="text-[#6c7086]">Egypt</span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-[#a6adc8]">
          <Link href="/" className="hover:text-[#cdd6f4] transition-colors">
            Roles
          </Link>
          <Link href="/companies" className="hover:text-[#cdd6f4] transition-colors">
            Companies
          </Link>
          <Link href="/submit" className="hover:text-[#cdd6f4] transition-colors">
            Add role
          </Link>
          <Link href="/admin" className="hover:text-[#cdd6f4] transition-colors">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
