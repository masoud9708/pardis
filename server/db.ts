import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'pardis.db');
export const db = new DatabaseSync(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  // 1. Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mobile TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('ADMIN', 'OPERATOR', 'DRIVER')),
      avatar TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      last_login TEXT
    );
  `);

  // 2. Drivers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      national_code TEXT NOT NULL,
      birth_date TEXT,
      address TEXT,
      city TEXT DEFAULT 'تهران',
      emergency_contact TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'ACTIVE', 'OFFLINE', 'ONLINE', 'BUSY', 'SUSPENDED', 'REJECTED')),
      rating REAL DEFAULT 5.0,
      completed_trips INTEGER DEFAULT 0,
      total_debt INTEGER DEFAULT 0,
      wallet_balance INTEGER DEFAULT 150000,
      lat REAL DEFAULT 33.4360,
      lng REAL DEFAULT 48.3610,
      bearing REAL DEFAULT 0,
      last_location_time TEXT,
      current_shift_id INTEGER,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 3. Vehicles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_id INTEGER NOT NULL,
      car_name TEXT NOT NULL,
      model TEXT NOT NULL,
      color TEXT NOT NULL,
      license_plate TEXT NOT NULL,
      year TEXT NOT NULL,
      vehicle_type TEXT DEFAULT 'STANDARD' CHECK(vehicle_type IN ('STANDARD', 'COMFORT', 'VAN', 'VIP')),
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
    );
  `);

  // 4. Customers table (Frequent flyers / subscribers)
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_code TEXT UNIQUE,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      address TEXT,
      default_destination TEXT,
      total_trips INTEGER DEFAULT 0,
      discount_percent INTEGER DEFAULT 10,
      is_vip INTEGER DEFAULT 1,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // 5. Zones table
  db.exec(`
    CREATE TABLE IF NOT EXISTS zones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      is_active INTEGER DEFAULT 1
    );
  `);

  // 6. Tariffs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tariffs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      origin_zone_id INTEGER NOT NULL,
      destination_zone_id INTEGER NOT NULL,
      base_price INTEGER NOT NULL,
      night_price INTEGER NOT NULL,
      holiday_price INTEGER NOT NULL,
      waiting_fee_per_min INTEGER DEFAULT 2500,
      stop_fee INTEGER DEFAULT 30000,
      extra_distance_fee_per_km INTEGER DEFAULT 8000,
      vehicle_type TEXT DEFAULT 'STANDARD',
      commission_rate REAL DEFAULT 0.15,
      fixed_commission INTEGER DEFAULT 0,
      valid_from TEXT DEFAULT '1403/01/01',
      valid_to TEXT DEFAULT '1405/12/29',
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (origin_zone_id) REFERENCES zones(id),
      FOREIGN KEY (destination_zone_id) REFERENCES zones(id)
    );
  `);

  // 7. Trips table
  db.exec(`
    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_number TEXT UNIQUE NOT NULL,
      customer_id INTEGER,
      subscription_code TEXT,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      driver_id INTEGER,
      vehicle_id INTEGER,
      trip_date TEXT NOT NULL,
      trip_time TEXT NOT NULL,
      service_type TEXT DEFAULT 'استاندارد',
      price INTEGER NOT NULL,
      commission INTEGER NOT NULL,
      driver_share INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK(status IN ('REQUESTED', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
      payment_method TEXT DEFAULT 'CASH' CHECK(payment_method IN ('CASH', 'ONLINE', 'ACCOUNT')),
      notes TEXT,
      is_night_shift INTEGER DEFAULT 0,
      created_by_user_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      completed_at TEXT,
      FOREIGN KEY (driver_id) REFERENCES drivers(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY (created_by_user_id) REFERENCES users(id)
    );
  `);

  // 8. Trip Status History table
  db.exec(`
    CREATE TABLE IF NOT EXISTS trip_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      changed_by_user_id INTEGER NOT NULL,
      notes TEXT,
      timestamp TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
      FOREIGN KEY (changed_by_user_id) REFERENCES users(id)
    );
  `);

  // 9. Driver Ledger table
  db.exec(`
    CREATE TABLE IF NOT EXISTS driver_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_id INTEGER NOT NULL,
      trip_id INTEGER,
      type TEXT NOT NULL CHECK(type IN ('COMMISSION_DEBT', 'PAYMENT_CREDIT', 'ADJUSTMENT')),
      amount INTEGER NOT NULL,
      balance_after INTEGER NOT NULL,
      description TEXT NOT NULL,
      reference_number TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
      FOREIGN KEY (trip_id) REFERENCES trips(id)
    );
  `);

  // 10. Payments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_id INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'SUCCESS', 'FAILED')),
      reference_number TEXT UNIQUE NOT NULL,
      gateway_name TEXT DEFAULT 'سامان کیش',
      transaction_id TEXT,
      card_pan_mask TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      verified_at TEXT,
      receipt_data TEXT,
      FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
    );
  `);

  // 11. Night Shifts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS night_shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      driver_id INTEGER NOT NULL,
      start_time TEXT NOT NULL DEFAULT '22:00',
      end_time TEXT NOT NULL DEFAULT '06:00',
      status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK(status IN ('SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'ABSENT')),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
    );
  `);

  // 12. Conversations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('DIRECT', 'GROUP', 'TRIP')),
      title TEXT NOT NULL,
      trip_id INTEGER,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
    );
  `);

  // 13. Conversation Members table
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversation_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'MEMBER',
      last_read_message_id INTEGER DEFAULT 0,
      joined_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(conversation_id, user_id)
    );
  `);

  // 14. Messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      attachment_url TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 15. Notifications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role TEXT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 16. Audit Logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT NOT NULL,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      ip_address TEXT,
      timestamp TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // 17. Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // 18. Points of Interest (POI)
  db.exec(`
    CREATE TABLE IF NOT EXISTS points_of_interest (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      address TEXT,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      fixed_price INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );
  `);

  // 19. Pricing Rules
  db.exec(`
    CREATE TABLE IF NOT EXISTS pricing_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_type TEXT NOT NULL,
      title TEXT NOT NULL,
      base_price INTEGER NOT NULL,
      per_km_price INTEGER DEFAULT 8000,
      night_multiplier REAL DEFAULT 1.2,
      holiday_multiplier REAL DEFAULT 1.3,
      commission_rate REAL DEFAULT 0.15,
      is_active INTEGER DEFAULT 1
    );
  `);

  // 20. SMS Logs (Kavenegar Integration)
  db.exec(`
    CREATE TABLE IF NOT EXISTS sms_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receptor TEXT NOT NULL,
      template_name TEXT NOT NULL,
      token TEXT,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'DELIVERED',
      cost INTEGER DEFAULT 120,
      timestamp TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // Safely alter existing tables if columns are missing
  try { db.exec('ALTER TABLE users ADD COLUMN username TEXT;'); } catch {}
  try { db.exec("UPDATE users SET username = 'admin', password_hash = 'sadra' WHERE role = 'ADMIN' OR mobile = '09121112233';"); } catch {}
  try { db.exec('ALTER TABLE drivers ADD COLUMN wallet_balance INTEGER DEFAULT 150000;'); } catch {}
  try { db.exec('ALTER TABLE drivers ADD COLUMN lat REAL DEFAULT 33.4360;'); } catch {}
  try { db.exec('ALTER TABLE drivers ADD COLUMN lng REAL DEFAULT 48.3610;'); } catch {}
  try { db.exec('ALTER TABLE drivers ADD COLUMN bearing REAL DEFAULT 0;'); } catch {}
  try { db.exec('ALTER TABLE drivers ADD COLUMN last_location_time TEXT;'); } catch {}
  try { db.exec("UPDATE drivers SET last_location_time = datetime('now', 'localtime') WHERE last_location_time IS NULL;"); } catch {}
  try { db.exec('UPDATE drivers SET lat = 33.504, lng = 48.352 WHERE lat > 35;'); } catch {}
  try { db.exec('ALTER TABLE drivers ADD COLUMN rejection_reason TEXT;'); } catch {}
  try { db.exec('ALTER TABLE drivers ADD COLUMN avatar TEXT;'); } catch {}
  try { db.exec('ALTER TABLE drivers ADD COLUMN documents_verified INTEGER DEFAULT 1;'); } catch {}
  try { db.exec('ALTER TABLE drivers ADD COLUMN license_card_url TEXT;'); } catch {}
  try { db.exec('ALTER TABLE drivers ADD COLUMN car_card_url TEXT;'); } catch {}
  try { db.exec('ALTER TABLE drivers ADD COLUMN insurance_url TEXT;'); } catch {}
  try { db.exec('ALTER TABLE drivers ADD COLUMN technical_inspection_url TEXT;'); } catch {}

  // Migrate customers table for subscription codes and VIP frequent-flyer attributes
  try { db.exec('ALTER TABLE customers ADD COLUMN subscription_code TEXT;'); } catch {}
  try { db.exec('ALTER TABLE customers ADD COLUMN default_destination TEXT;'); } catch {}
  try { db.exec('ALTER TABLE customers ADD COLUMN discount_percent INTEGER DEFAULT 10;'); } catch {}
  try { db.exec('ALTER TABLE customers ADD COLUMN is_vip INTEGER DEFAULT 1;'); } catch {}
  try { db.exec('ALTER TABLE customers ADD COLUMN notes TEXT;'); } catch {}
  try { db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_sub_code ON customers(subscription_code);'); } catch {}
  try { db.exec('ALTER TABLE trips ADD COLUMN customer_id INTEGER;'); } catch {}
  try { db.exec('ALTER TABLE trips ADD COLUMN subscription_code TEXT;'); } catch {}

  // Seed / ensure frequent subscribers exist with codes 101 to 108
  const subscriberCount = (db.prepare('SELECT COUNT(*) as cnt FROM customers WHERE subscription_code IS NOT NULL').get() as any)?.cnt || 0;
  if (subscriberCount < 5) {
    const frequentSubscribers = [
      {
        code: '101',
        name: 'حاج علی بیرانوند',
        phone: '09161112233',
        address: 'خرم‌آباد، روستای بهرامی، کوچه بوستان ۴، پلاک ۱۲',
        default_destination: 'خرم‌آباد، میدان شهدا و سبزه‌میدان',
        trips: 48,
        discount: 10,
        vip: 1,
        notes: 'مشترک طلایی و معتمد بهرامی؛ همیشه صندلی جلو و اعزام سریع',
      },
      {
        code: '102',
        name: 'سرکار خانم دکتر فاطمه صادقی',
        phone: '09162223344',
        address: 'خرم‌آباد، روستای بهرامی، خیابان اصلی، جنب داروخانه',
        default_destination: 'خرم‌آباد، بیمارستان شهید رحیمی',
        trips: 54,
        discount: 15,
        vip: 1,
        notes: 'پزشک متخصص کشیک بیمارستان؛ اولویت ویژه اعزام سریع صبحگاهی',
      },
      {
        code: '103',
        name: 'مهندس رضا چگنی',
        phone: '09163334455',
        address: 'خرم‌آباد، ماسور، بلوار بهارستان، کوچه سرو ۲',
        default_destination: 'دانشگاه لرستان و پارک علم و فناوری (کمالوند)',
        trips: 32,
        discount: 10,
        vip: 1,
        notes: 'عضو هیئت علمی دانشگاه لرستان؛ ارسال پیامک شماره پلاک برای ایشان',
      },
      {
        code: '104',
        name: 'سرکار خانم دکتر مرادی',
        phone: '09164445566',
        address: 'خرم‌آباد، گلدشت شرقی، میدان فردوسی، مجتمع شقایق',
        default_destination: 'بیمارستان شهدای عشایر خرم‌آباد',
        trips: 41,
        discount: 15,
        vip: 1,
        notes: 'جراح کشیک؛ ترجیحاً خودروهای استاندارد یا کامفورت کولردار',
      },
      {
        code: '105',
        name: 'حاج حسین گودرزی',
        phone: '09124441122',
        address: 'خرم‌آباد، روستای بهرامی، میدان ولایت، جنب مسجد جامع',
        default_destination: 'خرم‌آباد، بافت سنتی پشت‌بازار و قلعه فلک‌الافلاک',
        trips: 63,
        discount: 12,
        vip: 1,
        notes: 'مشتری پر سفر آژانس؛ تسویه نقدی یا کارت به کارت با راننده',
      },
      {
        code: '106',
        name: 'کربلایی احمد حیدری',
        phone: '09167778899',
        address: 'خرم‌آباد، روستای بهرامی، ورودی روستا، روبروی بهداری',
        default_destination: 'پایانه مسافربری جنوب (میدان شقایق)',
        trips: 22,
        discount: 10,
        vip: 1,
        notes: 'سفرهای بین شهری و ترمینال؛ اعزام سرویس در ساعت اعلامی',
      },
      {
        code: '107',
        name: 'خانم مهندس حسینی',
        phone: '09120001122',
        address: 'خرم‌آباد، میدان کیو، بلوار ولیعصر، کوچه نگارستان',
        default_destination: 'روستای بهرامی، دفتر دهیاری و شورا',
        trips: 26,
        discount: 10,
        vip: 1,
        notes: 'تردد هفتگی به دهیاری بهرامی',
      },
      {
        code: '108',
        name: 'دکتر حمید امینی',
        phone: '09120002233',
        address: 'خرم‌آباد، خیابان علوی، چهارراه شفا، ساختمان پزشکان',
        default_destination: 'بیمارستان تامین اجتماعی خرم‌آباد',
        trips: 35,
        discount: 10,
        vip: 1,
        notes: 'پزشک معتمد؛ هماهنگی تلفنی ۵ دقیقه قبل از رسیدن',
      },
    ];

    for (const sub of frequentSubscribers) {
      const existing = db.prepare('SELECT id FROM customers WHERE phone = ? OR subscription_code = ?').get(sub.phone, sub.code) as any;
      if (existing) {
        db.prepare(`
          UPDATE customers 
          SET subscription_code = ?, name = ?, address = ?, default_destination = ?, 
              total_trips = ?, discount_percent = ?, is_vip = ?, notes = ?
          WHERE id = ?
        `).run(sub.code, sub.name, sub.address, sub.default_destination, sub.trips, sub.discount, sub.vip, sub.notes, existing.id);
      } else {
        db.prepare(`
          INSERT INTO customers (
            subscription_code, name, phone, address, default_destination,
            total_trips, discount_percent, is_vip, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(sub.code, sub.name, sub.phone, sub.address, sub.default_destination, sub.trips, sub.discount, sub.vip, sub.notes);
      }
    }
  }

  // Create useful indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_trips_driver ON trips(driver_id);
    CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
    CREATE INDEX IF NOT EXISTS idx_night_shifts_date ON night_shifts(date);
    CREATE INDEX IF NOT EXISTS idx_night_shifts_driver ON night_shifts(driver_id);
    CREATE INDEX IF NOT EXISTS idx_ledger_driver ON driver_ledger(driver_id);
    CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_sms_logs_receptor ON sms_logs(receptor);
  `);

  seedInitialData();
  seedPoisAndRules();
  migrateToKhorramabadBahrami();
}

function migrateToKhorramabadBahrami() {
  const khorramabadCheck = db.prepare("SELECT count(*) as count FROM points_of_interest WHERE name LIKE '%بهرامی%' OR name LIKE '%خرم‌آباد%' OR name LIKE '%ماسور%'").get() as { count: number };
  if (khorramabadCheck.count > 10) {
    return;
  }

  console.log('Migrating and seeding Khorramabad & Bahrami village neighborhoods and fixed tariffs...');

  // 1. Clear old POIs and insert all Khorramabad neighborhoods with approved fixed rates
  db.prepare('DELETE FROM points_of_interest').run();
  const insertPoi = db.prepare(`
    INSERT INTO points_of_interest (name, category, address, lat, lng, fixed_price)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const khorramabadPOIs = [
    // Base & Southern areas
    ['روستای بهرامی (مقر تاکسی‌سرویس)', 'مقر آژانس', 'استان لرستان، شهرستان خرم‌آباد، روستای بهرامی، خیابان اصلی', 33.4360, 48.3610, 30000],
    ['فرودگاه بین‌المللی خرم‌آباد (شهید مدنی)', 'پایانه‌ها و فرودگاه', 'خرم‌آباد، کیلومتر ۳ جاده اندیمشک، جنب روستای بهرامی', 33.4380, 48.3530, 45000],
    ['ماسور (ورودی جنوب شهر)', 'محلات خرم‌آباد', 'خرم‌آباد، بلوار بهارستان، محله ماسور', 33.4440, 48.3580, 40000],
    ['بدرآباد علیا و سفلی', 'محلات خرم‌آباد', 'خرم‌آباد، ورودی جنوبی شهر، منطقه بدرآباد', 33.4310, 48.3690, 40000],
    ['پشته حسین‌آباد', 'محلات خرم‌آباد', 'خرم‌آباد، محله پشته حسین‌آباد، خیابان طیب', 33.4560, 48.3620, 55000],
    ['گلدشت شرقی', 'محلات خرم‌آباد', 'خرم‌آباد، بلوار ایران‌زمین، محله گلدشت شرقی', 33.4600, 48.3490, 60000],
    ['گلدشت غربی', 'محلات خرم‌آباد', 'خرم‌آباد، بلوار ارم، محله گلدشت غربی', 33.4620, 48.3420, 60000],
    ['کوی ارتش (میدان شقایق)', 'محلات خرم‌آباد', 'خرم‌آباد، میدان شقایق، بلوار شریعتی، کوی ارتش', 33.4680, 48.3520, 70000],
    ['ترمینال مسافربری جنوب (ترمینال شقایق)', 'پایانه‌ها و فرودگاه', 'خرم‌آباد، میدان شقایق، پایانه مسافربری جنوب', 33.4670, 48.3540, 65000],

    // Central & Historic districts
    ['اسدآبادی', 'محلات خرم‌آباد', 'خرم‌آباد، خیابان اسدآبادی، کوچه دادگستری', 33.4730, 48.3570, 75000],
    ['کوی فلسطین', 'محلات خرم‌آباد', 'خرم‌آباد، خیابان فلسطین، تقاطع بلوار شریعتی', 33.4710, 48.3480, 75000],
    ['بزرگمهر (کوروش)', 'محلات خرم‌آباد', 'خرم‌آباد، خیابان کوروش (بزرگمهر)، میدان امام خمینی', 33.4770, 48.3510, 80000],
    ['خیابان علوی و میدان امام حسین (ع)', 'محلات خرم‌آباد', 'خرم‌آباد، خیابان علوی، تقاطع ساحلی', 33.4800, 48.3530, 80000],
    ['قاضی‌آباد', 'محلات خرم‌آباد', 'خرم‌آباد، محله قاضی‌آباد، خیابان اصلی، بوستان معلم', 33.4760, 48.3680, 85000],
    ['میدان تیر', 'محلات خرم‌آباد', 'خرم‌آباد، محله میدان تیر، بلوار شهید چمران', 33.4820, 48.3710, 85000],
    ['پشت بازار (بافت کهن و تاریخی)', 'محلات خرم‌آباد', 'خرم‌آباد، بافت کهن پشت بازار، جنب بازار سنتی', 33.4840, 48.3500, 85000],
    ['درب دلاکان', 'محلات خرم‌آباد', 'خرم‌آباد، محله کهن درب دلاکان، خیابان فردوسی', 33.4850, 48.3520, 85000],
    ['سبزه‌میدان و قلعه فلک‌الافلاک', 'گردشگری و تاریخی', 'خرم‌آباد، خیابان امام خمینی، مجموعه تاریخی قلعه فلک‌الافلاک', 33.4860, 48.3540, 90000],
    ['میدان شهدا (مرکز شهر)', 'محلات خرم‌آباد', 'خرم‌آباد، میدان شهدا، تقاطع خیابان شهدای شرقی و غربی', 33.4880, 48.3550, 90000],
    ['خیابان شهید مطهری و سرچشمه', 'محلات خرم‌آباد', 'خرم‌آباد، خیابان شهید مطهری، چهارراه سرچشمه', 33.4910, 48.3570, 90000],
    ['بیمارستان شهید رحیمی', 'مراکز درمانی', 'خرم‌آباد، خیابان پل صفوی، مرکز آموزشی درمانی شهید رحیمی', 33.4870, 48.3510, 90000],
    ['بیمارستان شهدای عشایر خرم‌آباد', 'مراکز درمانی', 'خرم‌آباد، خیابان انقلاب، بیمارستان شهدای عشایر', 33.4950, 48.3530, 95000],
    ['میدان تختی و شیرخوارگاه', 'محلات خرم‌آباد', 'خرم‌آباد، میدان تختی، خیابان بعثت', 33.4930, 48.3480, 95000],

    // Northern & Western areas
    ['خیابان انقلاب و ناصرخسرو', 'محلات خرم‌آباد', 'خرم‌آباد، بلوار ناصرخسرو، تقاطع خیابان انقلاب', 33.4980, 48.3510, 95000],
    ['میدان کیو و دریاچه زیبای کیو', 'گردشگری و تفریحی', 'خرم‌آباد، بلوار ولیعصر، مجموعه گردشگری دریاچه کیو', 33.5040, 48.3520, 100000],
    ['کوی جهادگران', 'محلات خرم‌آباد', 'خرم‌آباد، بلوار جهادگران، بوستان فدک', 33.5100, 48.3450, 105000],
    ['کوی کارمندان و نگارستان', 'محلات خرم‌آباد', 'خرم‌آباد، خیابان نگارستان، کوی کارمندان فاز ۱ و ۲', 33.5120, 48.3510, 105000],
    ['کوی فرهنگیان', 'محلات خرم‌آباد', 'خرم‌آباد، بلوار ۶۰ متری، کوی فرهنگیان فاز ۱ و ۲', 33.5160, 48.3580, 110000],
    ['دره‌گرم (کوی امام رضا و بلوار ولایت)', 'محلات خرم‌آباد', 'خرم‌آباد، منطقه دره‌گرم، بلوار ولایت', 33.5250, 48.3590, 115000],
    ['فلک‌الدین (شمال غرب خرم‌آباد)', 'محلات خرم‌آباد', 'خرم‌آباد، انتهای خیابان انقلاب، محله فلک‌الدین', 33.5180, 48.3370, 115000],
    ['پایانه مسافربری شمال (ترمینال غرب)', 'پایانه‌ها و فرودگاه', 'خرم‌آباد، میدان شریعت، ابتدای محور خرم‌آباد به الشتر', 33.5280, 48.3530, 120000],

    // Eastern, Academic & Mountain areas
    ['دانشگاه لرستان و پارک علم و فناوری (کمالوند)', 'دانشگاه‌ها', 'خرم‌آباد، کیلومتر ۵ جاده بروجرد، سایت مرکزی دانشگاه لرستان', 33.4650, 48.4200, 120000],
    ['دانشگاه علوم پزشکی لرستان (سایت کمالوند)', 'دانشگاه‌ها', 'خرم‌آباد، جاده کمالوند، پردیس دانشگاه علوم پزشکی', 33.4680, 48.4150, 120000],
    ['ترمینال مسافربری شرق (میدان آیت‌الله بروجردی)', 'پایانه‌ها و فرودگاه', 'خرم‌آباد، میدان آیت‌الله بروجردی، محور خروجی بروجرد و تهران', 33.4750, 48.3950, 110000],
    ['بیمارستان تامین اجتماعی خرم‌آباد', 'مراکز درمانی', 'خرم‌آباد، کوی لاله، بیمارستان تامین اجتماعی', 33.4600, 48.3850, 95000],
    ['بام لرستان (رصدخانه کاسین و پارک جنگلی)', 'گردشگری و تفریحی', 'خرم‌آباد، مجتمع تفریحی و گردشگری بام لرستان', 33.4780, 48.3750, 100000],
  ];

  for (const item of khorramabadPOIs) {
    insertPoi.run(item[0], item[1], item[2], item[3], item[4], item[5]);
  }

  // 2. Update Agency Settings
  const updateSetting = db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, datetime('now', 'localtime'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now', 'localtime')
  `);
  updateSetting.run('agency_name', 'تاکسی سرویس بهرامی خرم‌آباد');
  updateSetting.run('agency_province', 'لرستان');
  updateSetting.run('agency_city', 'خرم‌آباد');
  updateSetting.run('agency_village', 'روستای بهرامی');
  updateSetting.run('phone', '۰۶۶-۳۳۴۴۰۰۰۰');
  updateSetting.run('address', 'استان لرستان، شهرستان خرم‌آباد، روستای بهرامی، خیابان اصلی (جنب فرودگاه بین‌المللی خرم‌آباد)');
  updateSetting.run('working_hours', '۲۴ ساعته (سرویس‌دهی شبانه‌روزی به کلیه محله‌های خرم‌آباد با نرخ مصوب)');

  // 3. Update Zones
  try {
    db.prepare('DELETE FROM tariffs').run();
    db.prepare('DELETE FROM zones').run();
  } catch {}

  const insertZone = db.prepare(`
    INSERT INTO zones (id, name, description, is_active)
    VALUES (?, ?, ?, 1)
  `);
  insertZone.run(1, 'مقر تاکسی‌سرویس (روستای بهرامی)', 'مبدأ مرکزی آژانس در روستای بهرامی و حوزه فرودگاه');
  insertZone.run(2, 'منطقه ۱: ماسور، فرودگاه و بدرآباد', 'ورودی جنوبی شهر خرم‌آباد');
  insertZone.run(3, 'منطقه ۲: گلدشت شرقی و غربی، پشته حسین‌آباد، شقایق', 'جنوب و جنوب غربی شهر');
  insertZone.run(4, 'منطقه ۳: اسدآبادی، بزرگمهر، علوی، قاضی‌آباد', 'محله‌های میانی و شرقی');
  insertZone.run(5, 'منطقه ۴: مرکز شهر (شهدا، سبزه‌میدان، فلک‌الافلاک)', 'هسته مرکزی و بافت تاریخی');
  insertZone.run(6, 'منطقه ۵: میدان کیو، دریاچه کیو، انقلاب، ناصرخسرو', 'شمال مرکزی و تفریحی');
  insertZone.run(7, 'منطقه ۶: دره‌گرم، فلک‌الدین، جهادگران، فرهنگیان', 'شمال و شمال غربی خرم‌آباد');
  insertZone.run(8, 'منطقه ۷: کمالوند (دانشگاه لرستان، علوم پزشکی، ترمینال شرق)', 'شرق خرم‌آباد و مراکز دانشگاهی');

  // 4. Update Tariffs from Bahrami (Zone 1) to all Khorramabad Zones
  const insertTariff = db.prepare(`
    INSERT INTO tariffs (
      origin_zone_id, destination_zone_id, base_price, night_price, holiday_price,
      waiting_fee_per_min, stop_fee, extra_distance_fee_per_km, vehicle_type, commission_rate, fixed_commission
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertTariff.run(1, 2, 40000, 50000, 48000, 1500, 15000, 5000, 'STANDARD', 0.15, 0); // Zone 1 -> Zone 2 (Masoor/Airport)
  insertTariff.run(1, 3, 65000, 80000, 75000, 1500, 20000, 6000, 'STANDARD', 0.15, 0); // Zone 1 -> Zone 3 (Goldasht/Shaghayegh)
  insertTariff.run(1, 4, 80000, 95000, 90000, 2000, 25000, 6000, 'STANDARD', 0.15, 0); // Zone 1 -> Zone 4 (Alavi/Ghaziabad)
  insertTariff.run(1, 5, 90000, 110000, 100000, 2000, 25000, 7000, 'STANDARD', 0.15, 0); // Zone 1 -> Zone 5 (Shohada/Castle)
  insertTariff.run(1, 6, 100000, 120000, 115000, 2000, 30000, 7000, 'STANDARD', 0.15, 0); // Zone 1 -> Zone 6 (Kio Lake)
  insertTariff.run(1, 7, 115000, 140000, 130000, 2500, 30000, 8000, 'STANDARD', 0.15, 0); // Zone 1 -> Zone 7 (Dareh-Garm)
  insertTariff.run(1, 8, 120000, 145000, 135000, 2500, 35000, 8000, 'STANDARD', 0.15, 0); // Zone 1 -> Zone 8 (Kamalvand Uni)

  // 5. Update Pricing Rules
  try {
    db.prepare('DELETE FROM pricing_rules').run();
    const insertRule = db.prepare(`
      INSERT INTO pricing_rules (rule_type, title, base_price, per_km_price, night_multiplier, holiday_multiplier, commission_rate)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertRule.run('POI', 'نرخ مصوب ثابت همه محله‌های خرم‌آباد از مبدأ روستای بهرامی', 0, 0, 1.2, 1.25, 0.15);
    insertRule.run('FIXED_ROUTE', 'نرخ مسیرهای ویژه بین محلات خرم‌آباد', 75000, 0, 1.2, 1.25, 0.15);
    insertRule.run('ZONE', 'نرخ‌گذاری مناطق ۸ گانه شهری خرم‌آباد', 45000, 6000, 1.2, 1.25, 0.15);
    insertRule.run('KM', 'محاسبه کیلومتری برون‌شهری و حومه خرم‌آباد', 40000, 7500, 1.2, 1.25, 0.15);
  } catch {}

  // 6. Update Drivers default locations and addresses to Bahrami & Khorramabad
  try {
    db.prepare(`
      UPDATE drivers
      SET lat = 33.4365, lng = 48.3610, city = 'خرم‌آباد', address = 'خرم‌آباد، روستای بهرامی، خیابان اصلی، پلاک ۱۲'
      WHERE id = 1
    `).run();
    db.prepare(`
      UPDATE drivers
      SET lat = 33.4445, lng = 48.3575, city = 'خرم‌آباد', address = 'خرم‌آباد، محله ماسور، بلوار بهارستان ۴'
      WHERE id = 2
    `).run();
    db.prepare(`
      UPDATE drivers
      SET lat = 33.4685, lng = 48.3515, city = 'خرم‌آباد', address = 'خرم‌آباد، گلدشت شرقی، بلوار ایران‌زمین'
      WHERE id = 3
    `).run();
    db.prepare(`
      UPDATE drivers
      SET lat = 33.4865, lng = 48.3545, city = 'خرم‌آباد', address = 'خرم‌آباد، میدان شهدا، خیابان شهدای شرقی'
      WHERE id = 4
    `).run();
  } catch {}

  // 7. Update sample trips to Khorramabad locations
  try {
    db.prepare(`
      UPDATE trips
      SET origin = 'خرم‌آباد، روستای بهرامی (دفتر تاکسی‌سرویس)',
          destination = 'خرم‌آباد، سبزه میدان و قلعه فلک‌الافلاک',
          price = 90000, commission = 13500, driver_share = 76500
      WHERE id = 1
    `).run();
    db.prepare(`
      UPDATE trips
      SET origin = 'خرم‌آباد، روستای بهرامی',
          destination = 'فرودگاه بین‌المللی خرم‌آباد (شهید مدنی)',
          price = 45000, commission = 6750, driver_share = 38250
      WHERE id = 2
    `).run();
    db.prepare(`
      UPDATE trips
      SET origin = 'خرم‌آباد، روستای بهرامی',
          destination = 'خرم‌آباد، میدان کیو و دریاچه کیو',
          price = 100000, commission = 15000, driver_share = 85000
      WHERE id = 3
    `).run();
    db.prepare(`
      UPDATE trips
      SET origin = 'خرم‌آباد، محله ماسور، خیابان بهارستان',
          destination = 'بیمارستان شهدای عشایر خرم‌آباد',
          price = 95000, commission = 14250, driver_share = 80750
      WHERE id = 4
    `).run();
    db.prepare(`
      UPDATE trips
      SET origin = 'خرم‌آباد، روستای بهرامی',
          destination = 'خرم‌آباد، منطقه دره‌گرم، بلوار ولایت',
          price = 115000, commission = 17250, driver_share = 97750
      WHERE id = 5
    `).run();
  } catch {}

  console.log('Successfully configured Khorramabad, Bahrami village, and all approved neighborhood tariffs.');
}

function seedPoisAndRules() {
  const poiCount = db.prepare('SELECT count(*) as count FROM points_of_interest').get() as { count: number };
  if (poiCount.count === 0) {
    const insertPoi = db.prepare(`
      INSERT INTO points_of_interest (name, category, address, lat, lng, fixed_price)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertPoi.run('روستای بهرامی (مقر تاکسی‌سرویس)', 'مقر آژانس', 'استان لرستان، شهرستان خرم‌آباد، روستای بهرامی', 33.4360, 48.3610, 30000);
    insertPoi.run('فرودگاه بین‌المللی خرم‌آباد (شهید مدنی)', 'پایانه‌ها و فرودگاه', 'خرم‌آباد، کیلومتر ۳ جاده اندیمشک، جنب روستای بهرامی', 33.4380, 48.3530, 45000);
    insertPoi.run('ماسور (ورودی جنوب شهر)', 'محلات خرم‌آباد', 'خرم‌آباد، بلوار بهارستان، محله ماسور', 33.4440, 48.3580, 40000);
    insertPoi.run('میدان شهدا (مرکز شهر)', 'محلات خرم‌آباد', 'خرم‌آباد، میدان شهدا', 33.4880, 48.3550, 90000);
    insertPoi.run('سبزه‌میدان و قلعه فلک‌الافلاک', 'گردشگری و تاریخی', 'خرم‌آباد، خیابان امام خمینی', 33.4860, 48.3540, 90000);
    insertPoi.run('میدان کیو و دریاچه زیبای کیو', 'گردشگری و تفریحی', 'خرم‌آباد، میدان کیو', 33.5040, 48.3520, 100000);
  }

  const rulesCount = db.prepare('SELECT count(*) as count FROM pricing_rules').get() as { count: number };
  if (rulesCount.count === 0) {
    const insertRule = db.prepare(`
      INSERT INTO pricing_rules (rule_type, title, base_price, per_km_price, night_multiplier, holiday_multiplier, commission_rate)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertRule.run('POI', 'نرخ ثابت همه محله‌های خرم‌آباد از مبدأ روستای بهرامی', 0, 0, 1.2, 1.25, 0.15);
    insertRule.run('FIXED_ROUTE', 'نرخ مسیرهای ویژه بین محلات خرم‌آباد', 75000, 0, 1.2, 1.25, 0.15);
    insertRule.run('ZONE', 'نرخ‌گذاری مناطق ۸ گانه خرم‌آباد', 45000, 6000, 1.2, 1.25, 0.15);
    insertRule.run('KM', 'محاسبه کیلومتری برون‌شهری و حومه خرم‌آباد', 40000, 7500, 1.2, 1.25, 0.15);
  }

  const smsCount = db.prepare('SELECT count(*) as count FROM sms_logs').get() as { count: number };
  if (smsCount.count === 0) {
    const insertSms = db.prepare(`
      INSERT INTO sms_logs (receptor, template_name, token, message, status, cost)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertSms.run('09127778899', 'welcome_driver', 'علی رضایی', 'علی رضایی گرامی، مدارک شما در آژانس تاکسی پردیس تایید گردید. هم‌اکنون می‌توانید آنلاین شوید.', 'DELIVERED', 120);
    insertSms.run('09126665544', 'new_trip_assigned', 'TRP-1004', 'سفر جدید TRP-1004 از مبدا فاز ۴ به مقصد فاز ۱ برای شما ارسال شد.', 'DELIVERED', 120);
    insertSms.run('09121112233', 'admin_alert', 'مدیریت', 'راننده جدید مدارک خود را در سامانه ثبت نمود. لطفاً بررسی فرمایید.', 'DELIVERED', 120);
  }

  // Update default coordinates for seeded drivers
  try {
    db.prepare('UPDATE drivers SET lat = 35.7385, lng = 51.8140, wallet_balance = 220000, documents_verified = 1 WHERE id = 1').run();
    db.prepare('UPDATE drivers SET lat = 35.7410, lng = 51.8210, wallet_balance = 175000, documents_verified = 1 WHERE id = 2').run();
    db.prepare('UPDATE drivers SET lat = 35.7305, lng = 51.7960, wallet_balance = 85000, documents_verified = 1 WHERE id = 3').run();
    db.prepare('UPDATE drivers SET lat = 35.7190, lng = 51.8470, wallet_balance = 45000, documents_verified = 0 WHERE id = 4').run();
  } catch {}
}

function seedInitialData() {
  const usersCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
  if (usersCount.count > 0) {
    return;
  }

  console.log('Seeding initial Pardis Taxi data...');

  // 1. Insert Users (Password hashes are simple reproducible tokens for dev)
  const insertUser = db.prepare(`
    INSERT INTO users (mobile, password_hash, full_name, role, avatar)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertUser.run('09121112233', 'admin123', 'مهندس علوی (مدیر آژانس)', 'ADMIN', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop');
  insertUser.run('09123334455', 'operator123', 'خانم سهرابی (اپراتور شیفت)', 'OPERATOR', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop');
  insertUser.run('09127778899', 'driver123', 'علی رضایی', 'DRIVER', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop');
  insertUser.run('09126665544', 'driver123', 'محمد صادقی', 'DRIVER', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop');
  insertUser.run('09125556677', 'driver123', 'رضا کریمی', 'DRIVER', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop');
  insertUser.run('09124443322', 'driver123', 'حسین موسوی', 'DRIVER', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop');

  // 2. Insert Drivers
  const insertDriver = db.prepare(`
    INSERT INTO drivers (user_id, national_code, birth_date, address, city, emergency_contact, status, rating, completed_trips, total_debt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertDriver.run(3, '0012345678', '1365/04/12', 'پردیس، فاز ۲، خیابان نخلستان، پلاک ۱۲', 'پردیس', '09129998877', 'ONLINE', 4.9, 142, 225000);
  insertDriver.run(4, '0023456789', '1368/08/21', 'پردیس، فاز ۴، فردوس ۴، بلوک ۸', 'پردیس', '09128887766', 'BUSY', 4.8, 98, 180000);
  insertDriver.run(5, '0034567890', '1370/02/15', 'پردیس، فاز ۱، خیابان فروردین جنوبی', 'پردیس', '09127776655', 'OFFLINE', 4.7, 75, 90000);
  insertDriver.run(6, '0045678901', '1372/11/03', 'پردیس، فاز ۳، خیابان معلم، کوچه یاس', 'پردیس', '09126665544', 'PENDING', 5.0, 0, 0);

  // 3. Insert Vehicles
  const insertVehicle = db.prepare(`
    INSERT INTO vehicles (driver_id, car_name, model, color, license_plate, year, vehicle_type, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertVehicle.run(1, 'پژو پارس', 'TU5', 'سفید', '۱۲ ج ۳۴۵ ایران ۲۲', '۱۴۰۱', 'STANDARD', 1);
  insertVehicle.run(2, 'سمند سورن', 'ELX پلاس', 'نوک مدادی', '۴۵ ب ۶۷۸ ایران ۲۲', '۱۴۰۲', 'STANDARD', 1);
  insertVehicle.run(3, 'تارا', 'V1 اتوماتیک', 'نقره‌ای', '۷۸ د ۹۰۱ ایران ۲۲', '۱۴۰۲', 'COMFORT', 1);
  insertVehicle.run(4, 'دنا پلاس', 'توربو', 'مشکی', '۳۳ ص ۲۱۴ ایران ۳۳', '۱۴۰۳', 'COMFORT', 1);

  // 4. Insert Customers
  const insertCustomer = db.prepare(`
    INSERT INTO customers (name, phone, address, total_trips)
    VALUES (?, ?, ?, ?)
  `);
  insertCustomer.run('خانم حسینی', '09120001122', 'پردیس، فاز ۱، پاساژ گلستان', 18);
  insertCustomer.run('آقای دکتر امینی', '09120002233', 'پردیس، فاز ۲، درمانگاه شفا', 24);
  insertCustomer.run('مهندس کاظمی', '09120003344', 'پردیس، پارک فناوری پردیس', 35);
  insertCustomer.run('خانم رضوانی', '09120004455', 'پردیس، فاز ۸، مجتمع مهستان', 12);

  // 5. Insert Zones
  const insertZone = db.prepare(`
    INSERT INTO zones (name, description, is_active)
    VALUES (?, ?, ?)
  `);
  insertZone.run('مرکز آژانس (پردیس فاز ۱ و ۲)', 'هسته مرکزی شهر پردیس', 1);
  insertZone.run('پردیس فاز ۴ و ۸', 'مناطق مسکونی فازهای غربی و شرقی', 1);
  insertZone.run('پارک فناوری پردیس', 'مجموعه شرکت‌های دانش‌بنیان و نوآوری', 1);
  insertZone.run('فرودگاه بین‌المللی امام خمینی', 'سرویس‌های تشریفاتی و فرودگاهی ویژه', 1);
  insertZone.run('فرودگاه مهرآباد تهران', 'ترمینال‌های ۱ تا ۶ مهرآباد', 1);
  insertZone.run('ترمینال شرق تهران (تهرانپارس)', 'مسیرهای متداول شهری به تهران', 1);
  insertZone.run('مرکز درمانی و بیمارستان شفا', 'بیمارستان تخصصی پردیس', 1);

  // 6. Insert Tariffs
  const insertTariff = db.prepare(`
    INSERT INTO tariffs (
      origin_zone_id, destination_zone_id, base_price, night_price, holiday_price,
      waiting_fee_per_min, stop_fee, extra_distance_fee_per_km, vehicle_type, commission_rate, fixed_commission
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  // Zone 1 -> Zone 4 (Airport IKA)
  insertTariff.run(1, 4, 850000, 1050000, 950000, 3000, 50000, 10000, 'STANDARD', 0.15, 0);
  // Zone 1 -> Zone 5 (Mehrabad)
  insertTariff.run(1, 5, 500000, 650000, 580000, 2500, 40000, 8000, 'STANDARD', 0.15, 0);
  // Zone 1 -> Zone 6 (East Terminal)
  insertTariff.run(1, 6, 280000, 350000, 320000, 2000, 30000, 7000, 'STANDARD', 0.15, 0);
  // Zone 1 -> Zone 3 (Tech Park)
  insertTariff.run(1, 3, 140000, 180000, 160000, 1500, 20000, 6000, 'STANDARD', 0.15, 0);
  // Zone 1 -> Zone 2 (Phase 4/8)
  insertTariff.run(1, 2, 95000, 120000, 110000, 1500, 15000, 5000, 'STANDARD', 0.15, 0);

  // 7. Insert Sample Trips
  const insertTrip = db.prepare(`
    INSERT INTO trips (
      trip_number, customer_id, customer_name, customer_phone, origin, destination,
      driver_id, vehicle_id, trip_date, trip_time, service_type, price, commission,
      driver_share, status, payment_method, notes, is_night_shift, created_by_user_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertTrip.run('TRP-1001', 1, 'خانم حسینی', '09120001122', 'پردیس، فاز ۱، میدان عدالت', 'فرودگاه امام خمینی', 1, 1, '1403/06/14', '07:30', 'فرودگاهی', 850000, 127500, 722500, 'COMPLETED', 'CASH', 'پرواز ساعت ۱۱', 0, 2);
  insertTrip.run('TRP-1002', 2, 'آقای دکتر امینی', '09120002233', 'درمانگاه شفا پردیس', 'ترمینال شرق تهران', 1, 1, '1403/06/14', '10:15', 'استاندارد', 280000, 42000, 238000, 'COMPLETED', 'CASH', 'عجله دارند', 0, 2);
  insertTrip.run('TRP-1003', 3, 'مهندس کاظمی', '09120003344', 'پارک فناوری پردیس', 'فرودگاه مهرآباد', 2, 2, '1403/06/14', '14:00', 'تشریفات', 500000, 75000, 425000, 'IN_PROGRESS', 'CASH', 'جلسه کاری', 0, 2);
  insertTrip.run('TRP-1004', 4, 'خانم رضوانی', '09120004455', 'پردیس، فاز ۴، فردوس ۴', 'پردیس فاز ۱، پاساژ گلستان', 1, 1, '1403/06/14', '16:45', 'استاندارد', 95000, 14250, 80750, 'ASSIGNED', 'CASH', 'یک بسته خرید', 0, 2);
  insertTrip.run('TRP-1005', 1, 'خانم حسینی', '09120001122', 'پردیس فاز ۲، گلزار', 'بیمارستان شفا', null, null, '1403/06/14', '17:30', 'استاندارد', 90000, 13500, 76500, 'REQUESTED', 'CASH', 'نیاز به راننده صبور', 0, 2);

  // 8. Insert Driver Ledger
  const insertLedger = db.prepare(`
    INSERT INTO driver_ledger (driver_id, trip_id, type, amount, balance_after, description, reference_number)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertLedger.run(1, 1, 'COMMISSION_DEBT', 127500, 127500, 'کمیسیون سفر TRP-1001 (فرودگاه امام)', 'REF-1001');
  insertLedger.run(1, 2, 'COMMISSION_DEBT', 42000, 169500, 'کمیسیون سفر TRP-1002 (ترمینال شرق)', 'REF-1002');
  insertLedger.run(1, null, 'COMMISSION_DEBT', 55500, 225000, 'کمیسیون سفرهای پیشین', 'REF-PREV');
  insertLedger.run(2, null, 'COMMISSION_DEBT', 180000, 180000, 'مانده کمیسیون دوره‌ای راننده', 'REF-INIT2');
  insertLedger.run(3, null, 'COMMISSION_DEBT', 90000, 90000, 'مانده کمیسیون دوره‌ای راننده', 'REF-INIT3');

  // 9. Night Shifts
  const insertShift = db.prepare(`
    INSERT INTO night_shifts (date, driver_id, start_time, end_time, status, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertShift.run('1403/06/14', 1, '22:00', '06:00', 'SCHEDULED', 'شیفت شب امشب - علی رضایی آماده‌باش کامل');
  insertShift.run('1403/06/15', 2, '22:00', '06:00', 'SCHEDULED', 'شیفت فردا شب - محمد صادقی');
  insertShift.run('1403/06/13', 3, '22:00', '06:00', 'COMPLETED', 'شیفت دیشب با ۴ سفر موفق انجام شد');

  // 10. Conversations & Messages
  const insertConv = db.prepare(`
    INSERT INTO conversations (type, title, trip_id)
    VALUES (?, ?, ?)
  `);
  const convGeneral = insertConv.run('GROUP', 'گروه رانندگان و مدیریت آژانس', null).lastInsertRowid;
  const convDirect1 = insertConv.run('DIRECT', 'مدیریت و علی رضایی', null).lastInsertRowid;
  const convTrip1 = insertConv.run('TRIP', 'گفتگوی سفر TRP-1003', 3).lastInsertRowid;

  const insertMember = db.prepare(`
    INSERT INTO conversation_members (conversation_id, user_id, role)
    VALUES (?, ?, ?)
  `);
  // Group
  insertMember.run(convGeneral, 1, 'ADMIN');
  insertMember.run(convGeneral, 2, 'OPERATOR');
  insertMember.run(convGeneral, 3, 'DRIVER');
  insertMember.run(convGeneral, 4, 'DRIVER');
  insertMember.run(convGeneral, 5, 'DRIVER');

  // Direct 1
  insertMember.run(convDirect1, 1, 'ADMIN');
  insertMember.run(convDirect1, 3, 'DRIVER');

  // Trip 1
  insertMember.run(convTrip1, 2, 'OPERATOR');
  insertMember.run(convTrip1, 4, 'DRIVER');

  const insertMsg = db.prepare(`
    INSERT INTO messages (conversation_id, sender_id, content, is_read)
    VALUES (?, ?, ?, ?)
  `);
  insertMsg.run(convGeneral, 1, 'سلام به همه همکاران گرامی. لطفاً در ساعات پیک آمادگی کامل برای پذیرش سفر داشته باشید.', 1);
  insertMsg.run(convGeneral, 3, 'سلام مهندس علوی، خسته نباشید. تمام ناوگان فعال است.', 1);
  insertMsg.run(convDirect1, 1, 'آقای رضایی شیفت شب امشب برای شما ثبت شد. لطفاً تا ساعت ۲۱:۴۵ در آژانس حاضر باشید.', 1);
  insertMsg.run(convDirect1, 3, 'چشم مهندس، باک بنزین کامل است و سر ساعت در محل حاضر خواهم بود.', 0);
  insertMsg.run(convTrip1, 2, 'آقای صادقی، مسافر سفر TRP-1003 جلوی ورودی درب ۳ منتظر است.', 1);
  insertMsg.run(convTrip1, 4, 'ممنون خانم سهرابی، مسافر سوار شدند و به سمت مهرآباد در حال حرکت هستیم.', 0);

  // 11. Notifications
  const insertNotification = db.prepare(`
    INSERT INTO notifications (user_id, role, type, title, message, link, is_read)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertNotification.run(3, 'DRIVER', 'NEW_SHIFT', 'تعیین شیفت شب', 'شما به عنوان راننده شیفت شب تاریخ ۱۴۰۳/۰۶/۱۴ انتخاب شده‌اید.', '/driver/shifts', 0);
  insertNotification.run(3, 'DRIVER', 'ASSIGNED_TRIP', 'تخصیص سفر جدید', 'سفر شماره TRP-1004 به شما تخصیص داده شد.', '/driver/trips', 0);
  insertNotification.run(1, 'ADMIN', 'ANNOUNCEMENT', 'درخواست ثبت‌نام راننده جدید', 'یک راننده جدید (حسین موسوی) مدارک خود را جهت بررسی ارسال کرد.', '/admin/drivers', 0);

  // 12. Settings
  const insertSetting = db.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
  `);
  insertSetting.run('agency_name', 'آژانس تاکسی پردیس');
  insertSetting.run('logo_url', '/icon.svg');
  insertSetting.run('phone', '021-76280000');
  insertSetting.run('address', 'تهران، شهر جدید پردیس، فاز ۱، میدان عدالت، مجتمع تجاری پردیس، پلاک ۴');
  insertSetting.run('working_hours', '۲۴ ساعته (سرویس‌دهی شبانه‌روزی)');
  insertSetting.run('default_commission_rate', '0.15');
  insertSetting.run('night_shift_start', '22:00');
  insertSetting.run('night_shift_end', '06:00');
  insertSetting.run('night_tariff_multiplier', '1.25');
  insertSetting.run('payment_gateway_name', 'سامان کیش (SEP)');
  insertSetting.run('payment_merchant_id', 'SEP-MCH-884920');
  insertSetting.run('payment_callback_url', '/api/payments/verify');
  insertSetting.run('enable_auto_dispatch', 'false');

  // 13. Audit Log
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, action, entity, entity_id, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertAudit.run(1, 'مهندس علوی', 'INITIALIZE', 'SYSTEM', '1', 'سامانه مدیریت آژانس تاکسی پردیس با موفقیت راه‌اندازی و پیکربندی اولیه شد.');
  insertAudit.run(2, 'خانم سهرابی', 'CREATE_TRIP', 'TRIP', 'TRP-1004', 'ثبت سفر جدید برای خانم رضوانی');
  insertAudit.run(1, 'مهندس علوی', 'ASSIGN_SHIFT', 'NIGHT_SHIFT', '1', 'تخصیص شیفت شب تاریخ ۱۴۰۳/۰۶/۱۴ به راننده علی رضایی');

  console.log('Seed data inserted successfully.');
}
