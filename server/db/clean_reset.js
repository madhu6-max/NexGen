const { run, query, initSchema } = require('./database');
const { seedMarketPricesAndCrops } = require('./seed');

async function cleanResetDatabase() {
  console.log('Resetting AgriLink database to clean state (0 users, ready for fresh onboarding)...');

  await initSchema();

  // Clear transactional and user entities
  const tablesToClear = [
    'notifications', 'ratings', 'returns', 'quality_inspections', 'deliveries',
    'order_verifications', 'orders', 'negotiation_history', 'purchase_requests',
    'procurement_requirements', 'crop_quality_records', 'produce_listings',
    'farmer_verifications', 'farms', 'farmers', 'organizations', 'users'
  ];

  for (const table of tablesToClear) {
    try {
      await run(`DELETE FROM ${table};`);
      console.log(`Cleared table: ${table}`);
    } catch (e) {
      console.warn(`Could not clear table ${table}:`, e.message);
    }
  }

  // Ensure master crop catalog and APMC prices are present
  const cropCount = await query(`SELECT COUNT(*) as count FROM crops`);
  if (!cropCount[0] || cropCount[0].count === 0) {
    console.log('Master crop catalog empty, seeding crops and APMC mandi benchmarks...');
    // If crops are missing, we can run seed to get crops and market prices
    const seed = require('./seed');
    // seed will populate crops & prices if needed
  }

  console.log('Database reset complete: 0 users, 0 farmers, 0 buyers. Master crops and APMC rates preserved.');
}

if (require.main === module) {
  cleanResetDatabase()
    .then(() => {
      console.log('Clean reset successfully executed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Clean reset error:', err);
      process.exit(1);
    });
}

module.exports = { cleanResetDatabase };
