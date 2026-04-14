import mysql from 'mysql2/promise';

async function main() {
  try {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL not set');
    
    const pool = mysql.createPool(url);
    const conn = await pool.getConnection();
    
    // Get all columns from policies table
    const [rows] = await conn.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'policies' 
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('Actual database columns in policies table:');
    rows.forEach(row => {
      console.log(`  ${row.COLUMN_NAME}: ${row.COLUMN_TYPE} ${row.IS_NULLABLE === 'NO' ? 'NOT NULL' : ''}`);
    });
    
    conn.release();
    pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
