import { initDb, closeDb } from './db.js';
import { seedPackages } from './seed.js';

const force = process.argv.includes('--force');

async function main(): Promise<void> {
  await initDb();
  const count = await seedPackages(force);
  console.log(`Seeded ${count} packages${force ? ' (forced)' : ''}`);
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
