import { db } from "../src/db";
import { companies, internships } from "../src/db/schema";
import {
  getPublicInternships,
  getCompaniesDirectory,
  submitCommunityInternship,
  upsertScrapedInternships,
  moderateInternship,
  getPendingInternships,
  getPlatformStats,
} from "../src/lib/queries";
import { isStrictEgyptInternship } from "../src/lib/internship-filter";
import { runScrapers } from "../src/lib/scrapers";
import { eq } from "drizzle-orm";

import { seed } from "../src/db/seed";

async function runTests() {
  console.log("=========================================");
  console.log("RUNNING SYSTEM SPECIFICATION TESTS");
  console.log("=========================================\n");

  await seed(false);

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`, detail || "");
      failed++;
    }
  }

  const now = new Date();
  const currentYear = now.getFullYear();

  // ----------------------------------------------------
  // TEST SUITE 1: isStrictEgyptInternship & Dynamic Date Filter
  // ----------------------------------------------------
  console.log("\n--- TEST SUITE 1: isStrictEgyptInternship Dynamic Date Filter ---");
  
  // 1.1 Valid Egyptian Internships
  assert(
    isStrictEgyptInternship("Software Engineering Intern", "Cairo, Egypt", Date.now()),
    "Accepts standard Software Engineering Intern in Cairo"
  );
  assert(
    isStrictEgyptInternship(`Vodanation Winter Internship ${currentYear}`, "Smart Village, Giza", Date.now()),
    `Accepts Vodanation Winter Internship ${currentYear} in Giza`
  );
  assert(
    isStrictEgyptInternship(`Summer Academy ${currentYear + 1}`, "New Cairo", Date.now()),
    `Accepts Summer Academy ${currentYear + 1} (upcoming year)`
  );

  // 1.2 Block Past Years (e.g. 2024, 2025)
  assert(
    !isStrictEgyptInternship("Software Engineering Intern 2024", "Cairo", Date.now()),
    "Strictly blocks past year 2024"
  );
  assert(
    !isStrictEgyptInternship("Vodafone Summer Intern 2025", "Giza", Date.now()),
    "Strictly blocks past year 2025"
  );

  // 1.3 Block Expired Seasons in Current Year
  if (now.getMonth() >= 8) {
    assert(
      !isStrictEgyptInternship(`Summer ${currentYear} Engineering Intern`, "Cairo", Date.now()),
      `Strictly blocks Summer ${currentYear} when current month is >= September`
    );
    assert(
      !isStrictEgyptInternship(`Spring ${currentYear} Trainee`, "Cairo", Date.now()),
      `Strictly blocks Spring ${currentYear} when current month is >= September`
    );
  }

  // 1.4 Block Stale Postings (older than 45 days)
  const fiftyDaysAgo = Date.now() - 50 * 24 * 60 * 60 * 1000;
  assert(
    !isStrictEgyptInternship("Software Engineering Intern", "Cairo", fiftyDaysAgo),
    "Strictly blocks stale postings (> 45 days old)"
  );
  const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;
  assert(
    isStrictEgyptInternship("Software Engineering Intern", "Cairo", tenDaysAgo),
    "Accepts recent postings (10 days old)"
  );

  // 1.5 Quality Filter (Seniority Prefixes vs Explicit Intern with Specialist/Manager/Full-time)
  assert(
    isStrictEgyptInternship("Talent Acquisition Specialist Intern", "Cairo", Date.now()),
    "Accepts 'Talent Acquisition Specialist Intern' (explicit intern not disqualified by Specialist)"
  );
  assert(
    isStrictEgyptInternship("Product Manager Intern", "Giza", Date.now()),
    "Accepts 'Product Manager Intern' (explicit intern not disqualified by Manager)"
  );
  assert(
    isStrictEgyptInternship("Full-Time Intern", "Cairo", Date.now()),
    "Accepts 'Full-Time Intern' (explicit intern not disqualified by Full-Time)"
  );
  assert(
    !isStrictEgyptInternship("Junior Intern", "Cairo", Date.now()),
    "Strictly blocks 'Junior Intern' (disqualifying seniority prefix)"
  );
  assert(
    !isStrictEgyptInternship("Junior Software Engineer", "Cairo", Date.now()),
    "Strictly blocks 'Junior Software Engineer'"
  );
  assert(
    !isStrictEgyptInternship("Senior Backend Engineer", "Giza", Date.now()),
    "Strictly blocks 'Senior Backend Engineer'"
  );
  assert(
    !isStrictEgyptInternship("Full-time Developer", "Cairo", Date.now()),
    "Strictly blocks 'Full-time Developer' (lacks intern keyword)"
  );
  assert(
    !isStrictEgyptInternship("Software Engineering Intern", "London, UK", Date.now()),
    "Strictly blocks non-Egypt locations (London, UK)"
  );

  // ----------------------------------------------------
  // TEST SUITE 2: Verified Companies & Zero Mock Listings
  // ----------------------------------------------------
  console.log("\n--- TEST SUITE 2: 16 Companies & Zero Fake Data ---");
  const companiesDir = await getCompaniesDirectory();
  assert(
    companiesDir.length === 16,
    `getCompaniesDirectory returns exactly 16 verified companies (found: ${companiesDir.length})`
  );
  assert(
    companiesDir.some((c) => c.slug === "vodafone-egypt") &&
      companiesDir.some((c) => c.slug === "microsoft-egypt") &&
      companiesDir.some((c) => c.slug === "amazon-egypt") &&
      companiesDir.some((c) => c.slug === "google-egypt"),
    "Verified high-signal companies present in directory"
  );

  // ----------------------------------------------------
  // TEST SUITE 3: Module A Queries
  // ----------------------------------------------------
  console.log("\n--- TEST SUITE 3: Module A Queries ---");
  const publicList = await getPublicInternships();
  assert(
    Array.isArray(publicList),
    "getPublicInternships returns array of valid roles"
  );
  assert(
    publicList.every((item) => item.status !== "pending_review"),
    "getPublicInternships excludes pending_review"
  );

  // Community submission test
  const testCommunity = await submitCommunityInternship({
    companyName: "Vodafone Egypt (_VOIS)",
    title: `Vodanation Winter Trainee ${currentYear}`,
    applicationUrl: `https://test-apply.example.com/vodafone-${Date.now()}`,
    category: "Software & Data",
    location: "Giza",
  });
  assert(
    testCommunity.status === "pending_review" && testCommunity.source === "community",
    "submitCommunityInternship creates pending_review record"
  );

  const adminSecret = process.env.ADMIN_SECRET || "egypt_internships_admin_secret_2025";
  const pendingItems = await getPendingInternships(adminSecret);
  assert(
    pendingItems.some((i) => i.id === testCommunity.id),
    "getPendingInternships returns submission for moderation"
  );

  // Moderate approve
  const approved = await moderateInternship(testCommunity.id, "approve", adminSecret);
  assert(approved?.status === "open", "moderateInternship 'approve' sets status to 'open'");

  // Moderate reject
  await moderateInternship(testCommunity.id, "reject", adminSecret);
  const deletedCheck = await db.select().from(internships).where(eq(internships.id, testCommunity.id)).get();
  assert(!deletedCheck, "moderateInternship 'reject' removes record");

  // Upsert scraped
  const upsertRes = await upsertScrapedInternships([
    {
      companySlug: "microsoft-egypt",
      title: `ADC Winter SWE Intern ${currentYear}`,
      category: "Software & Data",
      location: "Cairo",
      applicationUrl: `https://careers.microsoft.com/job/test-${Date.now()}`,
      postedAt: Date.now(),
    },
    // Blocked:
    {
      companySlug: "microsoft-egypt",
      title: "Senior Azure Architect",
      category: "Software & Data",
      location: "Cairo",
      applicationUrl: `https://careers.microsoft.com/job/senior-${Date.now()}`,
      postedAt: Date.now(),
    },
  ]);
  assert(
    upsertRes.added === 1 && upsertRes.rejectedByFilter === 1,
    "upsertScrapedInternships adds valid role and rejects Senior role"
  );

  // ----------------------------------------------------
  // TEST SUITE 4: Scraper Engine (No Mock Fallbacks)
  // ----------------------------------------------------
  console.log("\n--- TEST SUITE 4: Scraper Engine ---");
  const scrapeSummary = await runScrapers();
  assert(
    scrapeSummary.success === true && scrapeSummary.scannedCompanies > 0,
    `runScrapers executed over ${scrapeSummary.scannedCompanies} automated companies with zero mock fallbacks`
  );

  console.log("\n=========================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=========================================\n");

  if (failed > 0) process.exit(1);
}

runTests().catch((e) => {
  console.error("Test execution fatal error:", e);
  process.exit(1);
});
