// 多语言支持系统
export type Language = 'zh' | 'en';

export const translations = {
  zh: {
    // 导航
    nav: {
      singleRegister: '单账号注册',
      batchRegister: '批量注册',
      monitoring: '任务监控',
      results: '注册结果',
      profile: '个人中心',
      admin: '管理后台',
    },
    // 个人中心
    profile: {
      title: '个人中心',
      personalInfo: '个人信息',
      accountSettings: '账户设置',
      securitySettings: '安全设置',
      apiKeys: 'API 密钥',
      notifications: '通知设置',
      activityLog: '活动日志',
      name: '名字',
      email: '邮箱',
      joinDate: '加入日期',
      update: '更新',
      save: '保存',
      cancel: '取消',
    },
    // API 密钥
    apiKey: {
      title: 'API 密钥管理',
      create: '创建新密钥',
      name: '密钥名称',
      status: '状态',
      created: '创建时间',
      lastUsed: '最后使用',
      delete: '删除',
      active: '活跃',
      revoked: '已撤销',
      copySuccess: '已复制到剪贴板',
    },
    // 通知设置
    notification: {
      title: '通知设置',
      email: '邮件通知',
      inApp: '应用内通知',
      sms: '短信通知',
      taskCompleted: '任务完成',
      taskFailed: '任务失败',
      cardKeyExpiring: '卡密即将过期',
      systemAnnouncements: '系统公告',
      weeklyReport: '周报告',
    },
    // 安全设置
    security: {
      title: '安全设置',
      twoFactor: '两步验证',
      enable: '启用',
      disable: '禁用',
      enabled: '已启用',
      disabled: '已禁用',
      lastPasswordChange: '最后修改密码',
      loginHistory: '登录历史',
      device: '设备',
      ip: 'IP 地址',
      location: '位置',
      time: '时间',
    },
    // 统计信息
    stats: {
      title: '账户统计',
      totalTasks: '总任务数',
      successCount: '成功数',
      failCount: '失败数',
      totalAccounts: '总账号数',
      cardKeysUsed: '已用卡密',
      creditsRemaining: '剩余积分',
    },
    // 通用
    common: {
      loading: '加载中...',
      error: '错误',
      success: '成功',
      warning: '警告',
      info: '信息',
      delete: '删除',
      edit: '编辑',
      save: '保存',
      cancel: '取消',
      confirm: '确认',
      close: '关闭',
      back: '返回',
      next: '下一步',
      previous: '上一步',
      search: '搜索',
      filter: '筛选',
      export: '导出',
      import: '导入',
      download: '下载',
      upload: '上传',
      logout: '登出',
      login: '登录',
      register: '注册',
      yes: '是',
      no: '否',
      ok: '确定',
    },
  },
  en: {
    // Navigation
    nav: {
      singleRegister: 'Single Register',
      batchRegister: 'Batch Register',
      monitoring: 'Monitoring',
      results: 'Results',
      profile: 'Profile',
      admin: 'Admin',
    },
    // Profile
    profile: {
      title: 'Profile',
      personalInfo: 'Personal Information',
      accountSettings: 'Account Settings',
      securitySettings: 'Security Settings',
      apiKeys: 'API Keys',
      notifications: 'Notifications',
      activityLog: 'Activity Log',
      name: 'Name',
      email: 'Email',
      joinDate: 'Join Date',
      update: 'Update',
      save: 'Save',
      cancel: 'Cancel',
    },
    // API Keys
    apiKey: {
      title: 'API Key Management',
      create: 'Create New Key',
      name: 'Key Name',
      status: 'Status',
      created: 'Created',
      lastUsed: 'Last Used',
      delete: 'Delete',
      active: 'Active',
      revoked: 'Revoked',
      copySuccess: 'Copied to clipboard',
    },
    // Notifications
    notification: {
      title: 'Notification Settings',
      email: 'Email Notifications',
      inApp: 'In-App Notifications',
      sms: 'SMS Notifications',
      taskCompleted: 'Task Completed',
      taskFailed: 'Task Failed',
      cardKeyExpiring: 'Card Key Expiring',
      systemAnnouncements: 'System Announcements',
      weeklyReport: 'Weekly Report',
    },
    // Security
    security: {
      title: 'Security Settings',
      twoFactor: 'Two-Factor Authentication',
      enable: 'Enable',
      disable: 'Disable',
      enabled: 'Enabled',
      disabled: 'Disabled',
      lastPasswordChange: 'Last Password Change',
      loginHistory: 'Login History',
      device: 'Device',
      ip: 'IP Address',
      location: 'Location',
      time: 'Time',
    },
    // Stats
    stats: {
      title: 'Account Statistics',
      totalTasks: 'Total Tasks',
      successCount: 'Success Count',
      failCount: 'Fail Count',
      totalAccounts: 'Total Accounts',
      cardKeysUsed: 'Card Keys Used',
      creditsRemaining: 'Credits Remaining',
    },
    // Common
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      info: 'Information',
      delete: 'Delete',
      edit: 'Edit',
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      import: 'Import',
      download: 'Download',
      upload: 'Upload',
      logout: 'Logout',
      login: 'Login',
      register: 'Register',
      yes: 'Yes',
      no: 'No',
      ok: 'OK',
    },
  },
};

// 获取翻译
export function t(key: string, lang: Language = 'zh'): string {
  const keys = key.split('.');
  let value: any = translations[lang];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key; // 返回原始 key 如果翻译不存在
    }
  }

  return typeof value === 'string' ? value : key;
}

// 语言上下文
import { createContext, useContext } from 'react';

export const LanguageContext = createContext<{
  language: Language;
  setLanguage: (lang: Language) => void;
}>({
  language: 'zh',
  setLanguage: () => {},
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export function useTranslation() {
  const { language } = useLanguage();
  return (key: string) => t(key, language);
}
