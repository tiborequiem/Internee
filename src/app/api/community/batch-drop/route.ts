import { NextRequest, NextResponse } from "next/server";
import { upsertScrapedInternships, ScrapedInternshipInput } from "@/lib/queries";
import { checkStrictEgyptInternship } from "@/lib/internship-filter";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawItems = Array.isArray(body.items) ? body.items : [];

    if (rawItems.length === 0) {
      return NextResponse.json(
        { error: "No items provided in batch." },
        { status: 400 }
      );
    }

    const defaultHandle = typeof body.handle === "string" ? body.handle.trim() : null;

    const candidates: ScrapedInternshipInput[] = [];

    for (const raw of rawItems) {
      const title = (raw.title || "").replace(/\s+/g, " ").trim();
      const companyName = (raw.companyName || "").replace(/\s+/g, " ").trim() || "Egyptian Employer";
      const location = (raw.location || "").replace(/\s+/g, " ").trim() || "Cairo, Egypt";
      let applicationUrl = (raw.applicationUrl || raw.url || "").trim();

      if (!title || !applicationUrl) continue;

      // Clean query params
      applicationUrl = applicationUrl.split("?")[0].trim();

      const postedAt = raw.postedAt ? Number(raw.postedAt) : Date.now();
      const source = raw.source || "community";
      const sourceType = raw.sourceType || "portal";
      const submittedBy = raw.submittedBy || defaultHandle || null;

      // Filter check
      const filterCheck = checkStrictEgyptInternship(title, location, postedAt);
      if (!filterCheck.valid) {
        console.log(`[Batch Drop Excluded] "${title}": ${filterCheck.reason}`);
        continue;
      }

      candidates.push({
        companyName,
        title,
        category: raw.category || "Software & Data",
        location,
        applicationUrl,
        source,
        sourceType,
        submittedBy,
        postedAt,
      });
    }

    // Deduplicate by clean application URL
    const uniqueMap = new Map<string, ScrapedInternshipInput>();
    for (const c of candidates) {
      if (!uniqueMap.has(c.applicationUrl)) {
        uniqueMap.set(c.applicationUrl, c);
      }
    }

    const uniqueCandidates = Array.from(uniqueMap.values());
    const upsertRes = await upsertScrapedInternships(uniqueCandidates);

    return NextResponse.json({
      success: true,
      received: rawItems.length,
      valid: uniqueCandidates.length,
      added: upsertRes.added,
      skipped: upsertRes.skipped,
      rejectedByFilter: upsertRes.rejectedByFilter,
      message: `Successfully processed ${rawItems.length} items (${upsertRes.added} new added to board).`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Batch drop failed", message: err.message },
      { status: 500 }
    );
  }
}
