import { db } from './server/db';
import { policies } from './drizzle/schema';

async function inspectDatabase() {
  try {
    // Try to query the policies table to see what columns exist
    const result = await db.select().from(policies).limit(1);
    console.log('Query successful, policies table exists');
    console.log('Sample row:', result[0]);
  } catch (error: any) {
    console.error('Error querying policies:', error.message);
  }
}

inspectDatabase();
