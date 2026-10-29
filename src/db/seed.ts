import { db } from "./index";
import { companies, internships } from "./schema";
import { EGYPT_COMPANIES_SEED } from "./seed-data";

export async function seed() {
  console.log("🌱 Resetting and seeding database with verified companies ONLY...");

  // Delete all existing internships (NO FAKE / MOCKED DATA)
  await db.delete(internships);
  console.log("🧹 Cleared all internship rows (0 mock listings).");

  // Delete existing companies to ensure clean 16-company roster
  await db.delete(companies);

  console.log(`Seeding ${EGYPT_COMPANIES_SEED.length} verified Egyptian companies...`);

  for (const item of EGYPT_COMPANIES_SEED) {
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
  }

  console.log(`✅ Database ready: 16 companies seeded, 0 fake internships.`);
}

if (require.main === module || process.argv[1]?.endsWith("seed.ts")) {
  seed()
    .then(() => {
      console.log("Seeding complete!");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seeding failed:", err);
      process.exit(1);
    });
}
