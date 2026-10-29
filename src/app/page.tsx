import { getPublicInternships } from "@/lib/queries";
import { runScrapers } from "@/lib/scrapers";
import { InternshipExplorer } from "@/components/InternshipExplorer";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let internships = await getPublicInternships();

  // If the database has 0 internships (e.g. freshly initialized DB), trigger initial ingest
  if (internships.length === 0) {
    try {
      await runScrapers();
      internships = await getPublicInternships();
    } catch {
      // Gracefully continue with current DB state
    }
  }

  return <InternshipExplorer initialInternships={internships} />;
}
