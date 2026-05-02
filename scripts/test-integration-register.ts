import { ManusRegister } from '../server/registration';
import * as dotenv from 'dotenv';

dotenv.config();

async function runTest() {
  console.log('🚀 开始集成注册测试 (使用本地 EzSolver + Worldpool)...');
  
  const testEmail = `manus_test_${Math.random().toString(36).substring(2, 8)}@outlook.com`;
  const testPassword = 'TestPassword123!';
  
  console.log(`📧 测试邮箱: ${testEmail}`);
  
  // 初始化注册器，不提供 yesCaptchaKey 以强制使用本地 EzSolver
  const register = new ManusRegister({
    email: testEmail,
    password: testPassword,
    emailApiUrl: 'http://localhost:3002/api/mock-email', // 这里由于是测试，我们关注验证码绕过和代理获取
    yesCaptchaKey: '' 
  });

  try {
    // 我们手动触发前几个关键步骤来验证集成是否生效
    console.log('\n--- 步骤 1: 验证代理获取 ---');
    // @ts-ignore - 访问私有方法进行测试
    await register.fetchProxy();
    // @ts-ignore
    console.log(`📡 当前代理状态: ${register.proxyUrl || '未获取到 (可能 Worldpool 还在校验中)'}`);

    console.log('\n--- 步骤 2: 验证 EzSolver 解决验证码 ---');
    console.log('⏳ 正在请求本地 EzSolver 解决 Turnstile (这可能需要 30-60 秒)...');
    const token = await register.solveTurnstile();
    console.log(`✅ 成功获取 Turnstile Token (长度: ${token.length})`);
    
    console.log('\n🎉 集成测试核心环节通过！EzSolver 能够正常工作。');
    
  } catch (error: any) {
    console.error('\n❌ 测试失败:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 请确保 EzSolver (8191) 和 Worldpool (8080) 服务已启动。');
    }
  }
}

runTest();
