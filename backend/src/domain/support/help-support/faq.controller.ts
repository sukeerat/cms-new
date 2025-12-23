import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FAQService } from './faq.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { CreateFAQDto, UpdateFAQDto } from './dto';
import { SupportCategory } from '@prisma/client';

@Controller('support/faq')
export class FAQController {
  constructor(private readonly faqService: FAQService) {}

  /**
   * Get all published FAQ articles
   * Access: Public (no auth required)
   */
  @Get()
  async getPublishedFAQs() {
    return this.faqService.getPublishedFAQs();
  }

  /**
   * Search FAQs
   * Access: Public
   */
  @Get('search')
  async searchFAQs(@Query('q') query: string) {
    return this.faqService.searchFAQs(query);
  }

  /**
   * Get categories with article counts
   * Access: Public
   */
  @Get('categories')
  async getCategories() {
    return this.faqService.getCategoriesWithCounts();
  }

  /**
   * Get popular FAQs
   * Access: Public
   */
  @Get('popular')
  async getPopularFAQs(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.faqService.getPopularFAQs(limitNum);
  }

  /**
   * Get FAQs by category
   * Access: Public
   */
  @Get('category/:category')
  async getFAQsByCategory(@Param('category') category: SupportCategory) {
    return this.faqService.getFAQsByCategory(category);
  }

  /**
   * Get all FAQ articles (including drafts) - Admin only
   * Access: STATE_DIRECTORATE only
   */
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STATE_DIRECTORATE')
  async getAllFAQs() {
    return this.faqService.getAllFAQs();
  }

  /**
   * Get FAQ by slug (public view)
   * Access: Public
   */
  @Get('slug/:slug')
  async getFAQBySlug(@Param('slug') slug: string) {
    return this.faqService.getFAQBySlug(slug);
  }

  /**
   * Mark FAQ as helpful
   * Access: Public
   */
  @Post(':id/helpful')
  async markHelpful(@Param('id') id: string) {
    return this.faqService.markHelpful(id);
  }

  /**
   * Create a new FAQ article
   * Access: STATE_DIRECTORATE only
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STATE_DIRECTORATE')
  async createFAQ(@Body() data: CreateFAQDto, @Request() req: any) {
    return this.faqService.createFAQ(req.user.userId, data);
  }

  /**
   * Get FAQ by ID (admin)
   * Access: STATE_DIRECTORATE only
   */
  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STATE_DIRECTORATE')
  async getFAQById(@Param('id') id: string) {
    return this.faqService.getFAQById(id);
  }

  /**
   * Update an FAQ article
   * Access: STATE_DIRECTORATE only
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STATE_DIRECTORATE')
  async updateFAQ(
    @Param('id') id: string,
    @Body() data: UpdateFAQDto,
    @Request() req: any,
  ) {
    return this.faqService.updateFAQ(id, req.user.userId, data);
  }

  /**
   * Delete an FAQ article
   * Access: STATE_DIRECTORATE only
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STATE_DIRECTORATE')
  async deleteFAQ(@Param('id') id: string) {
    return this.faqService.deleteFAQ(id);
  }
}
