import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Wallet seed...');

  // 1. Tạo Recharge Packages
  console.log('💎 Creating recharge packages...');
  const packages = [
    {
      package_id: 1,
      diamonds: 100,
      price: 10000, // 10,000 VND
      bonus: 'Bonus 10 đá quý',
      is_active: true,
    },
    {
      package_id: 2,
      diamonds: 500,
      price: 45000, // 45,000 VND (giảm giá)
      bonus: 'Bonus 50 đá quý',
      is_active: true,
    },
    {
      package_id: 3,
      diamonds: 1000,
      price: 80000, // 80,000 VND (giảm giá)
      bonus: 'Bonus 100 đá quý',
      is_active: true,
    },
    {
      package_id: 4,
      diamonds: 2000,
      price: 150000, // 150,000 VND (giảm giá)
      bonus: 'Bonus 200 đá quý',
      is_active: true,
    },
    {
      package_id: 5,
      diamonds: 5000,
      price: 350000, // 350,000 VND (giảm giá)
      bonus: 'Bonus 500 đá quý',
      is_active: true,
    },
    {
      package_id: 6,
      diamonds: 10000,
      price: 650000, // 650,000 VND (giảm giá)
      bonus: 'Bonus 1000 đá quý',
      is_active: true,
    },
  ];

  let createdCount = 0;
  let updatedCount = 0;

  for (const pkg of packages) {
    const existing = await prisma.resRechargePackage.findUnique({
      where: { package_id: pkg.package_id },
    });

    if (existing) {
      await prisma.resRechargePackage.update({
        where: { package_id: pkg.package_id },
        data: {
          diamonds: pkg.diamonds,
          price: new Prisma.Decimal(pkg.price),
          bonus: pkg.bonus,
          is_active: pkg.is_active,
        },
      });
      updatedCount++;
    } else {
      await prisma.resRechargePackage.create({
        data: {
          ...pkg,
          price: new Prisma.Decimal(pkg.price),
        },
      });
      createdCount++;
    }
  }

  console.log(`✅ Created ${createdCount} packages, updated ${updatedCount} packages`);

  // 2. Tạo Monthly Cards
  console.log('📅 Creating monthly cards...');
  const monthlyCards = [
    {
      card_id: 1,
      name: 'Thẻ Tháng Cơ Bản',
      price: 50000, // 50,000 VND
      diamonds_daily: 10,
      duration: 30,
      is_active: true,
    },
    {
      card_id: 2,
      name: 'Thẻ Tháng VIP',
      price: 100000, // 100,000 VND
      diamonds_daily: 25,
      duration: 30,
      is_active: true,
    },
    {
      card_id: 3,
      name: 'Thẻ Tháng Premium',
      price: 200000, // 200,000 VND
      diamonds_daily: 50,
      duration: 30,
      is_active: true,
    },
  ];

  let createdCards = 0;
  let updatedCards = 0;

  for (const card of monthlyCards) {
    const existing = await prisma.resMonthlyCard.findUnique({
      where: { card_id: card.card_id },
    });

    if (existing) {
      await prisma.resMonthlyCard.update({
        where: { card_id: card.card_id },
        data: {
          name: card.name,
          price: new Prisma.Decimal(card.price),
          diamonds_daily: card.diamonds_daily,
          duration: card.duration,
          is_active: card.is_active,
        },
      });
      updatedCards++;
    } else {
      await prisma.resMonthlyCard.create({
        data: {
          ...card,
          price: new Prisma.Decimal(card.price),
        },
      });
      createdCards++;
    }
  }

  console.log(`✅ Created ${createdCards} monthly cards, updated ${updatedCards} monthly cards`);

  // 3. Tạo Payment Methods
  console.log('💳 Creating payment methods...');
  const paymentMethods = [
    {
      method_id: 'visa',
      name: 'Visa',
      type: 'card',
      masked_info: '**** **** **** 1234',
      is_active: true,
    },
    {
      method_id: 'mastercard',
      name: 'Mastercard',
      type: 'card',
      masked_info: '**** **** **** 5678',
      is_active: true,
    },
    {
      method_id: 'dolfie',
      name: 'Dolfie',
      type: 'subscription',
      masked_info: null,
      is_active: true,
    },
    {
      method_id: 'crypto',
      name: 'Cryptocurrency',
      type: 'crypto',
      masked_info: null,
      is_active: true,
    },
  ];

  let createdMethods = 0;
  let updatedMethods = 0;

  for (const method of paymentMethods) {
    const existing = await prisma.resPaymentMethod.findUnique({
      where: { method_id: method.method_id },
    });

    if (existing) {
      await prisma.resPaymentMethod.update({
        where: { method_id: method.method_id },
        data: {
          name: method.name,
          type: method.type,
          masked_info: method.masked_info,
          is_active: method.is_active,
        },
      });
      updatedMethods++;
    } else {
      await prisma.resPaymentMethod.create({
        data: method,
      });
      createdMethods++;
    }
  }

  console.log(
    `✅ Created ${createdMethods} payment methods, updated ${updatedMethods} payment methods`,
  );

  console.log('🎉 Wallet seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding wallet data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
