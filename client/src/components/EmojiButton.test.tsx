import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmojiButton, EmojiButtons } from './EmojiButton';

describe('EmojiButton', () => {
  it('should render button with emoji and label', () => {
    render(<EmojiButton emoji="📤" label="提交" />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('📤');
    expect(button).toHaveTextContent('提交');
  });

  it('should render with default emoji when not provided', () => {
    render(<EmojiButton label="测试" />);

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('✨');
    expect(button).toHaveTextContent('测试');
  });

  it('should apply custom className', () => {
    render(<EmojiButton emoji="🚀" label="开始" className="custom-class" />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<EmojiButton emoji="✅" label="验证" disabled />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should render variant prop correctly', () => {
    render(<EmojiButton emoji="❌" label="取消" variant="outline" />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('outline');
  });
});

describe('EmojiButtons', () => {
  it('should render Submit button', () => {
    render(EmojiButtons.Submit());

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('📤');
    expect(button).toHaveTextContent('提交');
  });

  it('should render Cancel button', () => {
    render(EmojiButtons.Cancel());

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('❌');
    expect(button).toHaveTextContent('取消');
  });

  it('should render Delete button', () => {
    render(EmojiButtons.Delete());

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('🗑️');
    expect(button).toHaveTextContent('删除');
  });

  it('should render Add button', () => {
    render(EmojiButtons.Add());

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('➕');
    expect(button).toHaveTextContent('添加');
  });

  it('should render Search button', () => {
    render(EmojiButtons.Search());

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('🔍');
    expect(button).toHaveTextContent('搜索');
  });

  it('should render Export button', () => {
    render(EmojiButtons.Export());

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('📥');
    expect(button).toHaveTextContent('导出');
  });

  it('should render Refresh button', () => {
    render(EmojiButtons.Refresh());

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('🔄');
    expect(button).toHaveTextContent('刷新');
  });

  it('should render Verify button', () => {
    render(EmojiButtons.Verify());

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('✅');
    expect(button).toHaveTextContent('验证');
  });

  it('should render Start button', () => {
    render(EmojiButtons.Start());

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('🚀');
    expect(button).toHaveTextContent('开始');
  });

  it('should render Claim button', () => {
    render(EmojiButtons.Claim());

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('📦');
    expect(button).toHaveTextContent('领取账号');
  });
});
