// src/lib/internship-filter.ts

// 1. Explicit internship indicators (English & Arabic)
export const EXPLICIT_INTERNSHIP_REGEX =
  /\b(intern|internship|interns|trainee|trainees|summer training|winter training|undergraduate|co-op|industrial placement|vodanation|rowad|summer academy|discover program|تدريب صيفي|متدرب|تدريب جامعي|تدريب)\b/i;

// 2. Strict Seniority prefixes that disqualify ANY role, even if it explicitly says "intern"
export const SENIORITY_PREFIX_REGEX =
  /\b(junior|jr\.?|senior|sr\.?|mid-level|lead|principal|director|head of|supervisor)\b/i;

// 3. Broader role keywords that disqualify a role ONLY IF it lacks explicit internship keywords
// (i.e. we do NOT reject "Talent Acquisition Specialist Intern" or "Full-Time Intern")
export const GENERAL_NEGATIVE_REGEX =
  /\b(specialist|manager|associate|full-time|full time|1-3 years|2\+ years|3\+ years|experienced)\b/i;

// 4. Positive indicators (includes broader terms like 'student', 'graduate')
export const POSITIVE_INTERNSHIP_REGEX =
  /\b(intern|internship|interns|trainee|trainees|graduate|student training|student program|student|summer training|winter training|undergraduate|co-op|industrial placement|vodanation|rowad|summer academy|discover program|تدريب صيفي|متدرب|تدريب جامعي|تدريب)\b/i;

// 5. Comprehensive Egyptian locations and tech hub names
export const EGYPT_LOCATIONS_REGEX =
  /\b(egypt|cairo|giza|alexandria|alex|new cairo|maadi|october|6th of october|smart village|nasr city|zayed|sheikh zayed|dokki|heliopolis|tagamoa|shorouk|obour|mansoura|assiut|tanta|ismailia|suez|port said|el gouna|remote|hybrid|مصر|القاهرة|الجيزة|الإسكندرية)\b/i;

export interface FilterResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validates whether a candidate role is a genuine, unexpired Egyptian internship.
 * Returns detailed diagnostic reason when rejected.
 */
export function checkStrictEgyptInternship(
  title: string,
  location: string,
  postedAt?: Date | number | null,
  isExperienceFilteredInternship?: boolean
): FilterResult {
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
        return { valid: false, reason: `Year ${year} is in the past (< ${currentYear})` };
      }
    }
  }

  // Rule 2: Block Expired Seasons in Current Year
  if (currentMonth >= 8) {
    const expiredSeasonRegex = new RegExp(
      `\\b(summer|spring)\\s*${currentYear}\\b|\\b${currentYear}\\s*(summer|spring)\\b`,
      "i"
    );
    if (expiredSeasonRegex.test(cleanTitle)) {
      return { valid: false, reason: `Summer/Spring ${currentYear} has already passed` };
    }
  }

  // Rule 3: Block Stale Postings (older than 45 days)
  if (postedAt !== undefined && postedAt !== null) {
    const postedMs =
      postedAt instanceof Date ? postedAt.getTime() : typeof postedAt === "number" ? postedAt : null;
    if (postedMs && !isNaN(postedMs)) {
      const FORTY_FIVE_DAYS_MS = 45 * 24 * 60 * 60 * 1000;
      if (Date.now() - postedMs > FORTY_FIVE_DAYS_MS) {
        const daysAgo = Math.round((Date.now() - postedMs) / (24 * 60 * 60 * 1000));
        return { valid: false, reason: `Posting is ${daysAgo} days old (exceeds 45-day limit)` };
      }
    }
  }

  // Rule 4: Seniority & Negative Role Check
  // Spec: If title explicitly contains (intern|internship|trainee|vodanation|rowad|تدريب|متدرب),
  // ONLY reject if it contains seniority prefixes (junior|jr|senior|sr|mid-level|lead|principal|director|head of|supervisor).
  // Do NOT reject an explicit "Intern" title just because it contains "Specialist", "Manager", "Associate", or "Full-time".
  const hasExplicitIntern = EXPLICIT_INTERNSHIP_REGEX.test(cleanTitle);

  if (hasExplicitIntern) {
    const seniorityMatch = cleanTitle.match(SENIORITY_PREFIX_REGEX);
    if (seniorityMatch) {
      return {
        valid: false,
        reason: `Explicit intern title contains disqualifying seniority prefix: '${seniorityMatch[0]}'`,
      };
    }
  } else {
    // If NOT explicitly matching intern/trainee, check both seniority and general negative keywords
    const seniorityMatch = cleanTitle.match(SENIORITY_PREFIX_REGEX);
    if (seniorityMatch) {
      return {
        valid: false,
        reason: `Title contains seniority keyword: '${seniorityMatch[0]}'`,
      };
    }
    const generalNegativeMatch = cleanTitle.match(GENERAL_NEGATIVE_REGEX);
    if (generalNegativeMatch) {
      return {
        valid: false,
        reason: `Title contains non-intern role indicator: '${generalNegativeMatch[0]}'`,
      };
    }
  }

  // Rule 5: Location must be in Egypt or Remote/Hybrid
  const isEgypt =
    cleanLocation === "" ||
    cleanLocation.toLowerCase().includes("egypt") ||
    EGYPT_LOCATIONS_REGEX.test(cleanLocation);

  if (!isEgypt) {
    return { valid: false, reason: `Location '${cleanLocation}' is outside Egypt` };
  }

  // Rule 6: Positive Match Check
  if (isExperienceFilteredInternship) {
    return { valid: true };
  }

  if (!POSITIVE_INTERNSHIP_REGEX.test(cleanTitle)) {
    return { valid: false, reason: "Title does not contain recognized internship or trainee keywords" };
  }

  return { valid: true };
}

export function isStrictEgyptInternship(
  title: string,
  location: string,
  postedAt?: Date | number | null,
  isExperienceFilteredInternship?: boolean
): boolean {
  return checkStrictEgyptInternship(title, location, postedAt, isExperienceFilteredInternship).valid;
}