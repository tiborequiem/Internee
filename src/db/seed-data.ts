// src/db/seed-data.ts

export interface CompanySeed {
  name: string;
  slug: string;
  sector: "Tech" | "Telecom" | "Banking & Fintech" | "FMCG" | "Consulting" | "Engineering";
  careersUrl: string;
  scraperType: "workday" | "greenhouse" | "lever" | "workable" | "html" | "manual";
  typicalSeason: string;
  programName?: string;
}

/**
 * 16 Highest-Signal Verified Egyptian Companies with Root Career URLs
 */
export const EGYPT_COMPANIES_SEED: CompanySeed[] = [
  {
    name: "Vodafone Egypt (_VOIS)",
    slug: "vodafone-egypt",
    sector: "Telecom",
    careersUrl: "https://jobs.vodafone.com/careers?query=intern&location=Egypt",
    scraperType: "html",
    typicalSeason: "Apr to Jun (Vodanation Summer Intake)",
    programName: "Vodanation Summer Internship",
  },
  {
    name: "Microsoft Egypt ADC",
    slug: "microsoft-egypt",
    sector: "Tech",
    careersUrl: "https://jobs.careers.microsoft.com/global/en/search?q=intern&lc=Egypt",
    scraperType: "html",
    typicalSeason: "Oct to Feb (Summer) | Aug to Oct (Winter)",
    programName: "ADC Cairo Software Engineering Internship",
  },
  {
    name: "Amazon Egypt",
    slug: "amazon-egypt",
    sector: "Tech",
    careersUrl: "https://www.amazon.jobs/en/search?base_query=intern&country=EGY",
    scraperType: "html",
    typicalSeason: "Oct to Mar (Summer Intake)",
    programName: "Software Dev / Operations / Area Manager Intern",
  },
  {
    name: "Google Cairo",
    slug: "google-egypt",
    sector: "Tech",
    careersUrl: "https://www.google.com/about/careers/applications/jobs/results/?location=Egypt&q=Intern",
    scraperType: "html",
    typicalSeason: "Oct to Jan (STEP & SWE)",
    programName: "STEP & SWE Internships",
  },
  {
    name: "Instabug / Luciq",
    slug: "instabug",
    sector: "Tech",
    careersUrl: "https://apply.workable.com/instabug/",
    scraperType: "workable",
    typicalSeason: "Apr to Jun",
    programName: "Product, Backend, iOS/Android Summer Internships",
  },
  {
    name: "Paymob",
    slug: "paymob",
    sector: "Banking & Fintech",
    careersUrl: "https://apply.workable.com/paymob/",
    scraperType: "workable",
    typicalSeason: "May to Jul",
    programName: "Product, Engineering & Fintech Interns",
  },
  {
    name: "Breadfast",
    slug: "breadfast",
    sector: "Tech",
    careersUrl: "https://apply.workable.com/breadfast/",
    scraperType: "workable",
    typicalSeason: "Apr to Jul",
    programName: "Tech, Data & Supply Chain Internships",
  },
  {
    name: "Valeo Egypt",
    slug: "valeo-egypt",
    sector: "Engineering",
    careersUrl: "https://valeo.wd3.myworkdayjobs.com/en-US/valeo_careers?q=intern",
    scraperType: "workday",
    typicalSeason: "Apr to Jun (Valeo Academy)",
    programName: "Embedded & Automotive Software Trainee",
  },
  {
    name: "Siemens EDA Egypt",
    slug: "siemens-eda-egypt",
    sector: "Engineering",
    careersUrl: "https://jobs.siemens.com/careers?query=intern&location=Egypt",
    scraperType: "html",
    typicalSeason: "Mar to Jun",
    programName: "Siemens EDA Egypt Summer Training",
  },
  {
    name: "CIB Egypt",
    slug: "cib-egypt",
    sector: "Banking & Fintech",
    careersUrl: "https://www.cibeg.com/en/careers/students-and-graduates",
    scraperType: "html",
    typicalSeason: "Apr to Jun (SAS Program)",
    programName: "CIB Summer Internship (SAS)",
  },
  {
    name: "P&G Egypt",
    slug: "pg-egypt",
    sector: "FMCG",
    careersUrl: "https://www.pgcareers.com/global/en/search-results?keywords=intern&location=Egypt",
    scraperType: "workday",
    typicalSeason: "Sep to Nov | Feb to Apr",
    programName: "P&G CEO Challenge & Summer Intern",
  },
  {
    name: "Unilever Egypt",
    slug: "unilever-egypt",
    sector: "FMCG",
    careersUrl: "https://careers.unilever.com/search-jobs/intern/Egypt/",
    scraperType: "workday",
    typicalSeason: "Mar to May (ULIP)",
    programName: "ULIP (Unilever Leadership Internship Program)",
  },
  {
    name: "PwC Middle East Egypt",
    slug: "pwc-egypt",
    sector: "Consulting",
    careersUrl: "https://www.pwc.com/m1/en/careers/student-and-graduates.html",
    scraperType: "workday",
    typicalSeason: "Feb to May | Sep to Nov",
    programName: "PwC ETIC Tech & Advisory Intern",
  },
  {
    name: "McKinsey Cairo",
    slug: "mckinsey-cairo",
    sector: "Consulting",
    careersUrl: "https://www.mckinsey.com/careers/search-jobs?locations=Cairo&interest=Internships",
    scraperType: "html",
    typicalSeason: "Sep to Nov | Jan to Mar",
    programName: "Business Analyst Intern",
  },
  {
    name: "Elsewedy Electric",
    slug: "elsewedy-electric",
    sector: "Engineering",
    careersUrl: "https://elsewedyelectric.com/en/careers/",
    scraperType: "html",
    typicalSeason: "May to Jul (SIP Program)",
    programName: "Elsewedy Summer Internship Program (SIP)",
  },
  {
    name: "Wuzzuf Verified Internships",
    slug: "wuzzuf-internships",
    sector: "Tech",
    careersUrl: "https://wuzzuf.net/search/jobs/?filters%5Bcountry%5D%5B0%5D=Egypt&filters%5Bpost_type%5D%5B0%5D=Internship",
    scraperType: "html",
    typicalSeason: "Year round",
    programName: "Verified Egypt Internship Feed",
  },
];