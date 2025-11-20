import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Gift seed...');

  // 1. Tạo Gift Categories
  console.log('📦 Creating gift categories...');
  const categories = [
    { name: 'Hot' },
    { name: 'Event' },
    { name: 'Lucky' },
    { name: 'Friendship' },
    { name: 'VIP' },
    { name: 'Normal' },
  ];

  const createdCategories = await Promise.all(
    categories.map(async (cat) => {
      const existing = await prisma.resGiftCategory.findFirst({
        where: { name: cat.name },
      });
      if (existing) {
        return existing;
      }
      return prisma.resGiftCategory.create({ data: cat });
    }),
  );

  console.log(`✅ Created ${createdCategories.length} categories`);

  // 2. Tạo Events (nếu chưa có) để gán cho event gifts
  console.log('🎉 Creating sample events...');
  const users = await prisma.resUser.findMany({ take: 3 });
  let sampleEvent = null;

  if (users.length > 0) {
    const existingEvent = await prisma.resEvent.findFirst({
      where: { title: 'Sample Event for Gifts' },
    });

    if (!existingEvent) {
      sampleEvent = await prisma.resEvent.create({
        data: {
          created_by: users[0].id,
          title: 'Sample Event for Gifts',
          description: 'Event mẫu để test gift items',
          start_time: new Date(),
          end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          is_public: true,
        },
      });
      console.log(`✅ Created sample event: ${sampleEvent.id}`);
    } else {
      sampleEvent = existingEvent;
      console.log(`✅ Using existing event: ${sampleEvent.id}`);
    }
  } else {
    console.log('⚠️  No users found. Skipping event creation.');
  }

  // 3. Tạo Gift Items
  console.log('🎁 Creating gift items...');

  const giftItems = [
    // Hot category
    {
      name: 'Rose',
      category_name: 'Hot',
      price: 10,
      type: 'hot',
      image_url: 'https://example.com/images/rose.png',
    },
    {
      name: 'Heart',
      category_name: 'Hot',
      price: 20,
      type: 'hot',
      image_url: 'https://example.com/images/heart.png',
    },
    {
      name: 'Kiss',
      category_name: 'Hot',
      price: 30,
      type: 'hot',
      image_url: 'https://example.com/images/kiss.png',
    },
    {
      name: 'Diamond Ring',
      category_name: 'Hot',
      price: 100,
      type: 'hot',
      image_url: 'https://example.com/images/diamond-ring.png',
    },

    // Event category
    {
      name: 'Birthday Cake',
      category_name: 'Event',
      price: 50,
      type: 'event',
      image_url: 'https://example.com/images/birthday-cake.png',
      event_id: sampleEvent?.id, // Gán event_id nếu có event
    },
    {
      name: 'Fireworks',
      category_name: 'Event',
      price: 40,
      type: 'event',
      image_url: 'https://example.com/images/fireworks.png',
      event_id: sampleEvent?.id,
    },
    {
      name: 'Party Hat',
      category_name: 'Event',
      price: 25,
      type: 'event',
      image_url: 'https://example.com/images/party-hat.png',
      event_id: sampleEvent?.id,
    },

    // Lucky category
    {
      name: 'Four Leaf Clover',
      category_name: 'Lucky',
      price: 35,
      type: 'lucky',
      image_url: 'https://example.com/images/clover.png',
    },
    {
      name: 'Horseshoe',
      category_name: 'Lucky',
      price: 45,
      type: 'lucky',
      image_url: 'https://example.com/images/horseshoe.png',
    },
    {
      name: 'Lucky Star',
      category_name: 'Lucky',
      price: 60,
      type: 'lucky',
      image_url: 'https://example.com/images/lucky-star.png',
    },

    // Friendship category
    {
      name: 'Handshake',
      category_name: 'Friendship',
      price: 15,
      type: 'friendship',
      image_url: 'https://example.com/images/handshake.png',
    },
    {
      name: 'Friendship Bracelet',
      category_name: 'Friendship',
      price: 30,
      type: 'friendship',
      image_url: 'https://example.com/images/friendship-bracelet.png',
    },
    {
      name: 'Gift Box',
      category_name: 'Friendship',
      price: 20,
      type: 'friendship',
      image_url: 'https://example.com/images/gift-box.png',
    },

    // VIP category
    {
      name: 'Golden Crown',
      category_name: 'VIP',
      price: 200,
      type: 'vip',
      image_url: 'https://example.com/images/golden-crown.png',
    },
    {
      name: 'Diamond',
      category_name: 'VIP',
      price: 500,
      type: 'vip',
      image_url: 'https://example.com/images/diamond.png',
    },
    {
      name: 'VIP Badge',
      category_name: 'VIP',
      price: 150,
      type: 'vip',
      image_url: 'https://example.com/images/vip-badge.png',
    },

    // Normal category
    {
      name: 'Flower',
      category_name: 'Normal',
      price: 5,
      type: 'normal',
      image_url: 'https://example.com/images/flower.png',
    },
    {
      name: 'Candy',
      category_name: 'Normal',
      price: 3,
      type: 'normal',
      image_url: 'https://example.com/images/candy.png',
    },
    {
      name: 'Balloon',
      category_name: 'Normal',
      price: 8,
      type: 'normal',
      image_url: 'https://example.com/images/balloon.png',
    },
    {
      name: 'Teddy Bear',
      category_name: 'Normal',
      price: 12,
      type: 'normal',
      image_url: 'https://example.com/images/teddy-bear.png',
    },
  ];

  const categoryMap = new Map(createdCategories.map((cat) => [cat.name, cat.id]));

  const createdItems = await Promise.all(
    giftItems.map(async (item) => {
      const categoryId = categoryMap.get(item.category_name);
      if (!categoryId) {
        throw new Error(`Category ${item.category_name} not found`);
      }

      const existing = await prisma.resGiftItem.findFirst({
        where: {
          name: item.name,
          category_id: categoryId,
        },
      });

      const itemData: any = {
        name: item.name,
        category_id: categoryId,
        price: item.price,
        type: item.type,
        image_url: item.image_url,
      };

      // Thêm event_id nếu có (sau khi migration chạy)
      if ((item as any).event_id) {
        itemData.event_id = (item as any).event_id;
      }

      if (existing) {
        return prisma.resGiftItem.update({
          where: { id: existing.id },
          data: itemData,
        });
      }

      return prisma.resGiftItem.create({
        data: itemData,
      });
    }),
  );

  console.log(`✅ Created ${createdItems.length} gift items`);

  // 4. Kiểm tra xem có users nào không, nếu không có thì bỏ qua việc tạo gifts
  if (users.length === 0) {
    console.log('⚠️  No users found. Skipping gift creation.');
    console.log('💡 Please create users first, then run this seed again.');
    return;
  }

  // 4. Tạo một số gifts mẫu để test
  console.log('🎁 Creating sample gifts...');
  const sampleGifts = [];

  // Tạo gifts giữa các users
  for (let i = 0; i < Math.min(users.length, 3); i++) {
    const sender = users[i];
    const receiver = users[(i + 1) % users.length];

    // Tạo 5-10 gifts ngẫu nhiên cho mỗi cặp
    const numGifts = Math.floor(Math.random() * 6) + 5; // 5-10 gifts
    for (let j = 0; j < numGifts; j++) {
      const randomItem = createdItems[Math.floor(Math.random() * createdItems.length)];
      const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 quantity

      sampleGifts.push({
        sender_id: sender.id,
        receiver_id: receiver.id,
        gift_item_id: randomItem.id,
        quantity: quantity,
        message: `Gift #${j + 1} from ${sender.nickname}`,
      });
    }
  }

  // Tạo gifts với created_at cách nhau để test recent-gifts
  const now = new Date();
  for (let i = 0; i < sampleGifts.length; i++) {
    const gift = sampleGifts[i];
    const created_at = new Date(now.getTime() - i * 60000); // Mỗi gift cách nhau 1 phút

    await prisma.resGift.create({
      data: {
        ...gift,
        created_at: created_at,
      },
    });
  }

  console.log(`✅ Created ${sampleGifts.length} sample gifts`);

  // 5. Tạo một số milestones mẫu
  console.log('🏆 Creating sample milestones...');
  const milestoneCounts = [10, 50, 100, 200, 500, 1000];

  for (const user of users.slice(0, 2)) {
    // Đếm số gifts user đã nhận
    const totalGifts = await prisma.resGift.count({
      where: { receiver_id: user.id },
    });

    for (const milestone of milestoneCounts) {
      const isUnlocked = totalGifts >= milestone;
      const existing = await prisma.resGiftMilestone.findFirst({
        where: {
          user_id: user.id,
          milestone: milestone,
        },
      });

      if (existing) {
        await prisma.resGiftMilestone.update({
          where: { id: existing.id },
          data: {
            current: Math.min(totalGifts, milestone),
            is_unlocked: isUnlocked,
          },
        });
      } else {
        await prisma.resGiftMilestone.create({
          data: {
            user_id: user.id,
            milestone: milestone,
            current: Math.min(totalGifts, milestone),
            is_unlocked: isUnlocked,
            reward_name: `${milestone} Gifts Badge`,
            icon_url: `https://example.com/images/badge-${milestone}.png`,
          },
        });
      }
    }
  }

  console.log(`✅ Created milestones for ${Math.min(users.length, 2)} users`);

  console.log('\n✨ Gift seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Categories: ${createdCategories.length}`);
  console.log(`   - Gift Items: ${createdItems.length}`);
  console.log(`   - Sample Gifts: ${sampleGifts.length}`);
  console.log(`   - Users with milestones: ${Math.min(users.length, 2)}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding gifts:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
