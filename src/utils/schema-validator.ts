/**
 * P1.3: DATA CONTRACTS - SCHEMA VALIDATION
 *
 * Enforces schemas on OSINT data to prevent downstream corruption
 */

import { z } from "zod";

/**
 * GitHub Trending Repository Schema
 */
export const GitHubTrendingSchema = z.object({
  source: z.string().startsWith("github:"),
  repository: z.object({
    full_name: z.string().regex(/^[\w-]+\/[\w-]+$/),
    description: z.string().nullable(),
    stars: z.number().int().min(0),
    language: z.string().nullable(),
    url: z.string().url(),
    topics: z.array(z.string()).optional(),
  }),
  crawled_at: z.string().datetime(),
  metadata: z.record(z.any()).optional(),
});

export type GitHubTrending = z.infer<typeof GitHubTrendingSchema>;

/**
 * ArXiv Research Paper Schema
 */
export const ArXivPaperSchema = z.object({
  source: z.string().startsWith("arxiv:"),
  paper: z.object({
    id: z.string().regex(/^\d{4}\.\d{4,5}(v\d+)?$/),
    title: z.string().min(1),
    authors: z.array(z.string()).min(1),
    abstract: z.string().min(10),
    categories: z.array(z.string()).min(1),
    published: z.string().datetime(),
    updated: z.string().datetime().optional(),
    pdf_url: z.string().url(),
  }),
  crawled_at: z.string().datetime(),
  metadata: z.record(z.any()).optional(),
});

export type ArXivPaper = z.infer<typeof ArXivPaperSchema>;

/**
 * HackerNews Story Schema
 */
export const HackerNewsStorySchema = z.object({
  source: z.string().startsWith("hackernews:"),
  story: z.object({
    id: z.number().int().positive(),
    title: z.string().min(1),
    url: z.string().url().optional(),
    score: z.number().int().min(0),
    by: z.string(),
    time: z.number().int().positive(),
    descendants: z.number().int().min(0).optional(),
    type: z.enum(["story", "job", "poll"]),
  }),
  crawled_at: z.string().datetime(),
  metadata: z.record(z.any()).optional(),
});

export type HackerNewsStory = z.infer<typeof HackerNewsStorySchema>;

/**
 * Reddit Post Schema
 */
export const RedditPostSchema = z.object({
  source: z.string().startsWith("reddit:"),
  post: z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    subreddit: z.string().regex(/^[a-zA-Z0-9_]+$/),
    author: z.string(),
    score: z.number().int(),
    url: z.string().url(),
    permalink: z.string().startsWith("/r/"),
    created_utc: z.number().int().positive(),
    num_comments: z.number().int().min(0),
  }),
  crawled_at: z.string().datetime(),
  metadata: z.record(z.any()).optional(),
});

export type RedditPost = z.infer<typeof RedditPostSchema>;

/**
 * Validation result
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Array<{
    path: string[];
    message: string;
    code: string;
  }>;
}

/**
 * Validate data against a schema
 */
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  sourceName: string
): ValidationResult<T> {
  try {
    const validated = schema.parse(data);
    return {
      success: true,
      data: validated,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map((err) => ({
          path: err.path.map(String),
          message: err.message,
          code: err.code,
        })),
      };
    }

    return {
      success: false,
      errors: [
        {
          path: [],
          message: `Unknown validation error for ${sourceName}`,
          code: "UNKNOWN",
        },
      ],
    };
  }
}

/**
 * Validate OSINT document by source type
 */
export function validateOSINTDocument(doc: any): ValidationResult<any> {
  const source = doc.source || "";

  if (source.startsWith("github:")) {
    return validateSchema(GitHubTrendingSchema, doc, "GitHub Trending");
  } else if (source.startsWith("arxiv:")) {
    return validateSchema(ArXivPaperSchema, doc, "ArXiv Paper");
  } else if (source.startsWith("hackernews:")) {
    return validateSchema(HackerNewsStorySchema, doc, "HackerNews Story");
  } else if (source.startsWith("reddit:")) {
    return validateSchema(RedditPostSchema, doc, "Reddit Post");
  } else {
    return {
      success: false,
      errors: [
        {
          path: ["source"],
          message: `Unknown source type: ${source}`,
          code: "INVALID_SOURCE",
        },
      ],
    };
  }
}

/**
 * Validate Model Card against schema
 */
export function validateModelCard(card: any): ValidationResult<any> {
  // Load model-card-schema.json and validate
  // For now, basic structure validation
  const ModelCardSchema = z.object({
    model_id: z.string().regex(/^[a-z0-9-]+$/),
    provider: z.enum(["openai", "google", "anthropic", "microsoft", "groq"]),
    model_name: z.string(),
    version: z.string().regex(/^\d+\.\d+(\.\d+)?$/),
    context_window: z.object({
      tokens: z.number().int().min(0),
      effective_tokens: z.number().int().min(0),
    }),
    cost: z.object({
      input_per_1k: z.number().min(0),
      output_per_1k: z.number().min(0),
      currency: z.literal("USD"),
      free_tier: z.boolean().optional(),
    }),
    performance_score: z.number().min(0).max(100),
    safety_score: z.object({
      overall: z.number().min(0).max(100),
      last_updated: z.string().datetime(),
    }),
    audit_history: z.array(
      z.object({
        timestamp: z.string().datetime(),
        action: z.enum(["created", "updated", "deprecated", "usage_logged"]),
        user: z.string(),
        changes: z.record(z.any()).optional(),
        usage_count: z.number().int().optional(),
      })
    ),
  });

  return validateSchema(ModelCardSchema, card, "Model Card");
}
