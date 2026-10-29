import { getPublicInternships } from "@/lib/queries";
import { runScrapers } from "@/lib/scrapers";
import { InternshipExplorer } from "@/components/InternshipExplorer";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let internships = await getPublicInternships();

  // If the database has no live listings from LinkedIn or Wuzzuf, trigger ingest
  const hasLiveFeed = internships.some(
    (i) => i.source === "linkedin" || i.source === "wuzzuf"
  );
  if (!hasLiveFeed) {
    try {
      await runScrapers();
      internships = await getPublicInternships();
    } catch {
      // Gracefully continue with current DB state
    }
  }

  return <InternshipExplorer initialInternships={internships} />;
}
