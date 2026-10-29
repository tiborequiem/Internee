"use client";

import { useState, useEffect } from "react";
import { InternshipWithCompany } from "@/db/schema";
import { formatRelativeTime } from "@/lib/utils";
import {
  Shield,
  KeyRound,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Bot,
  RefreshCw,
  AlertCircle,
  Lock,
} from "lucide-react";

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
        <div className="space-y-1 text-center">
          <Shield className="w-5 h-5 text-[#cba6f7] mx-auto" />
          <h1 className="font-sans text-lg font-semibold text-[#cdd6f4]">Admin Moderation</h1>
          <p className="text-[#a6adc8]">Enter ADMIN_SECRET passcode.</p>
        </div>

        {statusMessage && (
          <div className="p-3 rounded bg-[#181825] border border-[#f38ba8]/40 text-[#f38ba8] text-xs">
            {statusMessage.text}
          </div>
        )}

        <form onSubmit={handleLogin} className="bg-[#181825] border border-[#45475a] rounded-lg p-4 space-y-3 shadow-xl">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-[#a6adc8] font-semibold block">
              Passcode
            </label>
            <input
              type="password"
              required
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              placeholder="Enter passcode..."
              className="w-full bg-[#11111b] border border-[#313244] focus:border-[#cba6f7] rounded px-3 py-1.5 text-[#cdd6f4] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded bg-[#cba6f7] hover:bg-[#b4befe] text-[#11111b] font-sans font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Unlock"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#45475a] pb-4">
        <div>
          <h1 className="font-sans text-base font-semibold text-[#cdd6f4]">
            Community Moderation Queue
          </h1>
          <p className="text-[11px] text-[#a6adc8]">
            One-click approve or reject student submissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerScraper}
            disabled={scraping}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#313244] hover:bg-[#45475a] border border-[#45475a] text-[#cdd6f4] transition-colors disabled:opacity-50"
          >
            <Bot className={`w-3.5 h-3.5 text-[#cba6f7] ${scraping ? "animate-spin" : ""}`} />
            <span>{scraping ? "Crawling..." : "Trigger Crawler"}</span>
          </button>

          <button
            onClick={() => verifyAndFetch(adminSecret)}
            disabled={loading}
            className="p-1.5 rounded bg-[#313244] border border-[#45475a] text-[#a6adc8] hover:text-[#cdd6f4]"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleLogout}
            className="px-2.5 py-1.5 rounded bg-[#181825] border border-[#f38ba8]/40 text-[#f38ba8] hover:bg-[#f38ba8]/15"
          >
            Lock
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded border text-xs ${
            statusMessage.type === "success"
              ? "bg-[#181825] border-[#a6e3a1]/40 text-[#a6e3a1]"
              : "bg-[#181825] border-[#f38ba8]/40 text-[#f38ba8]"
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Moderation Queue Table */}
      <div className="border border-[#45475a] rounded-lg bg-[#181825] overflow-hidden shadow-xl">
        <div className="py-2.5 px-4 bg-[#11111b] border-b border-[#45475a] flex items-center justify-between text-[11px] text-[#a6adc8]">
          <span>PENDING SUBMISSIONS ({pendingList.length})</span>
        </div>

        {pendingList.length === 0 ? (
          <div className="py-16 text-center text-[#a6adc8]">
            <CheckCircle2 className="w-5 h-5 text-[#a6e3a1] mx-auto mb-2" />
            <p className="text-xs">Queue is clear. No pending community submissions.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#313244]">
            {pendingList.map((item) => (
              <div
                key={item.id}
                className="py-3 px-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-[#313244]/40 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[#a6adc8]">{item.company.name}</span>
                    <span className="text-[#45475a]">/</span>
                    <span className="text-[#cdd6f4] font-sans font-medium">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-[#a6adc8]">
                    <span>{item.category}</span>
                    <span>•</span>
                    <span>{item.location}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(item.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={item.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-[#a6adc8] hover:text-[#cdd6f4]"
                    title="Open link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => handleModerate(item.id, "approve")}
                    className="px-2.5 py-1 rounded bg-[#a6e3a1]/20 text-[#a6e3a1] border border-[#a6e3a1]/40 hover:bg-[#a6e3a1]/30 transition-colors font-medium"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() => handleModerate(item.id, "reject")}
                    className="px-2.5 py-1 rounded bg-[#f38ba8]/20 text-[#f38ba8] border border-[#f38ba8]/40 hover:bg-[#f38ba8]/30 transition-colors"
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
