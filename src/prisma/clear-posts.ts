import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Clear all posts data from database
 */
async function main() {
  console.log('🧹 Starting to clear posts data...');

  try {
    // Delete in order due to foreign key constraints
    console.log('🗑️  Deleting post shares...');
    const deletedShares = await prisma.resPostShare.deleteMany({});
    console.log(`   ✅ Deleted ${deletedShares.count} shares`);

    console.log('🗑️  Deleting post hashtags...');
    const deletedPostHashtags = await prisma.resPostHashtag.deleteMany({});
    console.log(`   ✅ Deleted ${deletedPostHashtags.count} post-hashtag links`);

    console.log('🗑️  Deleting comments...');
    const deletedComments = await prisma.resComment.deleteMany({});
    console.log(`   ✅ Deleted ${deletedComments.count} comments`);

    console.log('🗑️  Deleting post likes...');
    const deletedLikes = await prisma.resPostLike.deleteMany({});
    console.log(`   ✅ Deleted ${deletedLikes.count} likes`);

    console.log('🗑️  Deleting post media...');
    const deletedMedia = await prisma.resPostMedia.deleteMany({});
    console.log(`   ✅ Deleted ${deletedMedia.count} media items`);

    console.log('🗑️  Deleting posts...');
    const deletedPosts = await prisma.resPost.deleteMany({});
    console.log(`   ✅ Deleted ${deletedPosts.count} posts`);

    console.log('🗑️  Deleting hashtags...');
    const deletedHashtags = await prisma.resHashtag.deleteMany({});
    console.log(`   ✅ Deleted ${deletedHashtags.count} hashtags`);

    console.log('✨ All posts data cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing posts data:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Failed to clear posts data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
