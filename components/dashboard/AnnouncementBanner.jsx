import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Megaphone, AlertTriangle, Info, Bell, FileText, Music } from "lucide-react";
import { format } from 'date-fns';

const priorityConfig = {
  urgent: {
    icon: AlertTriangle,
    color: "bg-red-50 border-red-500 text-red-900",
    badgeColor: "bg-red-500 text-white",
    iconColor: "text-red-600"
  },
  high: {
    icon: Bell,
    color: "bg-orange-50 border-orange-500 text-orange-900",
    badgeColor: "bg-orange-500 text-white",
    iconColor: "text-orange-600"
  },
  normal: {
    icon: Info,
    color: "bg-blue-50 border-blue-500 text-blue-900",
    badgeColor: "bg-blue-500 text-white",
    iconColor: "text-blue-600"
  },
  low: {
    icon: Megaphone,
    color: "bg-gray-50 border-gray-500 text-gray-900",
    badgeColor: "bg-gray-500 text-white",
    iconColor: "text-gray-600"
  }
};

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(() => {
    const saved = localStorage.getItem('dismissedAnnouncements');
    return saved ? JSON.parse(saved) : [];
  });
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  useEffect(() => {
    // Only set up auto-refresh if authenticated and no persistent errors
    if (!isAuthenticated || hasError || retryCount >= 3) {
      return;
    }

    const interval = setInterval(() => {
      loadAnnouncements();
    }, 60000); // Check every 60 seconds instead of 30
    
    return () => clearInterval(interval);
  }, [isAuthenticated, hasError, retryCount]);

  const checkAuthAndLoad = async () => {
    try {
      // Check if user is authenticated first
      await base44.auth.me();
      setIsAuthenticated(true);
      // Now load announcements
      await loadAnnouncements();
    } catch (error) {
      // User not authenticated yet, or auth check failed
      // Silently fail - this is expected on public pages
      setIsLoading(false);
      setHasError(true);
    }
  };

  const loadAnnouncements = async () => {
    try {
      setHasError(false);
      const data = await base44.entities.Announcement.list('-created_date', 10);
      const now = new Date();
      
      const active = data.filter(a => {
        if (!a.is_active) return false;
        if (a.expires_at && new Date(a.expires_at) < now) return false;
        return true;
      });
      
      // Clean up dismissed IDs for announcements that no longer exist
      const activeIds = active.map(a => a.id);
      const validDismissed = dismissedIds.filter(id => activeIds.includes(id));
      if (validDismissed.length !== dismissedIds.length) {
        setDismissedIds(validDismissed);
        localStorage.setItem('dismissedAnnouncements', JSON.stringify(validDismissed));
      }
      
      setAnnouncements(active);
      setIsLoading(false);
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      // Don't log error to console - it clutters the console unnecessarily
      // Only increment retry count and stop trying after 3 failures
      setRetryCount(prev => prev + 1);
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handleDismiss = (id) => {
    const newDismissed = [...dismissedIds, id];
    setDismissedIds(newDismissed);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed));
  };

  // Don't render anything if there's an error, still loading, or not authenticated
  if (hasError || isLoading || !isAuthenticated) {
    return null;
  }

  const visibleAnnouncements = announcements.filter(a => !dismissedIds.includes(a.id));

  if (visibleAnnouncements.length === 0) return null;

  return (
    <div className="space-y-3 w-full">
      {visibleAnnouncements.map(announcement => {
        const config = priorityConfig[announcement.priority] || priorityConfig.normal;
        const Icon = config.icon;

        return (
          <Alert key={announcement.id} className={`${config.color} relative`}>
            <Icon className={`h-4 w-4 ${config.iconColor}`} />
            <AlertTitle className="flex items-center gap-2 text-sm sm:text-base">
              {announcement.title}
              <Badge className={`${config.badgeColor} text-[10px] sm:text-xs`}>
                {announcement.priority.toUpperCase()}
              </Badge>
            </AlertTitle>
            <AlertDescription className="text-xs sm:text-sm mt-2">
              <div className="space-y-3">
                <p>{announcement.message}</p>
                
                {announcement.image_url && (
                  <img 
                    src={announcement.image_url} 
                    alt="Announcement" 
                    className="w-full max-w-md rounded-lg border shadow-sm"
                  />
                )}
                
                {announcement.video_url && (
                  <video 
                    src={announcement.video_url} 
                    controls 
                    className="w-full max-w-md rounded-lg border shadow-sm"
                  />
                )}

                {announcement.audio_url && (
                  <div className="flex items-center gap-2 p-2 border rounded-lg bg-white w-fit max-w-md">
                    <Music className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{announcement.audio_name || 'Audio File'}</p>
                      <audio src={announcement.audio_url} controls className="w-full mt-1" />
                    </div>
                  </div>
                )}

                {announcement.file_url && (
                  <a 
                    href={announcement.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 border rounded-lg bg-white hover:bg-gray-50 transition-colors w-fit"
                  >
                    <FileText className="w-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">{announcement.file_name || 'Download Attachment'}</span>
                  </a>
                )}
              </div>
            </AlertDescription>
            <div className="text-[10px] sm:text-xs text-gray-600 mt-2">
              Posted {announcement.created_date && !isNaN(new Date(announcement.created_date).getTime()) ? format(new Date(announcement.created_date), 'MMM d, yyyy h:mm a') : 'Recently'}
              {announcement.expires_at && !isNaN(new Date(announcement.expires_at).getTime()) && ` • Expires ${format(new Date(announcement.expires_at), 'MMM d, yyyy')}`}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDismiss(announcement.id)}
              className="absolute top-2 right-2 h-6 w-6"
            >
              <X className="h-3 w-3" />
            </Button>
          </Alert>
        );
      })}
    </div>
  );
}