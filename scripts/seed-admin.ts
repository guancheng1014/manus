import { getDb, upsertUser } from '../server/db';
import { updatePasswordHash, getOrCreateSecuritySettings } from '../server/db/settings';

async function seed() {
  console.log('Starting to seed admin user...');
  const adminEmail = 'admin@manus.im';
  const adminPassword = 'admin123';
  
  try {
    // 1. 创建或更新用户基本信息
    await upsertUser({
      email: adminEmail,
      name: 'System Admin',
      role: 'admin',
      loginMethod: 'local',
    });
    
    // 2. 获取用户 ID
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    const { users } = await import('../drizzle/schema');
    const { eq } = await import('drizzle-orm');
    const result = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
    const adminUser = result[0];
    
    if (!adminUser) throw new Error('Failed to find created admin user');
    
    // 3. 确保安全设置存在并设置密码
    await getOrCreateSecuritySettings(adminUser.id);
    await updatePasswordHash(adminUser.id, adminPassword);
    
    console.log('Admin user seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed admin user:', error);
    process.exit(1);
  }
}

seed();
