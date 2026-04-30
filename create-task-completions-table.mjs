import { drizzle } from 'drizzle-orm/mysql2';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

async function createTable() {
  try {
    console.log('Creating taskCompletions table...');
    
    // Create the table using raw SQL
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS taskCompletions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        strategyId INT NOT NULL,
        taskId VARCHAR(255) NOT NULL,
        taskTitle VARCHAR(512),
        stage INT NOT NULL,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        completedAt TIMESTAMP NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_task_completion (userId, strategyId, taskId),
        INDEX idx_user_strategy (userId, strategyId),
        INDEX idx_stage (stage)
      )
    `);
    
    console.log('✓ taskCompletions table created successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error creating table:', error.message);
    process.exit(1);
  }
}

createTable();
