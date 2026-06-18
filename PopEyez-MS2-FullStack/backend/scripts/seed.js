const { resetDB, DB_PATH } = require('../db');

try {
  resetDB();
  console.log(`Database reset successfully at ${DB_PATH}`);
} catch (error) {
  console.error('Failed to seed database:', error.message);
  process.exit(1);
}
