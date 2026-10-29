import { NextRequest } from "next/server";
import { GET as cronScrapeGet } from "../src/app/api/cron/scrape/route";
import { POST as communitySubmitPost } from "../src/app/api/community/submit/route";
import { POST as quickDropPost } from "../src/app/api/community/quick-drop/route";
import { POST as scanPost } from "../src/app/api/scan/route";
import { GET as adminPendingGet } from "../src/app/api/admin/pending/route";
import { POST as adminModeratePost } from "../src/app/api/admin/moderate/route";
import { detectSourceType, parseSearchResultToInternship } from "../src/lib/scrapers/dork-scanner";

async function testApiRoutes() {
  console.log("=========================================");
  console.log("🌐 TESTING NEXT.JS API ROUTE HANDLERS");
  console.log("=========================================\n");

  let passed = 0;
  let failed = 0;

  function assert(cond: boolean, desc: string, extra?: any) {
    if (cond) {
      console.log(`✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${desc}`, extra || "");
      failed++;
    }
  }

  process.env.CRON_SECRET = "egypt_internships_cron_secret_2025";
  process.env.ADMIN_SECRET = "egypt_internships_admin_secret_2025";

  // 1. Dork Scanner Helpers
  console.log("\n--- Testing Dork Scanner Helpers ---");
  assert(
    detectSourceType("https://www.linkedin.com/posts/xyz-internship") === "linkedin_post",
    "detectSourceType identifies LinkedIn post"
  );
  assert(
    detectSourceType("https://docs.google.com/forms/d/e/1FAIpQLSc...") === "google_form",
    "detectSourceType identifies Google Form"
  );
  assert(
    detectSourceType("https://www.tiktok.com/@user/video/12345") === "tiktok",
    "detectSourceType identifies TikTok"
  );
  assert(
    detectSourceType("https://jobs.vodafone.com/careers") === "portal",
    "detectSourceType defaults to portal"
  );

  const parsedHit = parseSearchResultToInternship({
    title: "Swvl - Software Engineering Intern in Cairo | LinkedIn",
    link: "https://www.linkedin.com/jobs/view/12345678",
    snippet: "Swvl is hiring an undergraduate Software Engineering Intern in Cairo, Egypt.",
  });
  assert(
    Boolean(parsedHit && parsedHit.category === "Software & Data" && parsedHit.location === "Cairo"),
    "parseSearchResultToInternship parses clean role, company, and category"
  );

  // 2. Cron Scrape Route
  console.log("\n--- Testing /api/cron/scrape ---");
  const reqNoAuth = new NextRequest("http://localhost:3000/api/cron/scrape");
  const resNoAuth = await cronScrapeGet(reqNoAuth);
  assert(resNoAuth.status === 401, "GET /api/cron/scrape without token returns 401");

  const reqGoodAuth = new NextRequest("http://localhost:3000/api/cron/scrape", {
    headers: { authorization: "Bearer egypt_internships_cron_secret_2025" },
  });
  const resGoodAuth = await cronScrapeGet(reqGoodAuth);
  const dataGoodAuth = await resGoodAuth.json();
  assert(
    resGoodAuth.status === 200 && dataGoodAuth.success === true,
    `GET /api/cron/scrape returns 200 (scanned ${dataGoodAuth.scannedCompanies} companies)`
  );

  // 3. Quick Drop 1-Click Route
  console.log("\n--- Testing /api/community/quick-drop ---");
  const reqQuickDropEmpty = new NextRequest("http://localhost:3000/api/community/quick-drop", {
    method: "POST",
    body: JSON.stringify({ url: "" }),
  });
  const resQuickDropEmpty = await quickDropPost(reqQuickDropEmpty);
  assert(resQuickDropEmpty.status === 400, "POST /api/community/quick-drop rejects empty url with 400");

  const uniqueQuickUrl = `https://forms.gle/intern-${Date.now()}`;
  const reqQuickDropValid = new NextRequest("http://localhost:3000/api/community/quick-drop", {
    method: "POST",
    body: JSON.stringify({
      url: uniqueQuickUrl,
      handle: "@cairo_student",
    }),
  });
  const resQuickDropValid = await quickDropPost(reqQuickDropValid);
  const dataQuickDropValid = await resQuickDropValid.json();
  assert(
    resQuickDropValid.status === 200 && dataQuickDropValid.success === true,
    "POST /api/community/quick-drop successfully drops link with credit handle"
  );

  // 4. On-Demand Public Scan Route
  console.log("\n--- Testing /api/scan ---");
  const resScan = await scanPost();
  const dataScan = await resScan.json();
  assert(
    resScan.status === 200 && dataScan.success === true && Array.isArray(dataScan.logs),
    "POST /api/scan triggers discovery scan and returns execution logs"
  );

  // 5. Community Submit Route (Standard Form)
  console.log("\n--- Testing /api/community/submit ---");
  const reqJunior = new NextRequest("http://localhost:3000/api/community/submit", {
    method: "POST",
    body: JSON.stringify({
      companyName: "Swvl",
      title: "Junior Backend Developer",
      applicationUrl: "https://swvl.com/jobs/junior-dev",
      category: "Software & Data",
      location: "Cairo",
    }),
  });
  const resJunior = await communitySubmitPost(reqJunior);
  assert(
    resJunior.status === 422,
    "POST /api/community/submit blocks 'Junior' position with 422 status"
  );

  // 6. Admin Pending Route
  console.log("\n--- Testing /api/admin/pending ---");
  const reqGoodAdmin = new NextRequest("http://localhost:3000/api/admin/pending", {
    headers: { "x-admin-secret": "egypt_internships_admin_secret_2025" },
  });
  const resGoodAdmin = await adminPendingGet(reqGoodAdmin);
  assert(
    resGoodAdmin.status === 200,
    "GET /api/admin/pending returns 200 with valid admin secret"
  );

  console.log("\n=========================================");
  console.log(`API ROUTE TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=========================================\n");

  if (failed > 0) process.exit(1);
}

testApiRoutes().catch((e) => {
  console.error("API test error:", e);
  process.exit(1);
});
