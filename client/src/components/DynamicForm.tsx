import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Undo2 } from 'lucide-react';
import { EmojiButton } from './EmojiButton';

interface FormRow {
  id: string;
  value: string;
  error?: string | null;
}

interface DynamicFormProps {
  label: string;
  placeholder: string;
  onSubmit: (values: string[]) => void | Promise<void>;
  validator?: (value: string) => string | null;
  minRows?: number;
  maxRows?: number;
  isLoading?: boolean;
}

/**
 * 动态表单组件
 * 支持添加/删除行、表单验证、撤销功能
 */
export const DynamicForm: React.FC<DynamicFormProps> = ({
  label,
  placeholder,
  onSubmit,
  validator,
  minRows = 1,
  maxRows = 50,
  isLoading = false,
}) => {
  const [rows, setRows] = useState<FormRow[]>(
    Array.from({ length: minRows }, (_, i) => ({
      id: String(i),
      value: '',
    }))
  );
  const [history, setHistory] = useState<FormRow[][]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // 添加新行
  const addRow = useCallback(() => {
    if (rows.length >= maxRows) {
      alert(`最多只能添加 ${maxRows} 行`);
      return;
    }

    const newRow = { id: Date.now().toString(), value: '' };
    const newRows = [...rows, newRow];
    setRows(newRows);
    setHistory([...history, rows]);

    // 自动聚焦到新行
    setTimeout(() => {
      const inputs = document.querySelectorAll('input[data-form-input]');
      const lastInput = inputs[inputs.length - 1] as HTMLInputElement;
      lastInput?.focus();
    }, 0);
  }, [rows, history, maxRows]);

  // 删除行
  const deleteRow = useCallback(
    (id: string) => {
      if (rows.length <= minRows) {
        alert(`至少需要保留 ${minRows} 行`);
        return;
      }

      const newRows = rows.filter(row => row.id !== id);
      setRows(newRows);
      setHistory([...history, rows]);
    },
    [rows, history, minRows]
  );

  // 更新行
  const updateRow = useCallback(
    (id: string, value: string) => {
      const newRows = rows.map(row => {
        if (row.id === id) {
          const error = validator ? validator(value) : null;
          return { ...row, value, error };
        }
        return row;
      });
      setRows(newRows);
    },
    [rows, validator]
  );

  // 撤销
  const undo = useCallback(() => {
    if (history.length === 0) return;
    const previousRows = history[history.length - 1];
    setRows(previousRows);
    setHistory(history.slice(0, -1));
  }, [history]);

  // 清空所有行
  const clearAll = useCallback(() => {
    if (window.confirm('确定要清空所有行吗？')) {
      setHistory([...history, rows]);
      setRows(
        Array.from({ length: minRows }, (_, i) => ({
          id: String(i),
          value: '',
        }))
      );
    }
  }, [rows, history, minRows]);

  // 提交
  const handleSubmit = useCallback(async () => {
    const values = rows.map(row => row.value).filter(v => v.trim());

    if (values.length === 0) {
      alert('请至少输入一个值');
      return;
    }

    // 检查是否有错误
    const hasErrors = rows.some(row => row.error);
    if (hasErrors) {
      alert('请修正所有错误后再提交');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
      // 提交成功后清空
      setRows(
        Array.from({ length: minRows }, (_, i) => ({
          id: String(i),
          value: '',
        }))
      );
      setHistory([]);
    } catch (error) {
      console.error('提交失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [rows, onSubmit, minRows]);

  // 检查是否所有行都有效
  const isValid = rows.every(row => !row.error && row.value.trim());
  const hasErrors = rows.some(row => row.error);

  return (
    <div className="space-y-4">
      {/* 行列表 */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {rows.map((row, index) => (
          <div key={row.id} className="flex gap-2 items-start">
            {/* 行号 */}
            <div className="flex-shrink-0 w-8 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded text-sm text-slate-600 dark:text-slate-400 font-medium">
              {index + 1}
            </div>

            {/* 输入框 */}
            <div className="flex-1">
              <Input
                ref={index === 0 ? firstInputRef : undefined}
                data-form-input="true"
                placeholder={`${placeholder} ${index + 1}`}
                value={row.value}
                onChange={(e) => updateRow(row.id, e.target.value)}
                disabled={isLoading || isSubmitting}
                className={`${
                  row.error
                    ? 'border-red-500 focus:border-red-500'
                    : row.value && !row.error
                      ? 'border-green-500 focus:border-green-500'
                      : ''
                }`}
              />

              {/* 错误提示 */}
              {row.error && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <span>❌</span>
                  {row.error}
                </p>
              )}

              {/* 成功提示 */}
              {row.value && !row.error && (
                <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                  <span>✅</span>
                  有效
                </p>
              )}
            </div>

            {/* 删除按钮 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteRow(row.id)}
              disabled={rows.length <= minRows || isLoading || isSubmitting}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 flex-shrink-0"
            >
              <Trash2 size={18} />
            </Button>
          </div>
        ))}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2 flex-wrap">
        <EmojiButton
          emoji="➕"
          label={`添加${label}`}
          onClick={addRow}
          disabled={rows.length >= maxRows || isLoading || isSubmitting}
          variant="outline"
          size="sm"
        />

        {history.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={isLoading || isSubmitting}
            className="text-slate-500"
          >
            <Undo2 size={18} className="mr-2" />
            撤销
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={clearAll}
          disabled={rows.every(r => !r.value) || isLoading || isSubmitting}
          className="text-slate-500"
        >
          <span className="mr-2">🗑️</span>
          清空
        </Button>

        {/* 统计信息 */}
        <div className="flex-1 flex items-center justify-end text-xs text-slate-500">
          {rows.length}/{maxRows} 行 • {rows.filter(r => r.value.trim()).length} 已填
        </div>
      </div>

      {/* 提交按钮 */}
      <EmojiButton
        emoji="📤"
        label="提交"
        onClick={handleSubmit}
        disabled={!isValid || isLoading || isSubmitting}
        className="w-full"
        size="lg"
      />

      {/* 状态提示 */}
      {hasErrors && (
        <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
          <span className="flex-shrink-0 mt-0.5">⚠️</span>
          <span>请修正所有错误后再提交</span>
        </div>
      )}

      {isSubmitting && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
          <span className="animate-spin">⏳</span>
          <span>提交中...</span>
        </div>
      )}
    </div>
  );
};
