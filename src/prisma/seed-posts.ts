import { PrismaClient, PostPrivacy, PostReaction } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Mock users data for posts
 */
const mockPostUsers = [
  {
    nickname: 'Craig Curtis',
    avatar: 'https://i.pravatar.cc/300?u=craig_curtis',
  },
  {
    nickname: 'Sarah Johnson',
    avatar: 'https://i.pravatar.cc/300?u=sarah_johnson',
  },
  {
    nickname: 'Michael Chen',
    avatar: 'https://i.pravatar.cc/300?u=michael_chen',
  },
  {
    nickname: 'Emma Rodriguez',
    avatar: 'https://i.pravatar.cc/300?u=emma_rodriguez',
  },
  {
    nickname: 'David Park',
    avatar: 'https://i.pravatar.cc/300?u=david_park',
  },
  {
    nickname: 'Lisa Anderson',
    avatar: 'https://i.pravatar.cc/300?u=lisa_anderson',
  },
  {
    nickname: 'James Wilson',
    avatar: 'https://i.pravatar.cc/300?u=james_wilson',
  },
  {
    nickname: 'Sophie Martin',
    avatar: 'https://i.pravatar.cc/300?u=sophie_martin',
  },
  {
    nickname: 'Alex Thompson',
    avatar: 'https://i.pravatar.cc/300?u=alex_thompson',
  },
  {
    nickname: 'Nina Patel',
    avatar: 'https://i.pravatar.cc/300?u=nina_patel',
  },
];

/**
 * Mock posts data
 */
const mockPostsData = [
  // Post 1: Home decor with single image
  {
    content:
      "When it comes to home decor, the details make all the difference! ✨ Just finished renovating my living room and I couldn't be happier with how it turned out. The key is mixing modern pieces with vintage finds. #homedecor #interior",
    hashtags: ['homedecor', 'interior', 'renovation'],
    media: [
      {
        media_url: 'https://picsum.photos/1080/1080?random=1',
        thumbnail_url: 'https://picsum.photos/400/400?random=1',
        media_type: 'image',
        width: 1080,
        height: 1080,
        order: 0,
      },
    ],
    likeCount: 245,
    commentCount: 13,
    shareCount: 5,
    privacy: PostPrivacy.public,
    location: 'San Francisco, CA',
    hoursAgo: 2,
  },

  // Post 2: Travel post with multiple images
  {
    content:
      "Absolutely breathtaking sunset at Santorini! 🌅 This place never fails to amaze me. If you haven't been here yet, add it to your bucket list! #travel #santorini #greece #sunset",
    hashtags: ['travel', 'santorini', 'greece', 'sunset', 'bucketlist'],
    media: [
      {
        media_url: 'https://picsum.photos/1080/1350?random=2',
        thumbnail_url: 'https://picsum.photos/400/500?random=2',
        media_type: 'image',
        width: 1080,
        height: 1350,
        order: 0,
      },
      {
        media_url: 'https://picsum.photos/1080/1080?random=3',
        thumbnail_url: 'https://picsum.photos/400/400?random=3',
        media_type: 'image',
        width: 1080,
        height: 1080,
        order: 1,
      },
      {
        media_url: 'https://picsum.photos/1080/1350?random=4',
        thumbnail_url: 'https://picsum.photos/400/500?random=4',
        media_type: 'image',
        width: 1080,
        height: 1350,
        order: 2,
      },
    ],
    likeCount: 1823,
    commentCount: 156,
    shareCount: 89,
    privacy: PostPrivacy.public,
    location: 'Santorini, Greece',
    hoursAgo: 5,
  },

  // Post 3: Food post with video
  {
    content:
      'Trying out a new recipe today! 🍝 Homemade pasta with creamy truffle sauce. The secret is fresh ingredients and patience. Recipe link in my bio! #cooking #pasta #foodie #homemade',
    hashtags: ['cooking', 'pasta', 'foodie', 'homemade', 'recipe'],
    media: [
      {
        media_url:
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnail_url: 'https://picsum.photos/1080/1920?random=5',
        media_type: 'video',
        width: 1080,
        height: 1920,
        order: 0,
      },
    ],
    likeCount: 892,
    commentCount: 67,
    shareCount: 34,
    privacy: PostPrivacy.public,
    hoursAgo: 8,
  },

  // Post 4: Fashion post
  {
    content:
      "OOTD: Casual Friday vibes! 👗 Loving this new summer collection. Can't wait for warmer days! What's your go-to casual outfit? #fashion #ootd #style #summervibes",
    hashtags: ['fashion', 'ootd', 'style', 'summervibes'],
    media: [
      {
        media_url: 'https://picsum.photos/1080/1350?random=6',
        thumbnail_url: 'https://picsum.photos/400/500?random=6',
        media_type: 'image',
        width: 1080,
        height: 1350,
        order: 0,
      },
    ],
    likeCount: 567,
    commentCount: 34,
    shareCount: 12,
    privacy: PostPrivacy.public,
    location: 'New York, NY',
    hoursAgo: 12,
  },

  // Post 5: Tech review
  {
    content:
      'Just got my hands on the latest flagship phone! 📱 First impressions: the camera is INSANE! Will do a full review soon. What do you want to know about it? #tech #smartphone #review #Sayhi2025',
    hashtags: ['tech', 'smartphone', 'review', 'Sayhi2025'],
    media: [
      {
        media_url: 'https://picsum.photos/1080/1080?random=7',
        thumbnail_url: 'https://picsum.photos/400/400?random=7',
        media_type: 'image',
        width: 1080,
        height: 1080,
        order: 0,
      },
      {
        media_url: 'https://picsum.photos/1080/1080?random=8',
        thumbnail_url: 'https://picsum.photos/400/400?random=8',
        media_type: 'image',
        width: 1080,
        height: 1080,
        order: 1,
      },
    ],
    likeCount: 1234,
    commentCount: 189,
    shareCount: 56,
    privacy: PostPrivacy.public,
    hoursAgo: 15,
  },

  // Post 6: Fitness post
  {
    content:
      "Leg day is the best day! 💪 Remember, consistency is key. You don't have to be great to start, but you have to start to be great! #fitness #workout #motivation #legday",
    hashtags: ['fitness', 'workout', 'motivation', 'legday'],
    media: [
      {
        media_url:
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        thumbnail_url: 'https://picsum.photos/1080/1920?random=9',
        media_type: 'video',
        width: 1080,
        height: 1920,
        order: 0,
      },
    ],
    likeCount: 678,
    commentCount: 45,
    shareCount: 23,
    privacy: PostPrivacy.friends,
    hoursAgo: 18,
  },

  // Post 7: Photography
  {
    content:
      'Golden hour magic ✨📸 The best lighting happens in the first and last hour of sunlight. Nature is the best photography studio! #photography #goldenhour #nature #landscape',
    hashtags: ['photography', 'goldenhour', 'nature', 'landscape'],
    media: [
      {
        media_url: 'https://picsum.photos/1350/1080?random=10',
        thumbnail_url: 'https://picsum.photos/500/400?random=10',
        media_type: 'image',
        width: 1350,
        height: 1080,
        order: 0,
      },
    ],
    likeCount: 2341,
    commentCount: 234,
    shareCount: 145,
    privacy: PostPrivacy.public,
    location: 'Yosemite National Park',
    hoursAgo: 24,
  },

  // Post 8: Book review
  {
    content:
      "Just finished this amazing book! 📚 Couldn't put it down. The plot twists were incredible! Currently having my morning coffee and reflecting on the ending. What are you reading? #books #reading #bookstagram #coffee",
    hashtags: ['books', 'reading', 'bookstagram', 'coffee'],
    media: [
      {
        media_url: 'https://picsum.photos/1080/1350?random=11',
        thumbnail_url: 'https://picsum.photos/400/500?random=11',
        media_type: 'image',
        width: 1080,
        height: 1350,
        order: 0,
      },
    ],
    likeCount: 456,
    commentCount: 78,
    shareCount: 19,
    privacy: PostPrivacy.public,
    hoursAgo: 27, // 1 day 3 hours
  },

  // Post 9: Music festival
  {
    content:
      "What a night! 🎵🔥 The energy at the festival was absolutely insane! Can't wait for the next one. Who else was there? #music #festival #dj #edm #Sayhi2025",
    hashtags: ['music', 'festival', 'dj', 'edm', 'Sayhi2025'],
    media: [
      {
        media_url: 'https://picsum.photos/1080/1080?random=12',
        thumbnail_url: 'https://picsum.photos/400/400?random=12',
        media_type: 'image',
        width: 1080,
        height: 1080,
        order: 0,
      },
      {
        media_url:
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        thumbnail_url: 'https://picsum.photos/1080/1920?random=13',
        media_type: 'video',
        width: 1080,
        height: 1920,
        order: 1,
      },
    ],
    likeCount: 3456,
    commentCount: 567,
    shareCount: 234,
    privacy: PostPrivacy.public,
    location: 'Coachella Valley',
    hoursAgo: 36, // 1 day 12 hours
  },

  // Post 10: Yoga/wellness
  {
    content:
      "Start your day with intention 🧘‍♀️ Morning yoga session by the beach. There's something magical about practicing with the sound of waves. #yoga #wellness #mindfulness #beachyoga #meditation",
    hashtags: ['yoga', 'wellness', 'mindfulness', 'beachyoga', 'meditation'],
    media: [
      {
        media_url: 'https://picsum.photos/1350/1080?random=14',
        thumbnail_url: 'https://picsum.photos/500/400?random=14',
        media_type: 'image',
        width: 1350,
        height: 1080,
        order: 0,
      },
    ],
    likeCount: 891,
    commentCount: 92,
    shareCount: 45,
    privacy: PostPrivacy.public,
    location: 'Bali, Indonesia',
    hoursAgo: 48, // 2 days
  },

  // Post 11: Podcast/Audio post
  {
    content:
      "New podcast episode is live! 🎙️ In this episode, we discuss the future of AI and how it's changing our daily lives. Would love to hear your thoughts! #podcast #AI #tech #Giaoluamnhac",
    hashtags: ['podcast', 'AI', 'tech', 'Giaoluamnhac'],
    media: [
      {
        media_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        media_type: 'audio',
        order: 0,
      },
    ],
    likeCount: 456,
    commentCount: 89,
    shareCount: 34,
    privacy: PostPrivacy.public,
    hoursAgo: 54, // 2 days 6 hours
  },

  // Post 12: Music/Audio post
  {
    content:
      'Just finished my first music composition! 🎵 This track took me weeks to perfect. Hope you enjoy it as much as I enjoyed making it. #music #composer #originalsong #Podcastdem',
    hashtags: ['music', 'composer', 'originalsong', 'Podcastdem'],
    media: [
      {
        media_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        media_type: 'audio',
        order: 0,
      },
    ],
    likeCount: 892,
    commentCount: 123,
    shareCount: 67,
    privacy: PostPrivacy.public,
    hoursAgo: 66, // 2 days 18 hours
  },

  // Post 13: Mixed media (image + audio)
  {
    content:
      'Recorded this beautiful sound of nature during my morning walk 🌿🎧 The birds were singing so beautifully today! #nature #sounds #peaceful #meditation',
    hashtags: ['nature', 'sounds', 'peaceful', 'meditation'],
    media: [
      {
        media_url: 'https://picsum.photos/1080/1350?random=15',
        thumbnail_url: 'https://picsum.photos/400/500?random=15',
        media_type: 'image',
        width: 1080,
        height: 1350,
        order: 0,
      },
      {
        media_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        media_type: 'audio',
        order: 1,
      },
    ],
    likeCount: 334,
    commentCount: 45,
    shareCount: 23,
    privacy: PostPrivacy.public,
    hoursAgo: 72, // 3 days
  },
];

/**
 * Generate additional posts for pagination testing
 */
function generateAdditionalPosts(count: number) {
  const additionalPosts = [];
  for (let i = 0; i < count; i++) {
    const index = i + 13;
    additionalPosts.push({
      content: `This is post number ${index}! Just sharing some thoughts and moments from my day. Life is beautiful when you take time to appreciate the little things. What made you smile today? #dailypost #life #grateful`,
      hashtags: ['dailypost', 'life', 'grateful'],
      media: [
        {
          media_url: `https://picsum.photos/1080/1080?random=${index + 100}`,
          thumbnail_url: `https://picsum.photos/400/400?random=${index + 100}`,
          media_type: 'image',
          width: 1080,
          height: 1080,
          order: 0,
        },
      ],
      likeCount: (index * 23) % 500,
      commentCount: (index * 5) % 50,
      shareCount: (index * 2) % 20,
      privacy: PostPrivacy.public,
      hoursAgo: 48 + Math.floor(i / 3) * 24 + (i % 24), // Spread over multiple days
    });
  }
  return additionalPosts;
}

/**
 * Mock hot topics data
 */
const mockHotTopics = [
  {
    name: 'Sayhi2025',
    post_count: 120000,
    cover_image: 'https://picsum.photos/600/600?random=501',
  },
  {
    name: 'TravelTuesday',
    post_count: 89500,
    cover_image: 'https://picsum.photos/600/600?random=502',
  },
  {
    name: 'FoodieFriday',
    post_count: 76300,
    cover_image: 'https://picsum.photos/600/600?random=503',
  },
  {
    name: 'FitnessMotivation',
    post_count: 65400,
    cover_image: 'https://picsum.photos/600/600?random=504',
  },
  {
    name: 'TechTrends',
    post_count: 54200,
    cover_image: 'https://picsum.photos/600/600?random=505',
  },
  { name: 'OOTD', post_count: 45900, cover_image: 'https://picsum.photos/600/600?random=506' },
  {
    name: 'Photography',
    post_count: 39800,
    cover_image: 'https://picsum.photos/600/600?random=507',
  },
  { name: 'Wellness', post_count: 34600, cover_image: 'https://picsum.photos/600/600?random=508' },
];

async function main() {
  console.log('🌱 Starting Posts seed...');

  // 0. Option to clear existing posts data
  const shouldClearData = process.argv.includes('--clear');
  if (shouldClearData) {
    console.log('🧹 Clearing existing posts data...');
    try {
      await prisma.resPostShare.deleteMany({});
      await prisma.resPostHashtag.deleteMany({});
      await prisma.resComment.deleteMany({});
      await prisma.resPostLike.deleteMany({});
      await prisma.resPostMedia.deleteMany({});
      await prisma.resPost.deleteMany({});
      await prisma.resHashtag.deleteMany({});
      console.log('✅ Cleared all existing posts data');
    } catch (error) {
      console.error('⚠️  Warning: Could not clear some data:', error);
    }
  }

  // 1. Get or create users for posts
  console.log('👥 Getting/Creating users for posts...');
  const existingUsers = await prisma.resUser.findMany({ take: 10 });
  const users = [];

  // Use existing users if available, otherwise create new ones
  for (let i = 0; i < Math.max(mockPostUsers.length, 10); i++) {
    if (i < existingUsers.length) {
      users.push(existingUsers[i]);
    } else {
      const mockUser = mockPostUsers[i % mockPostUsers.length];
      const newUser = await prisma.resUser.create({
        data: {
          union_id: `seed_user_${i}`,
          nickname: mockUser.nickname,
          avatar: mockUser.avatar,
          role: 'user',
          is_blocked: false,
          is_deleted: false,
        },
      });
      users.push(newUser);
    }
  }

  console.log(`✅ Using ${users.length} users for posts`);

  // 2. Create or get hashtags
  console.log('🏷️  Creating hashtags...');
  const allHashtags = new Set<string>();
  [...mockPostsData, ...generateAdditionalPosts(15)].forEach((post) => {
    post.hashtags.forEach((tag) => allHashtags.add(tag));
  });
  mockHotTopics.forEach((topic) => allHashtags.add(topic.name));

  const hashtagMap = new Map<string, string>();

  for (const tagName of allHashtags) {
    const existing = await prisma.resHashtag.findUnique({
      where: { name: tagName },
    });

    if (existing) {
      hashtagMap.set(tagName, existing.id);
    } else {
      const hotTopic = mockHotTopics.find((t) => t.name === tagName);
      const newHashtag = await prisma.resHashtag.create({
        data: {
          name: tagName,
          post_count: hotTopic?.post_count || 0,
          view_count: Math.floor(Math.random() * 10000),
          cover_image: hotTopic?.cover_image || null,
        },
      });
      hashtagMap.set(tagName, newHashtag.id);
    }
  }

  console.log(`✅ Created/Found ${hashtagMap.size} hashtags`);

  // 3. Create posts
  console.log('📝 Creating posts...');
  const allPosts = [...mockPostsData, ...generateAdditionalPosts(15)];
  const createdPosts = [];

  for (let i = 0; i < allPosts.length; i++) {
    const postData = allPosts[i];
    const user = users[i % users.length];
    const createdAt = new Date(Date.now() - postData.hoursAgo * 60 * 60 * 1000);

    // Create post
    const post = await prisma.resPost.create({
      data: {
        user_id: user.id,
        content: postData.content,
        privacy: postData.privacy,
        share_count: postData.shareCount,
        created_at: createdAt,
        updated_at: createdAt,
      },
    });

    // Create media
    if (postData.media && postData.media.length > 0) {
      await Promise.all(
        postData.media.map((media) =>
          prisma.resPostMedia.create({
            data: {
              post_id: post.id,
              media_url: media.media_url,
              thumbnail_url: media.thumbnail_url || null,
              media_type: media.media_type,
              width: media.width || null,
              height: media.height || null,
              order: media.order,
            },
          }),
        ),
      );
    }

    // Create hashtag links
    if (postData.hashtags && postData.hashtags.length > 0) {
      await Promise.all(
        postData.hashtags.map((tagName) => {
          const hashtagId = hashtagMap.get(tagName);
          if (hashtagId) {
            return prisma.resPostHashtag.create({
              data: {
                post_id: post.id,
                hashtag_id: hashtagId,
              },
            });
          }
        }),
      );
    }

    // Create likes (random users)
    const likeCount = Math.min(postData.likeCount, users.length - 1);
    const likedUserIds = new Set<string>();
    for (let j = 0; j < likeCount; j++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      if (randomUser.id !== user.id && !likedUserIds.has(randomUser.id)) {
        likedUserIds.add(randomUser.id);
        await prisma.resPostLike.create({
          data: {
            post_id: post.id,
            user_id: randomUser.id,
            reaction: PostReaction.like,
          },
        });
      }
    }

    // Create comments (random users)
    const commentCount = Math.min(postData.commentCount, users.length * 2);
    for (let j = 0; j < commentCount; j++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      await prisma.resComment.create({
        data: {
          post_id: post.id,
          user_id: randomUser.id,
          content: `Great post! Comment ${j + 1} on this amazing content.`,
        },
      });
    }

    // Create shares (random users)
    const shareCount = Math.min(postData.shareCount, users.length - 1);
    const sharedUserIds = new Set<string>();
    for (let j = 0; j < shareCount; j++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      if (randomUser.id !== user.id && !sharedUserIds.has(randomUser.id)) {
        sharedUserIds.add(randomUser.id);
        await prisma.resPostShare.create({
          data: {
            post_id: post.id,
            user_id: randomUser.id,
          },
        });
      }
    }

    createdPosts.push(post);
  }

  console.log(
    `✅ Created ${createdPosts.length} posts with media, hashtags, likes, comments, and shares`,
  );

  // 4. Update hashtag post counts
  console.log('📊 Updating hashtag post counts...');
  for (const [tagName, hashtagId] of hashtagMap.entries()) {
    const postCount = await prisma.resPostHashtag.count({
      where: { hashtag_id: hashtagId },
    });
    await prisma.resHashtag.update({
      where: { id: hashtagId },
      data: { post_count: postCount },
    });
  }

  console.log('✅ Updated hashtag post counts');

  console.log('🎉 Posts seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding posts:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
