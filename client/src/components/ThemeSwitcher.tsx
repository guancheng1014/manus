import React from 'react';
import { useTheme, type Theme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Moon, Sun, Monitor } from 'lucide-react';

export function ThemeSwitcher() {
  const { theme, effectiveTheme, setTheme } = useTheme();

  if (!setTheme) {
    return null;
  }

  const getIcon = () => {
    if (theme === 'system') {
      return effectiveTheme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />;
    }
    return theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />;
  };

  const getLabel = () => {
    switch (theme) {
      case 'dark':
        return '深色';
      case 'light':
        return '浅色';
      default:
        return '系统';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title="切换主题">
          {getIcon()}
          <span className="sr-only">切换主题</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className={theme === 'light' ? 'bg-accent' : ''}
        >
          <Sun className="h-4 w-4 mr-2" />
          <span>浅色</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className={theme === 'dark' ? 'bg-accent' : ''}
        >
          <Moon className="h-4 w-4 mr-2" />
          <span>深色</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className={theme === 'system' ? 'bg-accent' : ''}
        >
          <Monitor className="h-4 w-4 mr-2" />
          <span>系统</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
