/**
 * MongoDB Native FAQ Seed Script
 * Bypasses Prisma to avoid replica set transaction requirements
 * Imports data from seed-faqs.ts and uses MongoDB driver directly
 */
import { MongoClient, ObjectId } from 'mongodb';
import { SupportCategory } from '@prisma/client';
import { faqData, determineTargetRoles } from './seed-faqs';

// Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80)
    .trim();
}

async function main() {
  const mongoUrl =
    process.env.DATABASE_URL ||
    'mongodb://admin:Admin%401234@147.93.106.69:27017/cms_db?authSource=admin&directConnection=true';

  console.log('🌱 Starting MongoDB Native FAQ Seed...\n');
  console.log(`📊 Total FAQs to create: ${faqData.length}\n`);
  console.log('🔗 Connecting to MongoDB directly...\n');

  const client = new MongoClient(mongoUrl);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db('cms_db');
    const usersCollection = db.collection('User');
    const faqCollection = db.collection('faq_articles');

    // Find author
    const author = await usersCollection.findOne({ role: 'STATE_DIRECTORATE' });

    if (!author) {
      console.error('❌ No STATE_DIRECTORATE user found. Please create one first.');
      process.exit(1);
    }

    console.log(`📝 Using author: ${author.name} (${author.email})\n`);

    // Delete existing FAQs
    const deleteResult = await faqCollection.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing FAQ articles\n`);

    // Prepare FAQ documents
    const slugMap = new Map<string, number>();
    const faqDocuments: any[] = [];

    for (const faq of faqData) {
      let slug = generateSlug(faq.title);

      // Handle duplicate slugs
      if (slugMap.has(slug)) {
        const count = slugMap.get(slug)! + 1;
        slugMap.set(slug, count);
        slug = `${slug}-${count}`;
      } else {
        slugMap.set(slug, 1);
      }

      const targetRoles = determineTargetRoles(faq.title, faq.category);

      faqDocuments.push({
        _id: new ObjectId(),
        title: faq.title,
        content: faq.content,
        summary: faq.summary,
        category: faq.category,
        tags: faq.tags,
        targetRoles: targetRoles,
        slug: slug,
        isPublished: true,
        authorId: author._id,
        authorName: author.name || 'System',
        viewCount: Math.floor(Math.random() * 150) + 10,
        helpfulCount: Math.floor(Math.random() * 30) + 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Insert all FAQs in one batch
    const insertResult = await faqCollection.insertMany(faqDocuments);
    console.log(`✅ Inserted ${insertResult.insertedCount} FAQ articles\n`);

    // Display summary by category
    const categoryCount = new Map<string, number>();
    const roleCount = new Map<string, number>();

    for (const faq of faqDocuments) {
      categoryCount.set(faq.category, (categoryCount.get(faq.category) || 0) + 1);
      if (faq.targetRoles.length === 0) {
        roleCount.set('ALL', (roleCount.get('ALL') || 0) + 1);
      } else {
        for (const role of faq.targetRoles) {
          roleCount.set(role, (roleCount.get(role) || 0) + 1);
        }
      }
    }

    console.log('📊 FAQs by Category:');
    for (const [category, count] of categoryCount.entries()) {
      console.log(`   ${category}: ${count}`);
    }

    console.log('\n📊 FAQs by Target Role:');
    for (const [role, count] of roleCount.entries()) {
      console.log(`   ${role}: ${count}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 FAQ Seeding Complete!');
    console.log('='.repeat(50));
    console.log(`   ✅ Total Created: ${insertResult.insertedCount}`);
    console.log(`   📂 Collection: faq_articles`);
    console.log('='.repeat(50));
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

main();
