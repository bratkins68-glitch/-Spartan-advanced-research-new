import pg from 'pg';

const { Pool } = pg;

export default async function handler(req, res) {
  if (!process.env.DATABASE_URL) {
    return res.status(500).json({
      ok: false,
      error: 'DATABASE_URL is not configured'
    });
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const result = await pool.query('SELECT NOW() AS server_time');
    res.status(200).json({
      ok: true,
      database: 'connected',
      serverTime: result.rows[0].server_time
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      database: 'connection_failed',
      error: err.message
    });
  } finally {
    await pool.end();
  }
}
