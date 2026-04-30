// 主题管理系统
export type Theme = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'app-theme-preference';

/**
 * 获取系统主题偏好
 */
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * 获取存储的主题偏好
 */
export function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  try {
    return (localStorage.getItem(THEME_STORAGE_KEY) as Theme) || null;
  } catch {
    return null;
  }
}

/**
 * 保存主题偏好
 */
export function saveTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    console.error('Failed to save theme preference');
  }
}

/**
 * 获取实际应用的主题
 */
export function getEffectiveTheme(preference: Theme): 'light' | 'dark' {
  if (preference === 'system') {
    return getSystemTheme();
  }
  return preference;
}

/**
 * 应用主题到 DOM
 */
export function applyTheme(theme: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

/**
 * 初始化主题
 */
export function initializeTheme(): Theme {
  const stored = getStoredTheme();
  const preference = stored || 'system';

  const effective = getEffectiveTheme(preference);
  applyTheme(effective);

  // 监听系统主题变化
  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (preference === 'system') {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  return preference;
}
