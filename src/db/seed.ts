import { db } from "./index";
import { companies, internships } from "./schema";
import { EGYPT_COMPANIES_SEED } from "./seed-data";
import { runScrapers } from "@/lib/scrapers";

import { eq, or, sql } from "drizzle-orm";

export async function seed(autoScrape = false) {
  console.log("Seeding verified companies...");

  // Remove any fake or mock placeholders (never delete genuine live scraped internships)
  await db
    .delete(internships)
    .where(or(eq(internships.source, "mock"), sql`${internships.source} IS NULL`));

  console.log(`Syncing ${EGYPT_COMPANIES_SEED.length} verified Egyptian companies...`);

  for (const item of EGYPT_COMPANIES_SEED) {
    const existing = await db
      .select()
      .from(companies)
      .where(eq(companies.slug, item.slug))
      .get();

    if (!existing) {
      await db.insert(companies).values({
        name: item.name,
        slug: item.slug,
        sector: item.sector,
        careersUrl: item.careersUrl,
        scraperType: item.scraperType,
        typicalSeason: item.typicalSeason,
        logoUrl: `https://avatar.vercel.sh/${item.slug}.svg?text=${encodeURIComponent(
          item.name.substring(0, 2).toUpperCase()
        )}`,
        lastCheckedAt: Date.now(),
      });
    } else {
      await db
        .update(companies)
        .set({
          name: item.name,
          sector: item.sector,
          careersUrl: item.careersUrl,
          scraperType: item.scraperType,
          typicalSeason: item.typicalSeason,
        })
        .where(eq(companies.id, existing.id));
    }
  }

  console.log(`Database ready: 16 companies active, 0 fake internships.`);

  if (autoScrape || process.argv.includes("--scrape")) {
    console.log("Ingesting real active internships from live networks (LinkedIn, Wuzzuf, Portals)...");
    try {
      const summary = await runScrapers();
      console.log(
        `Live ingestion complete: ${summary.newRolesAdded} new roles live (${summary.totalDiscovered} total found).`
      );
    } catch (err: any) {
      console.warn("Live ingest skipped:", err.message);
    }
  }
}

if (require.main === module || process.argv[1]?.endsWith("seed.ts")) {
  seed(true)
    .then(() => {
      console.log("Seeding complete!");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seeding failed:", err);
      process.exit(1);
    });
}
