import { Injectable, NotFoundException, Logger, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { CacheService } from '../../../core/cache/cache.service';
import { SupportCategory } from '@prisma/client';
import { CreateFAQDto, UpdateFAQDto } from './dto';

@Injectable()
export class FAQService {
  private readonly logger = new Logger(FAQService.name);
  private readonly CACHE_TTL = 600; // 10 minutes (FAQs change less frequently)

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  /**
   * Generate URL-friendly slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  }

  /**
   * Ensure slug is unique by appending number if needed
   */
  private async ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.fAQArticle.findUnique({
        where: { slug },
      });

      if (!existing || (excludeId && existing.id === excludeId)) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  /**
   * Create a new FAQ article
   */
  async createFAQ(authorId: string, data: CreateFAQDto) {
    try {
      this.logger.log(`Creating FAQ article: ${data.title}`);

      const author = await this.prisma.user.findUnique({
        where: { id: authorId },
      });

      if (!author) {
        throw new NotFoundException('Author not found');
      }

      const baseSlug = this.generateSlug(data.title);
      const slug = await this.ensureUniqueSlug(baseSlug);

      const faq = await this.prisma.fAQArticle.create({
        data: {
          title: data.title,
          content: data.content,
          summary: data.summary,
          category: data.category,
          tags: data.tags || [],
          isPublished: data.isPublished || false,
          publishedAt: data.isPublished ? new Date() : null,
          publishedBy: data.isPublished ? authorId : null,
          authorId,
          authorName: author.name,
          slug,
          searchTerms: data.searchTerms || [],
          sortOrder: data.sortOrder || 0,
        },
      });

      // Invalidate cache
      await this.invalidateFAQCache();

      return faq;
    } catch (error) {
      this.logger.error(`Failed to create FAQ: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update an FAQ article
   */
  async updateFAQ(id: string, updaterId: string, data: UpdateFAQDto) {
    try {
      this.logger.log(`Updating FAQ article: ${id}`);

      const faq = await this.prisma.fAQArticle.findUnique({
        where: { id },
      });

      if (!faq) {
        throw new NotFoundException('FAQ article not found');
      }

      const updateData: any = { ...data };

      // If title is being updated, regenerate slug
      if (data.title && data.title !== faq.title) {
        const baseSlug = this.generateSlug(data.title);
        updateData.slug = await this.ensureUniqueSlug(baseSlug, id);
      }

      // Handle publish state change
      if (data.isPublished !== undefined && data.isPublished !== faq.isPublished) {
        if (data.isPublished) {
          updateData.publishedAt = new Date();
          updateData.publishedBy = updaterId;
        } else {
          updateData.publishedAt = null;
          updateData.publishedBy = null;
        }
      }

      const updated = await this.prisma.fAQArticle.update({
        where: { id },
        data: updateData,
      });

      // Invalidate cache
      await this.invalidateFAQCache();

      return updated;
    } catch (error) {
      this.logger.error(`Failed to update FAQ: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete an FAQ article
   */
  async deleteFAQ(id: string) {
    try {
      this.logger.log(`Deleting FAQ article: ${id}`);

      const faq = await this.prisma.fAQArticle.findUnique({
        where: { id },
      });

      if (!faq) {
        throw new NotFoundException('FAQ article not found');
      }

      await this.prisma.fAQArticle.delete({
        where: { id },
      });

      // Invalidate cache
      await this.invalidateFAQCache();

      return { success: true, message: 'FAQ article deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete FAQ: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get all published FAQ articles
   */
  async getPublishedFAQs() {
    try {
      const cacheKey = 'faqs:published';

      return await this.cache.getOrSet(
        cacheKey,
        async () => {
          return await this.prisma.fAQArticle.findMany({
            where: { isPublished: true },
            orderBy: [
              { sortOrder: 'asc' },
              { viewCount: 'desc' },
            ],
          });
        },
        this.CACHE_TTL,
      );
    } catch (error) {
      this.logger.error(`Failed to get published FAQs: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get all FAQ articles (including drafts) - for admin
   */
  async getAllFAQs() {
    try {
      return await this.prisma.fAQArticle.findMany({
        orderBy: [
          { category: 'asc' },
          { sortOrder: 'asc' },
          { createdAt: 'desc' },
        ],
      });
    } catch (error) {
      this.logger.error(`Failed to get all FAQs: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get FAQ by ID
   */
  async getFAQById(id: string) {
    try {
      const faq = await this.prisma.fAQArticle.findUnique({
        where: { id },
      });

      if (!faq) {
        throw new NotFoundException('FAQ article not found');
      }

      return faq;
    } catch (error) {
      this.logger.error(`Failed to get FAQ ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get FAQ by slug (for public view)
   */
  async getFAQBySlug(slug: string, incrementView: boolean = true) {
    try {
      const faq = await this.prisma.fAQArticle.findUnique({
        where: { slug },
      });

      if (!faq || !faq.isPublished) {
        throw new NotFoundException('FAQ article not found');
      }

      // Increment view count
      if (incrementView) {
        await this.prisma.fAQArticle.update({
          where: { id: faq.id },
          data: { viewCount: { increment: 1 } },
        });
      }

      return faq;
    } catch (error) {
      this.logger.error(`Failed to get FAQ by slug ${slug}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get FAQs by category
   */
  async getFAQsByCategory(category: SupportCategory) {
    try {
      const cacheKey = `faqs:category:${category}`;

      return await this.cache.getOrSet(
        cacheKey,
        async () => {
          return await this.prisma.fAQArticle.findMany({
            where: {
              category,
              isPublished: true,
            },
            orderBy: [
              { sortOrder: 'asc' },
              { viewCount: 'desc' },
            ],
          });
        },
        this.CACHE_TTL,
      );
    } catch (error) {
      this.logger.error(`Failed to get FAQs for category ${category}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Search FAQs
   */
  async searchFAQs(query: string) {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }

      const searchTerm = query.trim().toLowerCase();

      // MongoDB text search using contains
      const results = await this.prisma.fAQArticle.findMany({
        where: {
          isPublished: true,
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { content: { contains: searchTerm, mode: 'insensitive' } },
            { summary: { contains: searchTerm, mode: 'insensitive' } },
            { tags: { has: searchTerm } },
            { searchTerms: { has: searchTerm } },
          ],
        },
        orderBy: { viewCount: 'desc' },
        take: 20,
      });

      return results;
    } catch (error) {
      this.logger.error(`Failed to search FAQs: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get categories with article counts
   */
  async getCategoriesWithCounts() {
    try {
      const cacheKey = 'faqs:categories';

      return await this.cache.getOrSet(
        cacheKey,
        async () => {
          const categories = await Promise.all(
            Object.values(SupportCategory).map(async (category) => ({
              category,
              label: this.formatCategoryLabel(category),
              count: await this.prisma.fAQArticle.count({
                where: { category, isPublished: true },
              }),
            }))
          );

          return categories.filter(c => c.count > 0);
        },
        this.CACHE_TTL,
      );
    } catch (error) {
      this.logger.error(`Failed to get categories: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Mark FAQ as helpful
   */
  async markHelpful(id: string) {
    try {
      const faq = await this.prisma.fAQArticle.findUnique({
        where: { id },
      });

      if (!faq) {
        throw new NotFoundException('FAQ article not found');
      }

      const updated = await this.prisma.fAQArticle.update({
        where: { id },
        data: { helpfulCount: { increment: 1 } },
      });

      return updated;
    } catch (error) {
      this.logger.error(`Failed to mark FAQ helpful: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get popular FAQs
   */
  async getPopularFAQs(limit: number = 10) {
    try {
      return await this.prisma.fAQArticle.findMany({
        where: { isPublished: true },
        orderBy: { viewCount: 'desc' },
        take: limit,
      });
    } catch (error) {
      this.logger.error(`Failed to get popular FAQs: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Format category label for display
   */
  private formatCategoryLabel(category: SupportCategory): string {
    const labels: Record<SupportCategory, string> = {
      TECHNICAL_ISSUES: 'Technical Issues',
      ACCOUNT_PROFILE: 'Account & Profile',
      FEATURE_GUIDANCE: 'Feature Guidance',
      DATA_REPORTS: 'Data & Reports',
      INTERNSHIP_QUERIES: 'Internship Queries',
      GENERAL_INQUIRIES: 'General Inquiries',
    };
    return labels[category] || category;
  }

  /**
   * Helper to invalidate FAQ cache
   */
  private async invalidateFAQCache() {
    await this.cache.del('faqs:published');
    await this.cache.del('faqs:categories');
    // Invalidate all category caches
    for (const category of Object.values(SupportCategory)) {
      await this.cache.del(`faqs:category:${category}`);
    }
  }
}
