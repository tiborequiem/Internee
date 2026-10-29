import { getCompaniesDirectory } from "@/lib/queries";
import { CompaniesExplorer } from "@/components/CompaniesExplorer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Egyptian Companies Directory | Internee 🇪🇬",
  description:
    "Explore 60+ top companies and multinationals hiring interns in Egypt. Check their typical recruitment cycles and direct application portals.",
};

export default async function CompaniesPage() {
  const companies = await getCompaniesDirectory();

  return <CompaniesExplorer companies={companies} />;
}
