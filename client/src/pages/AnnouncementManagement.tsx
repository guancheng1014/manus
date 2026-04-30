import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Info, AlertTriangle, Plus, Edit2, Trash2, Send } from 'lucide-react';

type AnnouncementType = 'info' | 'warning' | 'success' | 'error';

export function AnnouncementManagement() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'info' as AnnouncementType,
    expiresAt: '',
  });

  const { data: announcementsData, refetch } = trpc.announcements.getAdminAnnouncements.useQuery({
    limit: 20,
    offset: 0,
  });

  const createMutation = trpc.announcements.createAnnouncement.useMutation({
    onSuccess: () => {
      refetch();
      setFormData({ title: '', content: '', type: 'info', expiresAt: '' });
      setIsOpen(false);
    },
  });

  const updateMutation = trpc.announcements.updateAnnouncement.useMutation({
    onSuccess: () => {
      refetch();
      setFormData({ title: '', content: '', type: 'info', expiresAt: '' });
      setEditingId(null);
    },
  });

  const publishMutation = trpc.announcements.publishAnnouncement.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const deleteMutation = trpc.announcements.deleteAnnouncement.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) {
      return;
    }

    if (editingId) {
      await updateMutation.mutateAsync({
        id: editingId,
        ...formData,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : undefined,
      });
    } else {
      await createMutation.mutateAsync({
        ...formData,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : undefined,
      });
    }
  };

  const getIcon = (type: AnnouncementType) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const announcements = announcementsData?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">📢 系统公告管理</h1>
          <p className="text-muted-foreground mt-2">管理系统公告，实时推送给用户</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingId(null)}>
              <Plus className="h-4 w-4 mr-2" />
              新建公告
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? '编辑公告' : '新建公告'}</DialogTitle>
              <DialogDescription>
                {editingId ? '编辑现有公告' : '创建新的系统公告'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">标题</label>
                <Input
                  placeholder="输入公告标题"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">内容</label>
                <Textarea
                  placeholder="输入公告内容"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={5}
                />
              </div>
              <div>
                <label className="text-sm font-medium">类型</label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as AnnouncementType })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">信息</SelectItem>
                    <SelectItem value="warning">警告</SelectItem>
                    <SelectItem value="success">成功</SelectItem>
                    <SelectItem value="error">错误</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">过期时间（可选）</label>
                <Input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                />
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingId ? '更新公告' : '创建公告'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 公告列表 */}
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <Card key={announcement.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getIcon(announcement.type)}
                  <div>
                    <CardTitle className="text-lg">{announcement.title}</CardTitle>
                    <CardDescription>
                      创建于 {new Date(announcement.createdAt).toLocaleString()}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={announcement.published ? 'default' : 'secondary'}>
                    {announcement.published ? '已发布' : '草稿'}
                  </Badge>
                  {announcement.expiresAt && (
                    <Badge variant="outline">
                      过期: {new Date(announcement.expiresAt).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">{announcement.content}</p>
              <div className="flex gap-2">
                {!announcement.published && (
                  <Button
                    size="sm"
                    onClick={() => publishMutation.mutate({ id: announcement.id })}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    发布
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingId(announcement.id);
                    setFormData({
                      title: announcement.title,
                      content: announcement.content,
                      type: announcement.type,
                      expiresAt: announcement.expiresAt
                        ? new Date(announcement.expiresAt).toISOString().slice(0, 16)
                        : '',
                    });
                    setIsOpen(true);
                  }}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  编辑
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteMutation.mutate({ id: announcement.id })}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
