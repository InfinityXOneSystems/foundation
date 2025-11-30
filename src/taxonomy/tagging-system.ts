/**
 * Enterprise Tagging System
 * Supports semantic, hierarchical, domain-specific tags
 * 
 * @package taxonomy
 * @author JARVIS
 * @version 1.0.0
 */

import { EventEmitter } from "events";

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export type TagType = "semantic" | "hierarchical" | "domain" | "capability" | "compliance" | "operational";
export type TagScope = "global" | "provider" | "model" | "sop" | "incident";

/**
 * Tag definition
 */
export interface Tag {
  id: string;
  name: string;
  type: TagType;
  scope: TagScope;
  description: string;
  category: string;
  synonyms: string[];
  parent_tag_id?: string;
  child_tag_ids: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by: string;
  usage_count: number;
}

/**
 * Tag hierarchy
 */
export interface TagHierarchy {
  root_tags: string[];
  relationships: Map<string, string[]>;
  depth_map: Map<string, number>;
}

/**
 * Tagged resource
 */
export interface TaggedResource {
  resource_id: string;
  resource_type: string;
  tags: string[];
  tag_metadata: Record<string, Record<string, unknown>>;
  tagging_timestamp: string;
  tagged_by: string;
  confidence_scores: Record<string, number>;
}

/**
 * Tag search result
 */
export interface TagSearchResult {
  tag: Tag;
  relevance_score: number;
  related_tags: string[];
  resource_count: number;
}

// ============================================================
// TAGGING SYSTEM
// ============================================================

export class TaggingSystem extends EventEmitter {
  private tags: Map<string, Tag>;
  private hierarchy: TagHierarchy;
  private tagged_resources: Map<string, TaggedResource>;
  private tag_relationships: Map<string, Set<string>>;
  private audit_log: Array<{
    timestamp: string;
    action: string;
    tag_id: string;
    resource_id?: string;
    details: Record<string, unknown>;
    actor: string;
  }>;

  constructor() {
    super();
    this.tags = new Map();
    this.hierarchy = {
      root_tags: [],
      relationships: new Map(),
      depth_map: new Map(),
    };
    this.tagged_resources = new Map();
    this.tag_relationships = new Map();
    this.audit_log = [];

    this.initializePredefinedTags();
  }

  /**
   * Initialize predefined tags for enterprise systems
   */
  private initializePredefinedTags(): void {
    // Semantic tags
    const semanticTags = [
      {
        id: "semantic-reasoning",
        name: "Reasoning",
        description: "Models with advanced reasoning capabilities",
        category: "capability",
      },
      {
        id: "semantic-vision",
        name: "Vision",
        description: "Models with visual understanding capabilities",
        category: "capability",
      },
      {
        id: "semantic-audio",
        name: "Audio Processing",
        description: "Models with audio input/output capabilities",
        category: "capability",
      },
      {
        id: "semantic-code",
        name: "Code Generation",
        description: "Models specialized in code generation and understanding",
        category: "capability",
      },
    ];

    // Hierarchical tags - Provider hierarchy
    const providerHierarchy = [
      {
        id: "provider-openai",
        name: "OpenAI",
        description: "OpenAI provider hierarchy",
        category: "provider",
        children: ["provider-openai-gpt4", "provider-openai-gpt35"],
      },
      {
        id: "provider-anthropic",
        name: "Anthropic",
        description: "Anthropic provider hierarchy",
        category: "provider",
        children: ["provider-anthropic-claude3"],
      },
      {
        id: "provider-google",
        name: "Google",
        description: "Google provider hierarchy",
        category: "provider",
        children: ["provider-google-gemini2", "provider-google-gemini15"],
      },
      {
        id: "provider-groq",
        name: "Groq",
        description: "Groq provider hierarchy",
        category: "provider",
        children: ["provider-groq-mixtral"],
      },
    ];

    // Compliance tags
    const complianceTags = [
      {
        id: "compliance-gdpr",
        name: "GDPR Compliant",
        description: "GDPR compliance",
        category: "compliance",
      },
      {
        id: "compliance-hipaa",
        name: "HIPAA Compliant",
        description: "HIPAA compliance for healthcare",
        category: "compliance",
      },
      {
        id: "compliance-soc2",
        name: "SOC2 Type II",
        description: "SOC2 Type II certified",
        category: "compliance",
      },
      {
        id: "compliance-iso27001",
        name: "ISO 27001",
        description: "ISO 27001 certified",
        category: "compliance",
      },
    ];

    // Operational tags
    const operationalTags = [
      {
        id: "operational-high-latency",
        name: "High Latency",
        description: "High latency operations",
        category: "operational",
      },
      {
        id: "operational-batch-only",
        name: "Batch Only",
        description: "Batch processing only, not suitable for real-time",
        category: "operational",
      },
      {
        id: "operational-rate-limited",
        name: "Rate Limited",
        description: "Subject to rate limiting",
        category: "operational",
      },
      {
        id: "operational-beta",
        name: "Beta",
        description: "Beta release status",
        category: "operational",
      },
      {
        id: "operational-deprecated",
        name: "Deprecated",
        description: "Deprecated, migration recommended",
        category: "operational",
      },
    ];

    const allTags = [
      ...semanticTags.map((t) => ({
        ...t,
        type: "semantic" as TagType,
      })),
      ...providerHierarchy.map((t) => ({
        ...t,
        type: "hierarchical" as TagType,
      })),
      ...complianceTags.map((t) => ({
        ...t,
        type: "compliance" as TagType,
      })),
      ...operationalTags.map((t) => ({
        ...t,
        type: "operational" as TagType,
      })),
    ];

    for (const tagData of allTags) {
      this.createTag(
        tagData.id,
        tagData.name,
        tagData.type,
        "global",
        tagData.description,
        tagData.category,
        "system"
      );
    }

    // Set up hierarchical relationships
    for (const tag of providerHierarchy) {
      if (tag.children) {
        for (const childId of tag.children) {
          this.setTagRelationship(tag.id, childId);
        }
      }
    }
  }

  /**
   * Create a new tag
   */
  public createTag(
    id: string,
    name: string,
    type: TagType,
    scope: TagScope,
    description: string,
    category: string,
    creator: string,
    synonyms: string[] = [],
    parentTagId?: string
  ): Tag {
    if (this.tags.has(id)) {
      throw new Error(`Tag already exists: ${id}`);
    }

    const tag: Tag = {
      id,
      name,
      type,
      scope,
      description,
      category,
      synonyms,
      ...(parentTagId && { parent_tag_id: parentTagId }),
      child_tag_ids: [],
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: creator,
      usage_count: 0,
    };

    this.tags.set(id, tag);

    // Add to hierarchy if root tag
    if (!parentTagId) {
      this.hierarchy.root_tags.push(id);
      this.hierarchy.depth_map.set(id, 0);
    } else {
      // Set parent relationship
      const parentTag = this.tags.get(parentTagId);
      if (parentTag) {
        parentTag.child_tag_ids.push(id);
        const parentDepth = this.hierarchy.depth_map.get(parentTagId) || 0;
        this.hierarchy.depth_map.set(id, parentDepth + 1);
      }
    }

    this.audit_log.push({
      timestamp: new Date().toISOString(),
      action: "create_tag",
      tag_id: id,
      details: { name, type, scope },
      actor: creator,
    });

    this.emit("tag_created", tag);

    return tag;
  }

  /**
   * Set tag relationship (parent-child)
   */
  public setTagRelationship(parentId: string, childId: string): void {
    const parentTag = this.tags.get(parentId);
    const childTag = this.tags.get(childId);

    if (!parentTag || !childTag) {
      throw new Error("One or both tags not found");
    }

    if (!parentTag.child_tag_ids.includes(childId)) {
      parentTag.child_tag_ids.push(childId);
    }

    childTag.parent_tag_id = parentId;

    const parentDepth = this.hierarchy.depth_map.get(parentId) || 0;
    this.hierarchy.depth_map.set(childId, parentDepth + 1);

    if (!this.tag_relationships.has(parentId)) {
      this.tag_relationships.set(parentId, new Set());
    }
    this.tag_relationships.get(parentId)?.add(childId);

    this.emit("relationship_created", { parent: parentId, child: childId });
  }

  /**
   * Tag a resource
   */
  public tagResource(
    resourceId: string,
    resourceType: string,
    tagIds: string[],
    tagger: string,
    confidenceScores: Record<string, number> = {}
  ): TaggedResource {
    // Validate tags exist
    for (const tagId of tagIds) {
      if (!this.tags.has(tagId)) {
        throw new Error(`Tag not found: ${tagId}`);
      }
    }

    const key = `${resourceType}:${resourceId}`;
    const tagged: TaggedResource = {
      resource_id: resourceId,
      resource_type: resourceType,
      tags: tagIds,
      tag_metadata: {},
      tagging_timestamp: new Date().toISOString(),
      tagged_by: tagger,
      confidence_scores: confidenceScores,
    };

    this.tagged_resources.set(key, tagged);

    // Update tag usage counts
    for (const tagId of tagIds) {
      const tag = this.tags.get(tagId);
      if (tag) {
        tag.usage_count += 1;
      }
    }

    this.audit_log.push({
      timestamp: new Date().toISOString(),
      action: "tag_resource",
      tag_id: tagIds.join(","),
      resource_id: resourceId,
      details: { resource_type: resourceType, tag_count: tagIds.length },
      actor: tagger,
    });

    this.emit("resource_tagged", tagged);

    return tagged;
  }

  /**
   * Remove tags from resource
   */
  public untagResource(
    resourceId: string,
    resourceType: string,
    tagIds: string[],
    actor: string
  ): void {
    const key = `${resourceType}:${resourceId}`;
    const tagged = this.tagged_resources.get(key);

    if (!tagged) {
      throw new Error(`Tagged resource not found: ${key}`);
    }

    for (const tagId of tagIds) {
      const index = tagged.tags.indexOf(tagId);
      if (index !== -1) {
        tagged.tags.splice(index, 1);

        // Decrement usage count
        const tag = this.tags.get(tagId);
        if (tag && tag.usage_count > 0) {
          tag.usage_count -= 1;
        }
      }
    }

    this.audit_log.push({
      timestamp: new Date().toISOString(),
      action: "untag_resource",
      tag_id: tagIds.join(","),
      resource_id: resourceId,
      details: { resource_type: resourceType },
      actor,
    });

    this.emit("resource_untagged", { resourceId, resourceType, tagIds });
  }

  /**
   * Get resources by tag
   */
  public getResourcesByTag(tagId: string): TaggedResource[] {
    const results: TaggedResource[] = [];

    for (const tagged of this.tagged_resources.values()) {
      if (tagged.tags.includes(tagId)) {
        results.push(tagged);
      }
    }

    return results;
  }

  /**
   * Get tags for resource
   */
  public getResourceTags(resourceId: string, resourceType: string): Tag[] {
    const key = `${resourceType}:${resourceId}`;
    const tagged = this.tagged_resources.get(key);

    if (!tagged) {
      return [];
    }

    return tagged.tags.map((tagId) => this.tags.get(tagId)!).filter(Boolean);
  }

  /**
   * Search tags by name or synonym
   */
  public searchTags(query: string): TagSearchResult[] {
    const results: TagSearchResult[] = [];
    const queryLower = query.toLowerCase();

    for (const tag of this.tags.values()) {
      let relevance = 0;

      // Exact match
      if (tag.name.toLowerCase() === queryLower) {
        relevance = 1.0;
      } else if (tag.name.toLowerCase().includes(queryLower)) {
        relevance = 0.8;
      } else if (tag.synonyms.some((s) => s.toLowerCase().includes(queryLower))) {
        relevance = 0.6;
      } else if (tag.description.toLowerCase().includes(queryLower)) {
        relevance = 0.4;
      }

      if (relevance > 0) {
        const relatedTags = this.getRelatedTags(tag.id);
        results.push({
          tag,
          relevance_score: relevance,
          related_tags: relatedTags,
          resource_count: this.getResourcesByTag(tag.id).length,
        });
      }
    }

    return results.sort((a, b) => b.relevance_score - a.relevance_score);
  }

  /**
   * Get related tags
   */
  public getRelatedTags(tagId: string): string[] {
    const related = new Set<string>();
    const tag = this.tags.get(tagId);

    if (!tag) {
      return [];
    }

    // Add children
    for (const childId of tag.child_tag_ids) {
      related.add(childId);
    }

    // Add parent
    if (tag.parent_tag_id) {
      related.add(tag.parent_tag_id);
    }

    // Add siblings (children of parent)
    if (tag.parent_tag_id) {
      const parent = this.tags.get(tag.parent_tag_id);
      if (parent) {
        for (const siblingId of parent.child_tag_ids) {
          if (siblingId !== tagId) {
            related.add(siblingId);
          }
        }
      }
    }

    return Array.from(related);
  }

  /**
   * Get tag hierarchy
   */
  public getTagHierarchy(rootTagId?: string): Record<string, unknown> {
    const buildHierarchy = (tagId: string): Record<string, unknown> => {
      const tag = this.tags.get(tagId);
      if (!tag) return {};

      return {
        id: tag.id,
        name: tag.name,
        type: tag.type,
        category: tag.category,
        usage_count: tag.usage_count,
        children: tag.child_tag_ids.map((childId) => buildHierarchy(childId)),
      };
    };

    if (rootTagId) {
      return buildHierarchy(rootTagId);
    }

    return {
      roots: this.hierarchy.root_tags.map((rootId) => buildHierarchy(rootId)),
    };
  }

  /**
   * Get tag statistics
   */
  public getTagStatistics(): Record<string, unknown> {
    const stats = {
      total_tags: this.tags.size,
      tags_by_type: {} as Record<TagType, number>,
      tags_by_scope: {} as Record<TagScope, number>,
      tags_by_category: {} as Record<string, number>,
      most_used_tags: [] as Array<{
        tag_id: string;
        name: string;
        usage_count: number;
      }>,
      total_tagged_resources: this.tagged_resources.size,
      hierarchy_depth: Math.max(...Array.from(this.hierarchy.depth_map.values())),
    };

    for (const tag of this.tags.values()) {
      stats.tags_by_type[tag.type] = (stats.tags_by_type[tag.type] || 0) + 1;
      stats.tags_by_scope[tag.scope] = (stats.tags_by_scope[tag.scope] || 0) + 1;
      stats.tags_by_category[tag.category] = (stats.tags_by_category[tag.category] || 0) + 1;
    }

    const usedTags = Array.from(this.tags.values())
      .filter((t) => t.usage_count > 0)
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 10)
      .map((t) => ({
        tag_id: t.id,
        name: t.name,
        usage_count: t.usage_count,
      }));

    stats.most_used_tags = usedTags;

    return stats;
  }

  /**
   * Export all tags
   */
  public exportTags(): Tag[] {
    return Array.from(this.tags.values());
  }

  /**
   * Get audit log
   */
  public getAuditLog(): Array<{
    timestamp: string;
    action: string;
    tag_id: string;
    resource_id?: string;
    details: Record<string, unknown>;
    actor: string;
  }> {
    return [...this.audit_log];
  }

  /**
   * Validate tag consistency
   */
  public validateTags(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for circular references
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const hasCycle = (tagId: string): boolean => {
      if (visited.has(tagId)) return false;
      if (visiting.has(tagId)) return true;

      visiting.add(tagId);
      const tag = this.tags.get(tagId);

      if (tag?.parent_tag_id) {
        if (hasCycle(tag.parent_tag_id)) {
          return true;
        }
      }

      visiting.delete(tagId);
      visited.add(tagId);
      return false;
    };

    for (const tagId of this.tags.keys()) {
      if (hasCycle(tagId)) {
        errors.push(`Circular reference detected in tag: ${tagId}`);
      }
    }

    // Check for orphaned tags
    for (const tag of this.tags.values()) {
      if (tag.parent_tag_id && !this.tags.has(tag.parent_tag_id)) {
        errors.push(
          `Orphaned tag: ${tag.id} references non-existent parent ${tag.parent_tag_id}`
        );
      }

      for (const childId of tag.child_tag_ids) {
        if (!this.tags.has(childId)) {
          errors.push(
            `Tag ${tag.id} references non-existent child ${childId}`
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export default instance
export const taggingSystem = new TaggingSystem();
