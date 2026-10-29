"use client";

import { useState, useEffect } from "react";
import { InternshipWithCompany } from "@/db/schema";
import { formatRelativeTime } from "@/lib/utils";
import { ExternalLink, Bot, RefreshCw } from "lucide-react";

export default function AdminPage() {
  const [adminSecret, setAdminSecret] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pendingList, setPendingList] = useState<InternshipWithCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("internee_admin_secret");
    if (saved) {
      setAdminSecret(saved);
      verifyAndFetch(saved);
    }
  }, []);

  const verifyAndFetch = async (secret: string) => {
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/admin/pending?secret=${encodeURIComponent(secret)}`, {
        headers: { "x-admin-secret": secret },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      setIsAuthenticated(true);
      setPendingList(data.pending || []);
      sessionStorage.setItem("internee_admin_secret", secret);
    } catch (err: any) {
      setIsAuthenticated(false);
      setStatusMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSecret.trim()) return;
    verifyAndFetch(adminSecret.trim());
  };

  const handleModerate = async (id: number, action: "approve" | "reject" | "close") => {
    setStatusMessage(null);

    try {
      const res = await fetch("/api/admin/moderate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret,
        },
        body: JSON.stringify({
          id,
          action,
          adminSecret,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to ${action} internship.`);
      }

      setStatusMessage({
        type: "success",
        text: `Item #${id} was ${action}d.`,
      });

      setPendingList((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  const handleTriggerScraper = async () => {
    setScraping(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/admin/trigger-scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret,
        },
        body: JSON.stringify({ adminSecret }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Scraper execution failed.");
      }

      setStatusMessage({
        type: "success",
        text: `Crawler scanned ${data.scannedCompanies} companies (${data.newRolesAdded} new added, ${data.existingSkipped} skipped, ${data.rejectedByFilter} blocked by filter).`,
      });

      verifyAndFetch(adminSecret);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    } finally {
      setScraping(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("internee_admin_secret");
    setIsAuthenticated(false);
    setAdminSecret("");
    setPendingList([]);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-sm mx-auto py-16 space-y-4 font-mono text-xs">
        <h1 className="font-sans text-sm font-medium text-[#cdd6f4] text-center">
          Moderation
        </h1>

        {statusMessage && (
          <div className="p-2.5 rounded bg-[#181825] border border-[#f38ba8]/40 text-[#f38ba8] text-xs">
            {statusMessage.text}
          </div>
        )}

        <form onSubmit={handleLogin} className="bg-[#181825] border border-[#313244] rounded p-4 space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-[#6c7086] block">
              Passcode
            </label>
            <input
              type="password"
              required
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              placeholder="Enter passcode..."
              className="w-full bg-[#11111b] border border-[#313244] focus:border-[#cba6f7] rounded px-3 py-1.5 text-[#cdd6f4] placeholder-[#6c7086] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-1.5 rounded bg-[#313244] hover:bg-[#45475a] text-[#cdd6f4] font-medium transition-colors disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Unlock"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#313244] pb-3">
        <div className="flex items-center gap-2">
          <h1 className="font-sans text-sm font-medium text-[#cdd6f4]">
            Moderation
          </h1>
          <span className="text-[#6c7086]">
            ({pendingList.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerScraper}
            disabled={scraping}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#313244] hover:bg-[#45475a] text-[#cdd6f4] transition-colors disabled:opacity-50"
          >
            <Bot className={`w-3.5 h-3.5 text-[#cba6f7] ${scraping ? "animate-spin" : ""}`} strokeWidth={1.75} />
            <span>{scraping ? "Scraping..." : "Trigger scrape"}</span>
          </button>

          <button
            onClick={() => verifyAndFetch(adminSecret)}
            disabled={loading}
            className="p-1 rounded bg-[#313244] text-[#a6adc8] hover:text-[#cdd6f4] transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} strokeWidth={1.75} />
          </button>

          <button
            onClick={handleLogout}
            className="px-2 py-1 rounded text-[#6c7086] hover:text-[#f38ba8] transition-colors"
          >
            Lock
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-2.5 rounded border text-xs ${
            statusMessage.type === "success"
              ? "bg-[#181825] border-[#a6e3a1]/40 text-[#a6e3a1]"
              : "bg-[#181825] border-[#f38ba8]/40 text-[#f38ba8]"
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Moderation Queue */}
      <div className="border-y border-[#313244]/60">
        {pendingList.length === 0 ? (
          <p className="py-12 text-center text-xs text-[#6c7086]">Queue empty.</p>
        ) : (
          <div className="divide-y divide-[#313244]/60">
            {pendingList.map((item) => (
              <div
                key={item.id}
                className="py-2.5 px-2 flex flex-col md:flex-row md:items-center justify-between gap-2 hover:bg-[#313244]/30 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[#a6adc8]">{item.company.name}</span>
                    <span className="text-[#45475a]">·</span>
                    <span className="text-[#cdd6f4] font-sans font-medium">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#6c7086]">
                    <span>{item.category}</span>
                    <span>·</span>
                    <span>{item.location}</span>
                    <span>·</span>
                    <span>{formatRelativeTime(item.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={item.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-[#6c7086] hover:text-[#cdd6f4] transition-colors"
                    title="Open link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </a>

                  <button
                    onClick={() => handleModerate(item.id, "approve")}
                    className="px-2 py-0.5 rounded text-[11px] bg-[#a6e3a1]/20 text-[#a6e3a1] hover:bg-[#a6e3a1]/30 transition-colors font-medium"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() => handleModerate(item.id, "reject")}
                    className="px-2 py-0.5 rounded text-[11px] bg-[#f38ba8]/20 text-[#f38ba8] hover:bg-[#f38ba8]/30 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
