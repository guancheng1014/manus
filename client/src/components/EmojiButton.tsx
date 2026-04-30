import React from 'react';
import { Button } from '@/components/ui/button';
import { type ComponentProps } from 'react';

type ButtonProps = ComponentProps<typeof Button>;

interface EmojiButtonProps extends ButtonProps {
  emoji?: string;
  label: string;
}

/**
 * Emoji 增强按钮组件
 * 在按钮文本前添加 emoji，提升视觉识别度
 */
export const EmojiButton: React.FC<EmojiButtonProps> = ({
  emoji = '✨',
  label,
  ...props
}) => {
  return (
    <Button
      className="gap-2"
      {...props}
    >
      <span className="text-lg">{emoji}</span>
      <span>{label}</span>
    </Button>
  );
};

/**
 * 预定义的 Emoji 按钮集合
 */
export const EmojiButtons = {
  Submit: (props?: Partial<ButtonProps>) => (
    <EmojiButton emoji="📤" label="提交" {...(props as any)} />
  ),
  Cancel: (props?: Partial<ButtonProps>) => (
    <EmojiButton emoji="❌" label="取消" {...(props as any)} />
  ),
  Delete: (props?: Partial<ButtonProps>) => (
    <EmojiButton emoji="🗑️" label="删除" {...(props as any)} />
  ),
  Edit: (props?: Partial<ButtonProps>) => (
    <EmojiButton emoji="✏️" label="编辑" {...(props as any)} />
  ),
  Add: (props?: Partial<ButtonProps>) => (
    <EmojiButton emoji="➕" label="添加" {...(props as any)} />
  ),
  Search: (props?: Partial<ButtonProps>) => (
    <EmojiButton emoji="🔍" label="搜索" {...(props as any)} />
  ),
  Export: (props?: Partial<ButtonProps>) => (
    <EmojiButton emoji="📥" label="导出" {...(props as any)} />
  ),
  Import: (props?: Partial<ButtonProps>) => (
    <EmojiButton emoji="📦" label="导入" {...(props as any)} />
  ),
  Refresh: (props?: Partial<ButtonProps>) => (
    <EmojiButton emoji="🔄" label="刷新" {...(props as any)} />
  ),
  Verify: (props?: Partial<ButtonProps>) => (
    <EmojiButton emoji="✅" label="验证" {...(props as any)} />
  ),
  Start: (props?: Partial<ButtonProps>) => (
    <EmojiButton emoji="🚀" label="开始" {...(props as any)} />
  ),
  Claim: (props?: Partial<ButtonProps>) => (
    <EmojiButton emoji="📦" label="领取账号" {...(props as any)} />
  ),
  Compose: (props?: Partial<ButtonProps>) => (
    <EmojiButton emoji="🔄" label="开始合成" {...(props as any)} />
  ),
  Clear: (props?: Partial<ButtonProps>) => (
    <EmojiButton emoji="🗑️" label="清空" {...(props as any)} />
  ),
};
