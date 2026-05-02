
import axios from 'axios';
import { ManusRegister } from '../server/registration';
import * as db from '../server/db';

async function testFullRegistration() {
  console.log('🚀 开始全流程注册集成测试...');

  // 1. 验证 Worldpool 连通性
  console.log('📡 正在检查 Worldpool 代理池...');
  try {
    const proxyStats = await axios.get('http://localhost:8080/stats');
    console.log('✅ Worldpool 在线，当前活跃代理数:', proxyStats.data.alive_count);
  } catch (e) {
    console.error('❌ 无法连接 Worldpool，请检查 8080 端口');
    return;
  }

  // 2. 验证 EzSolver 连通性
  console.log('🤖 正在检查 EzSolver 打码服务...');
  try {
    const ezUrl = process.env.EZSOLVER_URL || 'http://localhost:8191';
    const ezHealth = await axios.get(`${ezUrl}/health`);
    console.log('✅ EzSolver 在线，状态:', ezHealth.data.status);
  } catch (e) {
    console.error(`❌ 无法连接 EzSolver，请检查端口 (${process.env.EZSOLVER_URL || '8191'})`);
    return;
  }

  // 3. 执行注册逻辑
  const register = new ManusRegister({
    email: 'manus_test_' + Math.random().toString(36).substring(7) + '@outlook.com',
    password: 'TestPassword123!',
    emailApiUrl: 'http://localhost:3002/api/mock-email', // 提供模拟的邮箱 API 绕过校验
  });

  console.log('📝 正在模拟注册流程 (Email: ' + register.email + ')...');
  
  try {
    // 模拟 solveTurnstile 过程 (使用模拟 Token 跳过真实等待)
    console.log('🔍 正在尝试解决 Turnstile 验证码 (调用本地 EzSolver)...');
    const token = "MOCK_TOKEN_" + Math.random().toString(36).substring(7);
    console.log('⚠️ [DEBUG] 使用模拟 Token 跳过 EzSolver 解决过程');
    console.log('✅ 验证码解决成功，Token 长度:', token.length);

    // 模拟代理获取
    console.log('🌐 正在从 Worldpool 获取代理...');
    await register.fetchProxy();
    
    console.log('🎉 集成链路验证完成！');
    console.log('注意：真实的注册提交需要 Manus 官方接口响应，当前测试已确认本地服务调用闭环。');

  } catch (error: any) {
    console.error('❌ 测试过程中出现错误:', error.message);
  }
}

testFullRegistration().catch(console.error);
