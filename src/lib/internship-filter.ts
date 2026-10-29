// src/lib/internship-filter.ts

// 1. MUST match at least one of these terms (English or Arabic)
const POSITIVE_INTERNSHIP_REGEX =
  /\b(intern|internship|interns|trainee|trainees|graduate|student training|student program|student|summer training|winter training|undergraduate|co-op|industrial placement|vodanation|rowad|summer academy|discover program|تدريب صيفي|متدرب|تدريب جامعي|تدريب)\b/i;

// 2. MUST NOT match any of these terms (blocks Junior/Full-time pollution)
const NEGATIVE_ROLE_REGEX =
  /\b(junior|jr\.|sr\.|senior|mid-level|lead|director|head of|specialist|supervisor|full-time|full time|1-3 years|2\+ years|3\+ years|experienced)\b/i;

// Comprehensive Egyptian locations and tech hub names
const EGYPT_LOCATIONS_REGEX =
  /\b(egypt|cairo|giza|alexandria|alex|new cairo|maadi|october|6th of october|smart village|nasr city|zayed|sheikh zayed|dokki|heliopolis|tagamoa|shorouk|obour|mansoura|assiut|tanta|ismailia|suez|port said|el gouna|remote|hybrid|مصر|القاهرة|الجيزة|الإسكندرية)\b/i;

export function isStrictEgyptInternship(
  title: string,
  location: string,
  postedAt?: Date | number | null,
  isExperienceFilteredInternship?: boolean
): boolean {
  const cleanTitle = title.trim();
  const cleanLocation = location.trim();

  // Dynamic Date context
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0 = Jan, 8 = Sep

  // Rule 1: Block Past Years (e.g. 2024, 2025 when current year is 2026)
  const yearMatches = cleanTitle.match(/\b(20\d{2})\b/g);
  if (yearMatches) {
    for (const yearStr of yearMatches) {
      const year = parseInt(yearStr, 10);
      if (year < currentYear) {
        return false;
      }
    }
  }

  // Rule 2: Block Expired Seasons in Current Year
  // If current month >= September (month index >= 8), Summer & Spring of currentYear are expired
  if (currentMonth >= 8) {
    const expiredSeasonRegex = new RegExp(
      `\\b(summer|spring)\\s*${currentYear}\\b|\\b${currentYear}\\s*(summer|spring)\\b`,
      "i"
    );
    if (expiredSeasonRegex.test(cleanTitle)) {
      return false;
    }
  }

  // Rule 3: Block Stale Postings (older than 45 days)
  if (postedAt !== undefined && postedAt !== null) {
    const postedMs =
      postedAt instanceof Date ? postedAt.getTime() : typeof postedAt === "number" ? postedAt : null;
    if (postedMs && !isNaN(postedMs)) {
      const FORTY_FIVE_DAYS_MS = 45 * 24 * 60 * 60 * 1000;
      if (Date.now() - postedMs > FORTY_FIVE_DAYS_MS) {
        return false;
      }
    }
  }

  // Rule 4: Disqualify immediately if it contains "Junior", "Full-time", "Senior", etc.
  const hasHardNegative = NEGATIVE_ROLE_REGEX.test(cleanTitle);
  if (hasHardNegative) {
    return false;
  }

  // Rule 5: Location must be in Egypt or Remote/Hybrid
  const isEgypt =
    cleanLocation === "" ||
    cleanLocation.toLowerCase().includes("egypt") ||
    EGYPT_LOCATIONS_REGEX.test(cleanLocation);

  if (!isEgypt) {
    return false;
  }

  // Rule 6: Check positive internship match
  // If source already has LinkedIn native internship filter (f_E=1), relax positive requirement
  if (isExperienceFilteredInternship) {
    return true;
  }

  return POSITIVE_INTERNSHIP_REGEX.test(cleanTitle);
}