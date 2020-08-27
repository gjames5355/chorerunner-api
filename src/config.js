module.exports = {
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  DATABASE_URL:
    process.env.DATABASE_URL ||
    'postgresql://dunder_mifflin@localhost/chorerunner',
  TEST_DATABASE_URL:
    process.env.TEST_DATABASE_URL ||
    'postgresql://dunder_mifflin@localhost/chorerunner-test',
  JWT_SECRET: process.env.JWT_SECRET || 'chorerunner-jwt-secret',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '3h',
};
