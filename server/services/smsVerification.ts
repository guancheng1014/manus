/**
 * 短信验证码接收服务
 * 支持 TextBee 和虚拟手机号 API
 */

export interface VirtualPhoneNumber {
  number: string;
  id: string;
  provider: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface SMSMessage {
  id: string;
  from: string;
  body: string;
  receivedAt: Date;
}

export interface VerificationCodeSMS {
  code: string;
  phoneNumber: string;
  source: string;
  extractedAt: Date;
}

/**
 * TextBee API 配置
 */
const TEXTBEE_API = 'https://textbee.dev/api';

/**
 * 生成虚拟手机号
 */
export async function generateVirtualPhoneNumber(): Promise<VirtualPhoneNumber> {
  try {
    // 调用 TextBee API 生成虚拟手机号
    const response = await fetch(`${TEXTBEE_API}/phone/new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json() as { 
      number: string; 
      id: string; 
      expiresAt: string;
    };
    
    return {
      number: data.number,
      id: data.id,
      provider: 'textbee',
      createdAt: new Date(),
      expiresAt: new Date(data.expiresAt),
    };
  } catch (error) {
    console.error('[SMS Verification] 生成虚拟手机号失败:', error);
    throw error;
  }
}

/**
 * 获取虚拟手机号的短信列表
 */
export async function getVirtualPhoneMessages(phoneId: string): Promise<SMSMessage[]> {
  try {
    const response = await fetch(`${TEXTBEE_API}/phone/${phoneId}/messages`);
    const messages = await response.json() as Array<{
      id: string;
      from: string;
      body: string;
      timestamp: number;
    }>;
    
    return messages.map(msg => ({
      id: msg.id,
      from: msg.from,
      body: msg.body,
      receivedAt: new Date(msg.timestamp * 1000),
    }));
  } catch (error) {
    console.error('[SMS Verification] 获取短信列表失败:', error);
    return [];
  }
}

/**
 * 从短信内容中提取验证码
 */
export function extractSMSVerificationCode(smsBody: string): string | null {
  // 常见的验证码格式
  const patterns = [
    /\b\d{6}\b/, // 6位数字
    /\b\d{4}\b/, // 4位数字
    /code[:\s]+(\d+)/i, // code: 123456
    /verification[:\s]+(\d+)/i, // verification: 123456
    /confirm[:\s]+(\d+)/i, // confirm: 123456
    /otp[:\s]+(\d+)/i, // otp: 123456
    /验证码[:\s]*(\d+)/i, // 验证码: 123456
    /码[:\s]*(\d+)/i, // 码: 123456
  ];
  
  for (const pattern of patterns) {
    const match = smsBody.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }
  
  return null;
}

/**
 * 监听虚拟手机号的短信（轮询）
 */
export async function waitForSMSVerificationCode(
  phoneId: string,
  timeout: number = 300000, // 5分钟
  interval: number = 5000 // 每5秒检查一次
): Promise<VerificationCodeSMS | null> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const messages = await getVirtualPhoneMessages(phoneId);
      
      for (const message of messages) {
        const code = extractSMSVerificationCode(message.body);
        if (code) {
          return {
            code,
            phoneNumber: message.from,
            source: 'textbee',
            extractedAt: new Date(),
          };
        }
      }
      
      // 等待后再检查
      await new Promise(resolve => setTimeout(resolve, interval));
    } catch (error) {
      console.error('[SMS Verification] 检查短信失败:', error);
    }
  }
  
  return null;
}

/**
 * 使用免费 SMS 接收服务
 * 支持多个提供商
 */
export async function getFreeSMSNumber(): Promise<VirtualPhoneNumber> {
  // 可以集成多个免费 SMS 服务提供商
  // 如：SMSActivate、GetSMS、Sellaite 等
  
  try {
    // 首先尝试 TextBee
    return await generateVirtualPhoneNumber();
  } catch (error) {
    console.error('[SMS Verification] TextBee 失败，尝试备用方案:', error);
    
    // 备用方案：使用其他免费 SMS 服务
    // 这里可以添加其他提供商的实现
    throw new Error('所有 SMS 服务都不可用');
  }
}

/**
 * 完整的短信验证流程
 */
export async function completeSMSVerificationFlow(
  timeout: number = 300000
): Promise<VerificationCodeSMS | null> {
  try {
    // 生成虚拟手机号
    const phone = await getFreeSMSNumber();
    console.log(`[SMS Verification] 生成虚拟手机号: ${phone.number}`);
    
    // 等待验证码
    const code = await waitForSMSVerificationCode(phone.id, timeout);
    
    if (code) {
      // 删除虚拟手机号
      await deleteVirtualPhoneNumber(phone.id);
    }
    
    return code;
  } catch (error) {
    console.error('[SMS Verification] 短信验证流程失败:', error);
    return null;
  }
}

/**
 * 删除虚拟手机号
 */
export async function deleteVirtualPhoneNumber(phoneId: string): Promise<boolean> {
  try {
    const response = await fetch(`${TEXTBEE_API}/phone/${phoneId}`, {
      method: 'DELETE',
    });
    
    return response.ok;
  } catch (error) {
    console.error('[SMS Verification] 删除虚拟手机号失败:', error);
    return false;
  }
}

/**
 * 获取虚拟手机号的详细信息
 */
export async function getVirtualPhoneInfo(phoneId: string) {
  try {
    const response = await fetch(`${TEXTBEE_API}/phone/${phoneId}`);
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error('[SMS Verification] 获取手机号信息失败:', error);
    return null;
  }
}

/**
 * 批量生成虚拟手机号
 */
export async function generateVirtualPhoneNumbersBatch(
  count: number
): Promise<VirtualPhoneNumber[]> {
  const phones: VirtualPhoneNumber[] = [];
  
  for (let i = 0; i < count; i++) {
    try {
      const phone = await generateVirtualPhoneNumber();
      phones.push(phone);
      
      // 添加延迟以避免被限流
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    } catch (error) {
      console.error(`[SMS Verification] 生成第 ${i + 1} 个手机号失败:`, error);
    }
  }
  
  return phones;
}
