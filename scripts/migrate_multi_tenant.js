// 🚀 Database Migration Script for Multi-Tenant Medical Batch Platform
import { supabase } from '../lib/supabase.js';

async function runMigration() {
  console.log('🚀 Running Multi-Tenant Database Migration on Supabase...');

  // 1. Create table users if not exists
  // We can test if table exists by selecting, or create via standard insert/check
  const { data: testUsers, error: usersErr } = await supabase.from('users').select('*').limit(1);
  if (usersErr && usersErr.code === '42P01') {
    console.log('⚠️ Table `users` does not exist yet. Please run the SQL schema in Supabase SQL Editor.');
  }

  // Let's ensure Dr. Abdullah is recorded as Admin in users
  const { error: upsertErr } = await supabase.from('users').upsert({
    telegram_id: 1191760477,
    full_name: 'د. عبدالله (المؤسس والمدير)',
    username: 'AbdallahPro',
    role: 'admin',
    subscription_status: 'lifetime',
    trial_ends_at: new Date(Date.now() + 3650 * 24 * 3600 * 1000).toISOString(),
    subscription_ends_at: new Date(Date.now() + 3650 * 24 * 3600 * 1000).toISOString()
  });

  if (upsertErr) {
    console.log('Users table upsert note:', upsertErr.message);
  } else {
    console.log('✅ Admin Dr. Abdullah registered as Lifetime Super Admin in users table!');
  }

  process.exit(0);
}

runMigration().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
