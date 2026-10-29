import { getCompaniesDirectory } from "@/lib/queries";
import { CompaniesExplorer } from "@/components/CompaniesExplorer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Companies | Internee",
  description: "Monitored employers and direct career portals in Egypt.",
};

export default async function CompaniesPage() {
  const companies = await getCompaniesDirectory();

  return <CompaniesExplorer companies={companies} />;
}
