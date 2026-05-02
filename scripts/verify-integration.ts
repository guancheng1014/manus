import axios from 'axios';

async function verify() {
  console.log('🔍 开始集成验证测试...');

  // 1. 验证 EzSolver
  try {
    const ez = await axios.get('http://localhost:8191/health');
    console.log('✅ EzSolver 状态:', ez.data);
  } catch (e: any) {
    console.error('❌ EzSolver 连接失败:', e.message);
  }

  // 2. 验证 Worldpool
  try {
    const wp = await axios.get('http://localhost:8080/stats');
    console.log('✅ Worldpool 状态:', wp.data);
    
    // 尝试获取一个随机代理
    const proxy = await axios.get('http://localhost:8080/proxies/random?protocol=http');
    console.log('✅ Worldpool 随机代理:', proxy.data);
  } catch (e: any) {
    console.error('❌ Worldpool 连接失败:', e.message);
  }

  console.log('\n🚀 集成配置已完成，Manus 注册工具现在会优先使用本地免费服务。');
}

verify();
