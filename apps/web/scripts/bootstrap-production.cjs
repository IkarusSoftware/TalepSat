const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env') });

const { Client } = require('pg');
const { syncLegacyAdminsPostgres } = require('./sync-admin-accounts.cjs');

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is required.');
  }

  if (connectionString.startsWith('file:') || connectionString === ':memory:') {
    throw new Error('bootstrap:production only supports PostgreSQL.');
  }

  const client = new Client({ connectionString });

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
      id: 'plan_free',
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
      id: 'plan_basic',
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
      id: 'plan_plus',
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
      id: 'plan_pro',
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

  await client.connect();

  try {
    await client.query('BEGIN');

    let createdSettings = 0;
    for (const [key, value] of Object.entries(siteDefaults)) {
      const result = await client.query(
        `
          INSERT INTO "SiteSetting" ("key", "value", "updatedAt")
          VALUES ($1, $2, NOW())
          ON CONFLICT ("key") DO NOTHING
        `,
        [key, value],
      );
      createdSettings += result.rowCount || 0;
    }

    let createdPlans = 0;
    for (const plan of planDefaults) {
      const result = await client.query(
        `
          INSERT INTO "Plan" (
            "id",
            "slug",
            "name",
            "priceMonthly",
            "priceYearly",
            "offersPerMonth",
            "boostPerMonth",
            "maxListings",
            "analytics",
            "analyticsTier",
            "prioritySupport",
            "verifiedBadge",
            "customProfile",
            "responseTime",
            "sortOrder",
            "updatedAt"
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW()
          )
          ON CONFLICT ("slug") DO NOTHING
        `,
        [
          plan.id,
          plan.slug,
          plan.name,
          plan.priceMonthly,
          plan.priceYearly,
          plan.offersPerMonth,
          plan.boostPerMonth,
          plan.maxListings,
          plan.analytics,
          plan.analyticsTier,
          plan.prioritySupport,
          plan.verifiedBadge,
          plan.customProfile,
          plan.responseTime,
          plan.sortOrder,
        ],
      );
      createdPlans += result.rowCount || 0;
    }

    const adminSync = await syncLegacyAdminsPostgres(client);

    await client.query('COMMIT');

    const counts = await client.query(`
      SELECT
        (SELECT COUNT(*)::int FROM "User") AS users,
        (SELECT COUNT(*)::int FROM "AdminAccount") AS admins,
        (SELECT COUNT(*)::int FROM "Plan") AS plans,
        (SELECT COUNT(*)::int FROM "SiteSetting") AS settings
    `);

    console.log('[bootstrap-production] done');
    console.log(
      JSON.stringify(
        {
          createdSettings,
          createdPlans,
          adminSync,
          ...counts.rows[0],
        },
        null,
        2,
      ),
    );
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('[bootstrap-production] failed');
  console.error(error);
  process.exit(1);
});
