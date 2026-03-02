require('dotenv').config();

function buildConfig() {
  const dialect = process.env.DB_DIALECT || 'postgres';
  let host = process.env.DB_HOST || 'localhost';
  let port = parseInt(process.env.DB_PORT || '5432', 10);
  let database = process.env.DB_NAME;
  let username = process.env.DB_USER;
  let password = process.env.DB_PASS;

  // Allow DATABASE_URL to populate missing fields
  const dbUrl = process.env.DATABASE_URL || process.env.DATABASE_URI || '';
  if ((!username || !password || !database) && dbUrl) {
    try {
      const u = new URL(dbUrl);
      host = u.hostname || host;
      port = parseInt(u.port || String(port), 10);
      database = (u.pathname || '').replace(/^\//, '') || database;
      username = decodeURIComponent(u.username || '') || username;
      password = decodeURIComponent(u.password || '') || password;
    } catch (e) {
      // ignore parse errors, keep env fallbacks
    }
  }
  const sslEnable = String(process.env.DB_SSL || '').toLowerCase() === 'true'
    || String(process.env.PGSSLMODE || '').toLowerCase() === 'require';

  return {
    dialect,
    host,
    port,
    database,
    username,
    password,
    logging: false,
    searchPath: 'public',
    schema: 'public',
    dialectOptions: {
      ssl: sslEnable ? { require: true, rejectUnauthorized: false } : false
    },
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_bin'
    }
  };
}

module.exports = {
  development: buildConfig(),
  test: buildConfig(),
  production: buildConfig()
};
