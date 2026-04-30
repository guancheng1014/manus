/**
 * 表单验证工具集合
 * 提供常用的验证函数
 */

export const validators = {
  /**
   * 验证邮箱地址
   */
  email: (value: string): string | null => {
    if (!value.trim()) return null;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(value) ? null : '请输入有效的邮箱地址';
  },

  /**
   * 验证邀请码
   */
  invitationCode: (value: string): string | null => {
    if (!value.trim()) return null;
    const codePattern = /^[A-Z0-9]{6,}$/;
    return codePattern.test(value) ? null : '邀请码格式不正确（需要 6 个以上大写字母或数字）';
  },

  /**
   * 验证邀请链接
   */
  invitationUrl: (value: string): string | null => {
    if (!value.trim()) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return '请输入有效的邀请链接';
    }
  },

  /**
   * 验证邀请链接或邀请码（二选一）
   */
  invitationLinkOrCode: (value: string): string | null => {
    if (!value.trim()) return null;

    const urlError = validators.invitationUrl(value);
    const codeError = validators.invitationCode(value);

    // 如果都不符合，返回错误
    if (urlError && codeError) {
      return '请输入有效的邀请链接或邀请码';
    }

    return null;
  },

  /**
   * 验证手机号
   */
  phoneNumber: (value: string): string | null => {
    if (!value.trim()) return null;
    const phonePattern = /^[0-9]{10,}$/;
    return phonePattern.test(value) ? null : '请输入有效的手机号（至少 10 位数字）';
  },

  /**
   * 验证 URL
   */
  url: (value: string): string | null => {
    if (!value.trim()) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return '请输入有效的 URL';
    }
  },

  /**
   * 验证 API 密钥
   */
  apiKey: (value: string): string | null => {
    if (!value.trim()) return null;
    if (value.length < 10) {
      return 'API 密钥长度不足（至少 10 个字符）';
    }
    return null;
  },

  /**
   * 验证密码强度
   */
  password: (value: string): string | null => {
    if (!value.trim()) return null;

    if (value.length < 8) {
      return '密码长度不足（至少 8 个字符）';
    }

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumbers = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);

    const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(
      Boolean
    ).length;

    if (strength < 2) {
      return '密码强度不足（需要大小写字母、数字和特殊字符的组合）';
    }

    return null;
  },

  /**
   * 验证用户名
   */
  username: (value: string): string | null => {
    if (!value.trim()) return null;
    const usernamePattern = /^[a-zA-Z0-9_-]{3,20}$/;
    return usernamePattern.test(value)
      ? null
      : '用户名格式不正确（3-20 个字符，只能包含字母、数字、下划线和连字符）';
  },

  /**
   * 验证数字
   */
  number: (value: string): string | null => {
    if (!value.trim()) return null;
    return /^-?\d+(\.\d+)?$/.test(value) ? null : '请输入有效的数字';
  },

  /**
   * 验证正整数
   */
  positiveInteger: (value: string): string | null => {
    if (!value.trim()) return null;
    return /^[1-9]\d*$/.test(value) ? null : '请输入有效的正整数';
  },

  /**
   * 验证非负整数
   */
  nonNegativeInteger: (value: string): string | null => {
    if (!value.trim()) return null;
    return /^\d+$/.test(value) ? null : '请输入有效的非负整数';
  },

  /**
   * 验证卡密
   */
  cardKey: (value: string): string | null => {
    if (!value.trim()) return null;
    // 卡密通常是字母数字组合，长度 10-50
    const cardKeyPattern = /^[A-Z0-9]{10,50}$/;
    return cardKeyPattern.test(value) ? null : '卡密格式不正确';
  },

  /**
   * 验证 IP 地址
   */
  ipAddress: (value: string): string | null => {
    if (!value.trim()) return null;
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipPattern.test(value)) {
      return '请输入有效的 IP 地址';
    }

    // 检查每个段是否在 0-255 之间
    const parts = value.split('.');
    for (const part of parts) {
      const num = parseInt(part, 10);
      if (num < 0 || num > 255) {
        return '请输入有效的 IP 地址';
      }
    }

    return null;
  },

  /**
   * 验证端口号
   */
  port: (value: string): string | null => {
    if (!value.trim()) return null;
    const portNum = parseInt(value, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      return '请输入有效的端口号（1-65535）';
    }
    return null;
  },

  /**
   * 验证非空字符串
   */
  required: (value: string): string | null => {
    return value.trim() ? null : '此字段不能为空';
  },

  /**
   * 验证最小长度
   */
  minLength: (min: number) => (value: string): string | null => {
    if (!value.trim()) return null;
    return value.length >= min ? null : `最少需要 ${min} 个字符`;
  },

  /**
   * 验证最大长度
   */
  maxLength: (max: number) => (value: string): string | null => {
    if (!value.trim()) return null;
    return value.length <= max ? null : `最多只能 ${max} 个字符`;
  },

  /**
   * 验证长度范围
   */
  lengthRange: (min: number, max: number) => (value: string): string | null => {
    if (!value.trim()) return null;
    const len = value.length;
    if (len < min || len > max) {
      return `长度需要在 ${min}-${max} 个字符之间`;
    }
    return null;
  },

  /**
   * 验证正则表达式
   */
  pattern: (pattern: RegExp, message: string) => (value: string): string | null => {
    if (!value.trim()) return null;
    return pattern.test(value) ? null : message;
  },

  /**
   * 自定义验证函数
   */
  custom: (validatorFn: (value: string) => boolean, message: string) => (
    value: string
  ): string | null => {
    if (!value.trim()) return null;
    return validatorFn(value) ? null : message;
  },
};

/**
 * 组合多个验证器
 */
export const combineValidators = (
  ...validatorFns: Array<(value: string) => string | null>
) => (value: string): string | null => {
  for (const validator of validatorFns) {
    const error = validator(value);
    if (error) {
      return error;
    }
  }
  return null;
};

/**
 * 验证整个表单
 */
export const validateForm = (
  data: Record<string, string>,
  schema: Record<string, (value: string) => string | null>
): Record<string, string> => {
  const errors: Record<string, string> = {};

  for (const [key, value] of Object.entries(data)) {
    const validator = schema[key];
    if (validator) {
      const error = validator(value);
      if (error) {
        errors[key] = error;
      }
    }
  }

  return errors;
};

/**
 * 预定义的验证模式
 */
export const validationSchemas = {
  /**
   * 用户注册表单
   */
  registration: {
    email: validators.email,
    password: validators.password,
    username: validators.username,
  },

  /**
   * 邀请链接表单
   */
  invitation: {
    invitationLink: validators.invitationLinkOrCode,
  },

  /**
   * 代理配置表单
   */
  proxyConfig: {
    proxyUrl: validators.url,
    port: validators.port,
    username: validators.username,
    password: validators.required,
  },

  /**
   * API 配置表单
   */
  apiConfig: {
    apiUrl: validators.url,
    apiKey: validators.apiKey,
  },
};
