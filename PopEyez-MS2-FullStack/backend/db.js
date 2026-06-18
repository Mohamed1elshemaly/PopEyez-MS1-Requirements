const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database', 'db.json');
const SEED_PATH = path.join(__dirname, 'database', 'seed.json');

function ensureDatabase() {
  if (!fs.existsSync(DB_PATH)) {
    const seed = fs.existsSync(SEED_PATH) ? fs.readFileSync(SEED_PATH, 'utf8') : '{}';
    fs.writeFileSync(DB_PATH, seed, 'utf8');
  }
}

function readDB() {
  ensureDatabase();
  const raw = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(raw);
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  return data;
}

function resetDB() {
  if (!fs.existsSync(SEED_PATH)) {
    throw new Error('Seed file is missing.');
  }
  const seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));
  writeDB(seed);
  return seed;
}

function generateId(prefix) {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${suffix}`;
}

function findById(collection, id) {
  return collection.find((item) => item.id === id);
}

function upsertById(collection, id, changes) {
  const index = collection.findIndex((item) => item.id === id);
  if (index === -1) return null;
  collection[index] = { ...collection[index], ...changes, updatedAt: new Date().toISOString() };
  return collection[index];
}

function removeById(collection, id) {
  const index = collection.findIndex((item) => item.id === id);
  if (index === -1) return null;
  const [removed] = collection.splice(index, 1);
  return removed;
}

module.exports = {
  DB_PATH,
  SEED_PATH,
  readDB,
  writeDB,
  resetDB,
  generateId,
  findById,
  upsertById,
  removeById
};
