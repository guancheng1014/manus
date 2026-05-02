import { getDb, upsertUser } from '../server/db';
import { updatePasswordHash, getOrCreateSecuritySettings } from '../server/db/settings';

async function addUser() {
  console.log('Starting to add normal user...');
  const userEmail = 'user@manus.im';
  const userPassword = 'user123';
  
  try {
    // 1. 创建或更新用户基本信息
    await upsertUser({
      email: userEmail,
      name: 'Normal User',
      role: 'user',
      loginMethod: 'local',
    });
    
    // 2. 获取用户 ID
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    const { users } = await import('../drizzle/schema');
    const { eq } = await import('drizzle-orm');
    const result = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
    const normalUser = result[0];
    
    if (!normalUser) throw new Error('Failed to find created user');
    
    // 3. 确保安全设置存在并设置密码
    await getOrCreateSecuritySettings(normalUser.id);
    await updatePasswordHash(normalUser.id, userPassword);
    
    console.log('User added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to add user:', error);
    process.exit(1);
  }
}

addUser();
