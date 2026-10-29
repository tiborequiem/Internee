import { getPublicInternships } from "@/lib/queries";
import { InternshipExplorer } from "@/components/InternshipExplorer";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const internships = await getPublicInternships();

  return <InternshipExplorer initialInternships={internships} />;
}
