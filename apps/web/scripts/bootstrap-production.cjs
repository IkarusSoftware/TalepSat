const path = require('path');

async function main() {
  const generatedPath = path.join(process.cwd(), 'src', 'generated', 'prisma');
  const { PrismaClient } = require(generatedPath);
  const prisma = new PrismaClient();

  const siteDefaults = {
    site_name: 'TalepSat',
    site_tagline: 'Ihtiyacini Yaz, Saticilar Yarissin',
    site_url: process.env.NEXTAUTH_URL || process.env.AUTH_URL || 'http://localhost:3000',
    contact_email: '',
    support_phone: '',
    logo_url: '',
    favicon_url: '',
    primary_color: '#f97316',
    registration_open: 'true',
    email_verification_required: 'false',
    google_login_enabled: 'false',
    listing_default_days: '30',
    listing_max_images: '5',
    listing_requires_approval: 'false',
    listing_max_budget: '1000000',
    offer_min_amount: '1',
    offer_max_revisions: '3',
    commission_rate: '0',
    email_notifications_enabled: 'true',
    admin_notification_email: '',
    smtp_host: '',
    smtp_port: '587',
    smtp_secure: 'false',
    smtp_user: '',
    smtp_pass: '',
    smtp_from_email: '',
    smtp_from_name: 'TalepSat',
    smtp_reply_to: '',
    seo_title: '',
    seo_description: '',
    seo_og_image: '',
    maintenance_mode: 'false',
    maintenance_message: 'Sitemiz su an bakimda. Lutfen daha sonra tekrar deneyin.',
  };

  const planDefaults = [
    {
      slug: 'free',
      name: 'Free',
      priceMonthly: 0,
      priceYearly: 0,
      offersPerMonth: 10,
      boostPerMonth: 0,
      maxListings: 3,
      analytics: false,
      analyticsTier: 'none',
      prioritySupport: false,
      verifiedBadge: false,
      customProfile: false,
      responseTime: 'Standart',
      sortOrder: 0,
    },
    {
      slug: 'basic',
      name: 'Basic',
      priceMonthly: 299,
      priceYearly: 2990,
      offersPerMonth: 50,
      boostPerMonth: 2,
      maxListings: 15,
      analytics: true,
      analyticsTier: 'basic',
      prioritySupport: false,
      verifiedBadge: false,
      customProfile: false,
      responseTime: '24 saat',
      sortOrder: 10,
    },
    {
      slug: 'plus',
      name: 'Plus',
      priceMonthly: 799,
      priceYearly: 7990,
      offersPerMonth: 200,
      boostPerMonth: 10,
      maxListings: 50,
      analytics: true,
      analyticsTier: 'plus',
      prioritySupport: true,
      verifiedBadge: true,
      customProfile: true,
      responseTime: '12 saat',
      sortOrder: 20,
    },
    {
      slug: 'pro',
      name: 'Pro',
      priceMonthly: 1499,
      priceYearly: 14990,
      offersPerMonth: null,
      boostPerMonth: null,
      maxListings: null,
      analytics: true,
      analyticsTier: 'pro',
      prioritySupport: true,
      verifiedBadge: true,
      customProfile: true,
      responseTime: '4 saat',
      sortOrder: 30,
    },
  ];

  try {
    const siteEntries = Object.entries(siteDefaults);
    let createdSettings = 0;
    let updatedSettings = 0;

    for (const [key, value] of siteEntries) {
      const existing = await prisma.siteSetting.findUnique({ where: { key } });
      if (existing) {
        updatedSettings += 1;
        await prisma.siteSetting.update({
          where: { key },
          data: { value: existing.value || value },
        });
      } else {
        createdSettings += 1;
        await prisma.siteSetting.create({
          data: { key, value },
        });
      }
    }

    let createdPlans = 0;
    let updatedPlans = 0;

    for (const plan of planDefaults) {
      const existing = await prisma.plan.findUnique({ where: { slug: plan.slug } });
      if (existing) {
        updatedPlans += 1;
        await prisma.plan.update({
          where: { slug: plan.slug },
          data: {
            name: existing.name || plan.name,
            priceMonthly: existing.priceMonthly,
            priceYearly: existing.priceYearly,
            offersPerMonth: existing.offersPerMonth,
            boostPerMonth: existing.boostPerMonth,
            maxListings: existing.maxListings,
            analytics: existing.analytics,
            analyticsTier: existing.analyticsTier,
            prioritySupport: existing.prioritySupport,
            verifiedBadge: existing.verifiedBadge,
            customProfile: existing.customProfile,
            responseTime: existing.responseTime,
            sortOrder: existing.sortOrder,
          },
        });
      } else {
        createdPlans += 1;
        await prisma.plan.create({ data: plan });
      }
    }

    const summary = {
      createdSettings,
      updatedSettings,
      createdPlans,
      updatedPlans,
      users: await prisma.user.count(),
      plans: await prisma.plan.count(),
      settings: await prisma.siteSetting.count(),
    };

    console.log('[bootstrap-production] done');
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('[bootstrap-production] failed');
  console.error(error);
  process.exit(1);
});
