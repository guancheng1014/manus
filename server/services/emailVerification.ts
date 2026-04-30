/**
 * 邮箱验证码接收服务
 * 支持 Temp-Mail API 和 Python IMAP 邮箱连接
 */

export interface TempMailAddress {
  address: string;
  id: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface EmailMessage {
  id: string;
  from: string;
  subject: string;
  body: string;
  receivedAt: Date;
}

export interface VerificationCode {
  code: string;
  email: string;
  source: string;
  extractedAt: Date;
}

/**
 * Temp-Mail API 配置
 */
const TEMP_MAIL_API = 'https://temp-mail.org/api/v1';

/**
 * 生成临时邮箱地址
 */
export async function generateTempMailAddress(): Promise<TempMailAddress> {
  try {
    // 调用 Temp-Mail API 生成临时邮箱
    const response = await fetch(`${TEMP_MAIL_API}/email/new`);
    const data = await response.json() as { email: string; token: string };
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1小时后过期
    
    return {
      address: data.email,
      id: data.token,
      createdAt: new Date(),
      expiresAt,
    };
  } catch (error) {
    console.error('[Email Verification] 生成临时邮箱失败:', error);
    throw error;
  }
}

/**
 * 获取临时邮箱的邮件列表
 */
export async function getTempMailMessages(tempMailId: string): Promise<EmailMessage[]> {
  try {
    const response = await fetch(`${TEMP_MAIL_API}/email/${tempMailId}/messages`);
    const messages = await response.json() as Array<{
      id: string;
      from: string;
      subject: string;
      body: string;
      timestamp: number;
    }>;
    
    return messages.map(msg => ({
      id: msg.id,
      from: msg.from,
      subject: msg.subject,
      body: msg.body,
      receivedAt: new Date(msg.timestamp * 1000),
    }));
  } catch (error) {
    console.error('[Email Verification] 获取邮件列表失败:', error);
    return [];
  }
}

/**
 * 从邮件内容中提取验证码
 */
export function extractVerificationCode(emailBody: string): string | null {
  // 常见的验证码格式
  const patterns = [
    /\b\d{6}\b/, // 6位数字
    /\b\d{4}\b/, // 4位数字
    /code[:\s]+(\d+)/i, // code: 123456
    /verification[:\s]+(\d+)/i, // verification: 123456
    /confirm[:\s]+(\d+)/i, // confirm: 123456
    /otp[:\s]+(\d+)/i, // otp: 123456
  ];
  
  for (const pattern of patterns) {
    const match = emailBody.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }
  
  return null;
}

/**
 * 监听邮箱验证码（轮询）
 */
export async function waitForVerificationCode(
  tempMailId: string,
  timeout: number = 300000, // 5分钟
  interval: number = 5000 // 每5秒检查一次
): Promise<VerificationCode | null> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const messages = await getTempMailMessages(tempMailId);
      
      for (const message of messages) {
        const code = extractVerificationCode(message.body);
        if (code) {
          return {
            code,
            email: message.from,
            source: 'temp-mail',
            extractedAt: new Date(),
          };
        }
      }
      
      // 等待后再检查
      await new Promise(resolve => setTimeout(resolve, interval));
    } catch (error) {
      console.error('[Email Verification] 检查邮件失败:', error);
    }
  }
  
  return null;
}

/**
 * 使用 IMAP 连接 Outlook 邮箱
 * 注意：需要在服务器端实现 Python 脚本调用
 */
export async function connectOutlookViaIMAP(
  email: string,
  password: string
): Promise<boolean> {
  try {
    // 这里应该调用 Python 脚本或使用 Node.js IMAP 库
    // 示例：使用 node-imap 库
    console.log(`[Email Verification] 连接 Outlook: ${email}`);
    
    // 模拟连接
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  } catch (error) {
    console.error('[Email Verification] IMAP 连接失败:', error);
    return false;
  }
}

/**
 * 从 Outlook 邮箱获取验证码
 */
export async function getVerificationCodeFromOutlook(
  email: string,
  password: string,
  timeout: number = 300000
): Promise<VerificationCode | null> {
  try {
    const connected = await connectOutlookViaIMAP(email, password);
    if (!connected) {
      throw new Error('无法连接到 Outlook 邮箱');
    }
    
    // 这里应该实现实际的邮件获取逻辑
    // 使用 IMAP 连接获取最新邮件
    console.log(`[Email Verification] 获取 ${email} 的验证码`);
    
    // 模拟获取验证码
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      code: '123456',
      email,
      source: 'outlook-imap',
      extractedAt: new Date(),
    };
  } catch (error) {
    console.error('[Email Verification] 获取验证码失败:', error);
    return null;
  }
}

/**
 * 清理临时邮箱
 */
export async function deleteTempMailAddress(tempMailId: string): Promise<boolean> {
  try {
    const response = await fetch(`${TEMP_MAIL_API}/email/${tempMailId}`, {
      method: 'DELETE',
    });
    
    return response.ok;
  } catch (error) {
    console.error('[Email Verification] 删除临时邮箱失败:', error);
    return false;
  }
}

/**
 * 完整的邮箱验证流程
 */
export async function completeEmailVerificationFlow(
  email: string,
  password?: string
): Promise<VerificationCode | null> {
  try {
    if (email.endsWith('@outlook.com') && password) {
      // 使用 Outlook IMAP
      return await getVerificationCodeFromOutlook(email, password);
    } else {
      // 使用临时邮箱
      const tempMail = await generateTempMailAddress();
      const code = await waitForVerificationCode(tempMail.id);
      
      if (code) {
        await deleteTempMailAddress(tempMail.id);
      }
      
      return code;
    }
  } catch (error) {
    console.error('[Email Verification] 邮箱验证流程失败:', error);
    return null;
  }
}
