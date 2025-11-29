import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTwoFactorStatus(email: string) {
  console.log(`\n🔍 Checking 2FA status for: ${email}\n`);

  const associate = await prisma.resAssociate.findFirst({
    where: { email: email.trim().toLowerCase() },
    include: {
      user: {
        include: {
          twoFactor: true,
        },
      },
    },
  });

  if (!associate) {
    console.log('❌ User not found with email:', email);
    console.log('\n💡 Suggestion: Register user first with POST /api/auth/register');
    return;
  }

  console.log('✅ User found:');
  console.log('   - User ID:', associate.user.id);
  console.log('   - Email:', associate.email);
  console.log('   - Nickname:', associate.user.nickname);
  console.log('   - Email Verified:', associate.email_verified);
  console.log('   - Has 2FA Record:', !!associate.user.twoFactor);
  console.log('   - 2FA Enabled:', associate.user.twoFactor?.enabled ?? false);
  console.log('   - Has Secret:', !!associate.user.twoFactor?.secret);

  console.log('\n📊 Status:');
  if (!associate.user.twoFactor) {
    console.log('⚠️  User chưa setup 2FA');
    console.log('   → Cần gọi: POST /api/auth/2fa/setup (với JWT token)');
  } else if (!associate.user.twoFactor.enabled) {
    console.log('⚠️  User đã setup nhưng chưa enable 2FA');
    console.log('   → Cần gọi: POST /api/auth/2fa/enable (với code từ authenticator app)');
  } else {
    console.log('✅ User đã enable 2FA');
    console.log('   → Login sẽ trả về: { requires_2fa: true, temp_token: "...", expires_in: 300 }');
  }

  console.log('\n');
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('Usage: ts-node scripts/check-2fa-status.ts <email>');
  console.log('Example: ts-node scripts/check-2fa-status.ts user@example.com');
  process.exit(1);
}

checkTwoFactorStatus(email)
  .then(() => {
    prisma.$disconnect();
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error:', err);
    prisma.$disconnect();
    process.exit(1);
  });
