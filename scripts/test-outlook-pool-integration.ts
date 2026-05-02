import * as outlookCreator from '../server/services/outlookCreator';
import { db } from '../server/db';
import { emailPool } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

async function runTest() {
  console.log('🚀 开始 Outlook 注册与邮箱库集成测试...');
  
  try {
    // 1. 模拟调用批量注册逻辑
    console.log('⏳ 正在模拟创建 2 个 Outlook 账号...');
    const accounts = await outlookCreator.createOutlookAccountsBatch(2);
    console.log(`✅ 成功创建 ${accounts.length} 个账号`);

    // 2. 模拟 verificationRouter 中的保存逻辑
    console.log('📥 正在将账号保存到邮箱库...');
    for (const acc of accounts) {
      if (acc.status === 'success' && acc.email && acc.password) {
        await db.insert(emailPool).values({
          email: acc.email,
          password: acc.password,
          source: 'test_integration',
          status: 'available',
        });
        console.log(`   + 已入库: ${acc.email}`);
      }
    }

    // 3. 验证数据库中是否存在
    console.log('🔍 正在从数据库验证入库结果...');
    const results = await db.select().from(emailPool).where(eq(emailPool.source, 'test_integration'));
    
    if (results.length >= 2) {
      console.log(`\n🎉 集成测试圆满成功！数据库中已找到 ${results.length} 个测试账号。`);
    } else {
      console.error('\n❌ 测试失败：数据库中未找到预期的账号记录。');
    }

  } catch (error: any) {
    console.error('\n❌ 测试运行出错:', error.message);
  }
}

runTest();
