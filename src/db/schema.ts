import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const companies = sqliteTable("companies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  sector: text("sector").notNull(), // "Tech", "Banking & Fintech", "FMCG", "Telecom", "Consulting", "Gov", "Engineering"
  careersUrl: text("careers_url").notNull(),
  scraperType: text("scraper_type").notNull(), // "workday", "greenhouse", "lever", "workable", "oracle", "html", "manual"
  typicalSeason: text("typical_season"), // e.g., "Summer: Mar-May | Winter: Oct-Nov"
  logoUrl: text("logo_url"),
  lastCheckedAt: integer("last_checked_at"), // timestamp in ms
});

export const internships = sqliteTable("internships", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  category: text("category").notNull(), // "Software & Data", "Finance", "Marketing", "Engineering", "Business"
  location: text("location").notNull(), // "Cairo", "Giza", "Alexandria", "Remote", "Hybrid"
  applicationUrl: text("application_url").unique().notNull(),
  status: text("status").notNull(), // "open", "upcoming", "closed", "pending_review"
  source: text("source").notNull(), // "scraper", "community", "admin", "dork"
  sourceType: text("source_type").default("portal"), // "portal", "linkedin_post", "google_form", "tiktok", "instagram"
  submittedBy: text("submitted_by"), // e.g. "@tibo_swe"
  postedAt: integer("posted_at"), // timestamp in ms
  expiresAt: integer("expires_at"), // timestamp in ms (nullable)
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
});

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;

export type Internship = typeof internships.$inferSelect;
export type NewInternship = typeof internships.$inferInsert;

export type InternshipWithCompany = Internship & {
  company: Company;
};
