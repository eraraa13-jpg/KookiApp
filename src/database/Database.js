import * as SQLite from 'expo-sqlite';

let db;

async function getDB() {
  if (!db) db = await SQLite.openDatabaseAsync('kooki.db');
  return db;
}

export async function initDatabase() {
  const d = await getDB();
  await d.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      bank_name TEXT,
      card_number TEXT,
      initial_balance REAL DEFAULT 0,
      color TEXT DEFAULT '#e94560',
      icon TEXT DEFAULT '🏦',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income','expense')),
      icon TEXT DEFAULT '📌',
      color TEXT DEFAULT '#e94560',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income','expense','transfer')),
      category_id INTEGER,
      account_id INTEGER NOT NULL,
      to_account_id INTEGER,
      description TEXT,
      date TEXT NOT NULL,
      tags TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (account_id) REFERENCES accounts(id)
    );
  `);

  const cc = await d.getFirstAsync('SELECT COUNT(*) as c FROM categories');
  if (cc.c === 0) {
    await d.execAsync(`
      INSERT INTO categories (name,type,icon,color) VALUES
      ('خوراک','expense','🍕','#e17055'),
      ('حمل‌ونقل','expense','🚗','#00cec9'),
      ('خرید','expense','🛍️','#6c5ce7'),
      ('قبوض','expense','📄','#fdcb6e'),
      ('سلامت','expense','💊','#ff7675'),
      ('تفریح','expense','🎮','#a29bfe'),
      ('آموزش','expense','📚','#74b9ff'),
      ('پوشاک','expense','👔','#fab1a0'),
      ('اجاره','expense','🏠','#fd79a8'),
      ('حقوق','income','💰','#00b894'),
      ('فریلنس','income','💻','#00cec9'),
      ('سرمایه‌گذاری','income','📈','#6c5ce7'),
      ('سایر درآمد','income','💵','#55efc4');
    `);
  }

  const ac = await d.getFirstAsync('SELECT COUNT(*) as c FROM accounts');
  if (ac.c === 0) {
    await d.execAsync(`
      INSERT INTO accounts (name,bank_name,initial_balance,color,icon) VALUES
      ('کیف پول','نقدی',0,'#e94560','👛'),
      ('بانک ملی','ملی',0,'#00b894','🏦'),
      ('بانک ملت','ملت',0,'#6c5ce7','🏦');
    `);
  }
}

export async function getAccounts() {
  return (await getDB()).getAllAsync('SELECT * FROM accounts WHERE is_active=1 ORDER BY created_at DESC');
}

export async function addAccount(a) {
  const r = await (await getDB()).runAsync(
    'INSERT INTO accounts (name,bank_name,card_number,initial_balance,color,icon) VALUES (?,?,?,?,?,?)',
    [a.name, a.bank_name, a.card_number, a.initial_balance || 0, a.color || '#e94560', a.icon || '🏦']
  );
  return r.lastInsertRowId;
}

export async function updateAccount(id, a) {
  await (await getDB()).runAsync(
    'UPDATE accounts SET name=?,bank_name=?,card_number=?,initial_balance=?,color=?,icon=? WHERE id=?',
    [a.name, a.bank_name, a.card_number, a.initial_balance, a.color, a.icon, id]
  );
}

export async function deleteAccount(id) {
  await (await getDB()).runAsync('UPDATE accounts SET is_active=0 WHERE id=?', [id]);
}

export async function getAccountBalance(accountId) {
  const d = await getDB();
  const acc = await d.getFirstAsync('SELECT initial_balance FROM accounts WHERE id=?', [accountId]);
  const inc = await d.getFirstAsync('SELECT COALESCE(SUM(amount),0) as t FROM transactions WHERE account_id=? AND type="income"', [accountId]);
  const exp = await d.getFirstAsync('SELECT COALESCE(SUM(amount),0) as t FROM transactions WHERE account_id=? AND type="expense"', [accountId]);
  const tIn = await d.getFirstAsync('SELECT COALESCE(SUM(amount),0) as t FROM transactions WHERE to_account_id=? AND type="transfer"', [accountId]);
  const tOut = await d.getFirstAsync('SELECT COALESCE(SUM(amount),0) as t FROM transactions WHERE account_id=? AND type="transfer"', [accountId]);
  return (acc?.initial_balance || 0) + inc.t - exp.t + tIn.t - tOut.t;
}

export async function getCategories(type) {
  const d = await getDB();
  if (type) return d.getAllAsync('SELECT * FROM categories WHERE is_active=1 AND type=? ORDER BY name', [type]);
  return d.getAllAsync('SELECT * FROM categories WHERE is_active=1 ORDER BY type,name');
}

export async function addCategory(c) {
  const r = await (await getDB()).runAsync(
    'INSERT INTO categories (name,type,icon,color) VALUES (?,?,?,?)',
    [c.name, c.type, c.icon || '📌', c.color || '#e94560']
  );
  return r.lastInsertRowId;
}

export async function updateCategory(id, c) {
  await (await getDB()).runAsync(
    'UPDATE categories SET name=?,type=?,icon=?,color=? WHERE id=?',
    [c.name, c.type, c.icon, c.color, id]
  );
}

export async function deleteCategory(id) {
  await (await getDB()).runAsync('UPDATE categories SET is_active=0 WHERE id=?', [id]);
}

export async function getTransactions(filters = {}) {
  const d = await getDB();
  let q = `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
           a.name as account_name, a.icon as account_icon, a.color as account_color,
           ta.name as to_account_name
           FROM transactions t
           LEFT JOIN categories c ON t.category_id=c.id
           LEFT JOIN accounts a ON t.account_id=a.id
           LEFT JOIN accounts ta ON t.to_account_id=ta.id WHERE 1=1`;
  const p = [];
  if (filters.type) { q += ' AND t.type=?'; p.push(filters.type); }
  if (filters.category_id) { q += ' AND t.category_id=?'; p.push(filters.category_id); }
  if (filters.account_id) { q += ' AND (t.account_id=? OR t.to_account_id=?)'; p.push(filters.account_id, filters.account_id); }
  if (filters.startDate) { q += ' AND t.date>=?'; p.push(filters.startDate); }
  if (filters.endDate) { q += ' AND t.date<=?'; p.push(filters.endDate); }
  q += ' ORDER BY t.date DESC, t.created_at DESC';
  if (filters.limit) { q += ' LIMIT ?'; p.push(filters.limit); }
  return d.getAllAsync(q, p);
}

export async function addTransaction(t) {
  const r = await (await getDB()).runAsync(
    'INSERT INTO transactions (amount,type,category_id,account_id,to_account_id,description,date,tags) VALUES (?,?,?,?,?,?,?,?)',
    [t.amount, t.type, t.category_id, t.account_id, t.to_account_id, t.description, t.date, t.tags]
  );
  return r.lastInsertRowId;
}

export async function updateTransaction(id, t) {
  await (await getDB()).runAsync(
    'UPDATE transactions SET amount=?,type=?,category_id=?,account_id=?,to_account_id=?,description=?,date=?,tags=? WHERE id=?',
    [t.amount, t.type, t.category_id, t.account_id, t.to_account_id, t.description, t.date, t.tags, id]
  );
}

export async function deleteTransaction(id) {
  await (await getDB()).runAsync('DELETE FROM transactions WHERE id=?', [id]);
}

export async function getTotalBalance() {
  const accs = await getAccounts();
  let total = 0;
  for (const a of accs) total += await getAccountBalance(a.id);
  return total;
}

export async function getMonthlyStats(startDate, endDate) {
  const d = await getDB();
  const inc = await d.getFirstAsync('SELECT COALESCE(SUM(amount),0) as t FROM transactions WHERE type="income" AND date>=? AND date<=?', [startDate, endDate]);
  const exp = await d.getFirstAsync('SELECT COALESCE(SUM(amount),0) as t FROM transactions WHERE type="expense" AND date>=? AND date<=?', [startDate, endDate]);
  return { income: inc.t, expense: exp.t, balance: inc.t - exp.t };
}

export async function getCategoryStats(type, startDate, endDate) {
  return (await getDB()).getAllAsync(
    `SELECT c.id,c.name,c.icon,c.color,COALESCE(SUM(t.amount),0) as total,COUNT(t.id) as count
     FROM categories c LEFT JOIN transactions t ON c.id=t.category_id AND t.date>=? AND t.date<=?
     WHERE c.type=? AND c.is_active=1 GROUP BY c.id HAVING total>0 ORDER BY total DESC`,
    [startDate, endDate, type]
  );
}

export async function exportData() {
  const d = await getDB();
  return JSON.stringify({
    accounts: await d.getAllAsync('SELECT * FROM accounts'),
    categories: await d.getAllAsync('SELECT * FROM categories'),
    transactions: await d.getAllAsync('SELECT * FROM transactions'),
    exportDate: new Date().toISOString()
  });
}