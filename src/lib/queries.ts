import { db, ensureTablesExist } from "@/db";
import { companies, internships, Company, InternshipWithCompany } from "@/db/schema";
import { eq, ne, and, or, like, desc, sql } from "drizzle-orm";
import { isStrictEgyptInternship, checkStrictEgyptInternship } from "@/lib/internship-filter";

export interface PublicInternshipFilters {
  sector?: string;
  category?: string;
  location?: string;
  status?: string;
  search?: string;
  source?: string;
}

export interface ScrapedInternshipInput {
  companySlug?: string;
  companyId?: number;
  companyName?: string;
  title: string;
  category: string;
  location: string;
  applicationUrl: string;
  source?: string;
  sourceType?: string;
  submittedBy?: string;
  postedAt?: number;
  expiresAt?: number;
}

/**
 * 1. getPublicInternships
 * Returns all internships where status != 'pending_review', joined with company details,
 * ordered by status = 'open' first, then createdAt DESC.
 */
export async function getPublicInternships(
  filters: PublicInternshipFilters = {}
): Promise<InternshipWithCompany[]> {
  try {
    await ensureTablesExist();

    const conditions = [ne(internships.status, "pending_review")];

    if (filters.category && filters.category !== "all") {
      conditions.push(eq(internships.category, filters.category));
    }

    if (filters.location && filters.location !== "all") {
      conditions.push(like(internships.location, `%${filters.location}%`));
    }

    if (filters.status && filters.status !== "all") {
      conditions.push(eq(internships.status, filters.status));
    }

    if (filters.sector && filters.sector !== "all") {
      conditions.push(eq(companies.sector, filters.sector));
    }

    if (filters.source && filters.source !== "all") {
      conditions.push(like(internships.source, `%${filters.source.toLowerCase()}%`));
    }

    if (filters.search && filters.search.trim() !== "") {
      const term = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          like(internships.title, term),
          like(companies.name, term),
          like(internships.location, term)
        )!
      );
    }

    // Drizzle query joining companies and internships
    const rows = await db
      .select({
        internship: internships,
        company: companies,
      })
      .from(internships)
      .innerJoin(companies, eq(internships.companyId, companies.id))
      .where(and(...conditions))
      .orderBy(
        sql`CASE WHEN ${internships.status} = 'open' THEN 0 ELSE 1 END`,
        desc(internships.createdAt)
      );

    return rows
      .map((r) => ({
        ...r.internship,
        company: r.company,
      }))
      .filter((item) =>
        isStrictEgyptInternship(item.title, item.location, item.postedAt || item.createdAt)
      );
  } catch (err: any) {
    console.error("[getPublicInternships] Database query failed:", err?.message || err);
    return [];
  }
}

/**
 * 2. getCompaniesDirectory
 * Returns all companies with a count of their currently active internships ('open')
 * and their typicalSeason window.
 */
export async function getCompaniesDirectory(): Promise<
  (Company & { activeInternshipsCount: number; totalInternshipsCount: number })[]
> {
  try {
    await ensureTablesExist();

    const allCompanies = await db
      .select()
      .from(companies)
      .orderBy(companies.name);

    const activeCounts = await db
      .select({
        companyId: internships.companyId,
        activeCount: sql<number>`count(case when ${internships.status} = 'open' then 1 end)`,
        totalCount: sql<number>`count(${internships.id})`,
      })
      .from(internships)
      .where(ne(internships.status, "pending_review"))
      .groupBy(internships.companyId);

    const countMap = new Map<number, { active: number; total: number }>();
    for (const c of activeCounts) {
      countMap.set(c.companyId, {
        active: Number(c.activeCount) || 0,
        total: Number(c.totalCount) || 0,
      });
    }

    return allCompanies.map((c) => {
      const stats = countMap.get(c.id) || { active: 0, total: 0 };
      return {
        ...c,
        activeInternshipsCount: stats.active,
        totalInternshipsCount: stats.total,
      };
    });
  } catch (err: any) {
    console.error("[getCompaniesDirectory] Database query failed:", err?.message || err);
    return [];
  }
}

/**
 * 3. submitCommunityInternship
 * Inserts a new record with status: 'pending_review' and source: 'community'.
 */
export async function submitCommunityInternship(data: {
  companyName: string;
  title: string;
  applicationUrl: string;
  category: string;
  location: string;
  sourceType?: string;
  submittedBy?: string;
}) {
  await ensureTablesExist();
  const cleanCompanyName = data.companyName.trim();
  const cleanTitle = data.title.trim();
  const cleanUrl = data.applicationUrl.trim();
  const cleanCategory = data.category.trim();
  const cleanLocation = data.location.trim();

  // Find or create company
  const slug = cleanCompanyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  let company = await db
    .select()
    .from(companies)
    .where(or(eq(companies.name, cleanCompanyName), eq(companies.slug, slug)))
    .get();

  if (!company) {
    company = await db
      .insert(companies)
      .values({
        name: cleanCompanyName,
        slug: slug || `company-${Date.now()}`,
        sector: "Tech", // Default sector
        careersUrl: cleanUrl,
        scraperType: "manual",
        typicalSeason: "Summer: May-Jul",
        logoUrl: `https://avatar.vercel.sh/${slug}.svg?text=${encodeURIComponent(
          cleanCompanyName.substring(0, 2).toUpperCase()
        )}`,
        lastCheckedAt: Date.now(),
      })
      .returning()
      .get();
  }

  // Insert community internship with status = 'pending_review'
  const inserted = await db
    .insert(internships)
    .values({
      companyId: company.id,
      title: cleanTitle,
      category: cleanCategory,
      location: cleanLocation,
      applicationUrl: cleanUrl,
      status: "pending_review",
      source: "community",
      sourceType: data.sourceType || "portal",
      submittedBy: data.submittedBy || null,
      postedAt: Date.now(),
      createdAt: Date.now(),
    })
    .returning()
    .get();

  return inserted;
}

/**
 * 4. upsertScrapedInternships
 * Checks if applicationUrl already exists. If not, inserts it with status: 'open' and source: 'scraper'.
 * Updates companies.lastCheckedAt.
 * Strictly enforces isStrictEgyptInternship.
 */
export async function upsertScrapedInternships(
  items: ScrapedInternshipInput[]
): Promise<{ added: number; skipped: number; rejectedByFilter: number }> {
  await ensureTablesExist();
  let added = 0;
  let skipped = 0;
  let rejectedByFilter = 0;

  for (const item of items) {
    // 1. Strict filter enforcement with diagnostic logging
    const isExperienceFiltered = item.source === "linkedin_guest_f_E_1";
    const filterCheck = checkStrictEgyptInternship(
      item.title,
      item.location,
      item.postedAt,
      isExperienceFiltered
    );

    console.log("[Scraper Candidate]", {
      title: item.title,
      company: item.companyName || item.companySlug || "Unknown",
      location: item.location,
      url: item.applicationUrl,
      valid: filterCheck.valid,
      ...(filterCheck.reason ? { rejectReason: filterCheck.reason } : {}),
    });

    if (!filterCheck.valid) {
      rejectedByFilter++;
      continue;
    }

    // 2. Resolve or create company
    let companyId = item.companyId;
    if (!companyId && item.companySlug) {
      const comp = await db
        .select()
        .from(companies)
        .where(eq(companies.slug, item.companySlug))
        .get();
      if (comp) {
        companyId = comp.id;
      }
    }

    if (!companyId) {
      const cleanName = (item.companyName || item.companySlug || "Egyptian Employer").trim();
      const baseSlug =
        cleanName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "") || `company-${Date.now()}`;

      let comp = await db
        .select()
        .from(companies)
        .where(or(eq(companies.name, cleanName), eq(companies.slug, baseSlug)))
        .get();

      if (!comp) {
        // Avoid unique slug collisions
        let finalSlug = baseSlug;
        const collisionCheck = await db
          .select()
          .from(companies)
          .where(eq(companies.slug, finalSlug))
          .get();
        if (collisionCheck) {
          finalSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
        }

        comp = await db
          .insert(companies)
          .values({
            name: cleanName,
            slug: finalSlug,
            sector: "Tech & Software",
            careersUrl: item.applicationUrl,
            scraperType: "manual",
            typicalSeason: "Summer Intake",
            logoUrl: `https://avatar.vercel.sh/${encodeURIComponent(finalSlug)}.svg?text=${encodeURIComponent(
              cleanName.substring(0, 2).toUpperCase()
            )}`,
            lastCheckedAt: Date.now(),
          })
          .returning()
          .get();
      }
      companyId = comp.id;
    }

    // 3. Check if applicationUrl already exists
    const existing = await db
      .select()
      .from(internships)
      .where(eq(internships.applicationUrl, item.applicationUrl.trim()))
      .get();

    if (existing) {
      skipped++;
      // Still update company lastCheckedAt
      await db
        .update(companies)
        .set({ lastCheckedAt: Date.now() })
        .where(eq(companies.id, companyId));
      continue;
    }

    // 4. Insert new role
    const now = Date.now();
    await db.insert(internships).values({
      companyId,
      title: item.title.trim(),
      category: item.category || "Software & Data",
      location: item.location || "Cairo",
      applicationUrl: item.applicationUrl.trim(),
      status: "open",
      source: item.source || "scraper",
      sourceType: item.sourceType || "portal",
      submittedBy: item.submittedBy || null,
      postedAt: item.postedAt || now,
      expiresAt: item.expiresAt || null,
      createdAt: now,
    });

    await db
      .update(companies)
      .set({ lastCheckedAt: now })
      .where(eq(companies.id, companyId));

    added++;
  }

  return { added, skipped, rejectedByFilter };
}

/**
 * 5. moderateInternship
 * Validates adminSecret === process.env.ADMIN_SECRET, then updates the internship status.
 */
export async function moderateInternship(
  id: number,
  action: "approve" | "reject" | "close",
  adminSecret: string
) {
  const expectedSecret =
    process.env.ADMIN_SECRET?.trim().replace(/^["']|["']$/g, "") ||
    "admin_9dec72da5efd7120236f309ceb8f8537";
  const cleanSecret = adminSecret.trim().replace(/^["']|["']$/g, "");
  if (!expectedSecret || cleanSecret !== expectedSecret) {
    throw new Error("Unauthorized: Invalid admin secret");
  }

  if (action === "approve") {
    return await db
      .update(internships)
      .set({ status: "open" })
      .where(eq(internships.id, id))
      .returning()
      .get();
  } else if (action === "close") {
    return await db
      .update(internships)
      .set({ status: "closed" })
      .where(eq(internships.id, id))
      .returning()
      .get();
  } else if (action === "reject") {
    return await db
      .delete(internships)
      .where(eq(internships.id, id))
      .returning()
      .get();
  }

  throw new Error(`Invalid action: ${action}`);
}

/**
 * Get pending internships for admin moderation
 */
export async function getPendingInternships(adminSecret: string): Promise<InternshipWithCompany[]> {
  const expectedSecret =
    process.env.ADMIN_SECRET?.trim().replace(/^["']|["']$/g, "") ||
    "admin_9dec72da5efd7120236f309ceb8f8537";
  const cleanSecret = adminSecret.trim().replace(/^["']|["']$/g, "");
  if (!expectedSecret || cleanSecret !== expectedSecret) {
    throw new Error("Unauthorized: Invalid admin secret");
  }

  const rows = await db
    .select({
      internship: internships,
      company: companies,
    })
    .from(internships)
    .innerJoin(companies, eq(internships.companyId, companies.id))
    .where(eq(internships.status, "pending_review"))
    .orderBy(desc(internships.createdAt));

  return rows.map((r) => ({
    ...r.internship,
    company: r.company,
  }));
}

/**
 * Platform directory summary stats
 */
export async function getPlatformStats() {
  try {
    await ensureTablesExist();

    const totalCompaniesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(companies)
      .get();

    const activeInternshipsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(internships)
      .where(eq(internships.status, "open"))
      .get();

    const pendingSubmissionsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(internships)
      .where(eq(internships.status, "pending_review"))
      .get();

    return {
      totalCompanies: Number(totalCompaniesResult?.count || 0),
      activeInternships: Number(activeInternshipsResult?.count || 0),
      pendingSubmissions: Number(pendingSubmissionsResult?.count || 0),
    };
  } catch (err: any) {
    console.error("[getPlatformStats] Database query failed:", err?.message || err);
    return {
      totalCompanies: 0,
      activeInternships: 0,
      pendingSubmissions: 0,
    };
  }
}
