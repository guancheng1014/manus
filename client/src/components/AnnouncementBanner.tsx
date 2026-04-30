import React, { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export function AnnouncementBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const { data: announcementsData, isLoading } = trpc.announcements.getAnnouncements.useQuery({
    limit: 10,
    offset: 0,
  });

  const announcements = announcementsData?.items || [];
  const visibleAnnouncements = announcements.filter((a) => !dismissed.has(a.id));

  if (isLoading || visibleAnnouncements.length === 0) {
    return null;
  }

  const current = visibleAnnouncements[currentIndex % visibleAnnouncements.length];

  const getIcon = () => {
    switch (current.type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (current.type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const handleDismiss = () => {
    const newDismissed = new Set(dismissed);
    newDismissed.add(current.id);
    setDismissed(newDismissed);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  return (
    <div className={`border rounded-lg p-4 flex items-center gap-4 ${getBgColor()}`}>
      <div className="flex-shrink-0">{getIcon()}</div>
      <div className="flex-1">
        <h3 className="font-semibold text-sm">{current.title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{current.content}</p>
      </div>
      <div className="flex items-center gap-2">
        {visibleAnnouncements.length > 1 && (
          <>
            <span className="text-xs text-muted-foreground">
              {currentIndex % visibleAnnouncements.length + 1} / {visibleAnnouncements.length}
            </span>
            <Button variant="ghost" size="sm" onClick={handleNext}>
              下一条
            </Button>
          </>
        )}
        <Button variant="ghost" size="icon" onClick={handleDismiss}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
