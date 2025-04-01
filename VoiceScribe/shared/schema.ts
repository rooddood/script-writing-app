import { pgTable, text, serial, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull().default("Untitled Document"),
  content: json("content").notNull().default({}),
  format: text("format").notNull().default("script"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

// Document content types
export interface ScriptElement {
  type: 'scene-heading' | 'action' | 'character' | 'parenthetical' | 'dialogue' | 'transition';
  content: string;
}

export interface DocumentContent {
  elements: ScriptElement[];
}

// Format types
export const documentFormats = [
  'script',
  'essay',
  'novel',
  'business-letter',
  'blog-post'
] as const;

export type DocumentFormat = typeof documentFormats[number];
