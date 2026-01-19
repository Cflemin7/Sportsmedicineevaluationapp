import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Info, Bell, Megaphone, FileText, Music, Search, Archive, Calendar, Loader2 } from "lucide-react";
import { format } from 'date-fns';
import { Separator } from "@/components/ui/separator";

const priorityConfig = {
  urgent: {
    icon: AlertTriangle,
    color: "bg-red-50 border-red-200",
    badgeColor: "bg-red-500 text-white",
    iconColor: "text-red-600"
  },
  high: {
    icon: Bell,
    color: "bg-orange-50 border-orange-200",
    badgeColor: "bg-orange-500 text-white",
    iconColor: "text-orange-600"
  },
  normal: {
    icon: Info,
    color: "bg-blue-50 border-blue-200",
    badgeColor: "bg-blue-500 text-white",
    iconColor: "text-blue-600"
  },
  low: {
    icon: Megaphone,
    color: "bg-gray-50 border-gray-200",
    badgeColor: "bg-gray-500 text-white",
    iconColor: "text-gray-600"
  }
};

export default function AnnouncementsArchive() {
  const [announcements, setAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadAnnouncements();
  }, []);

  useEffect(() => {
    filterAnnouncements();
  }, [announcements, searchTerm, priorityFilter, statusFilter]);

  const loadAnnouncements = async () => {
    try {
      const data = await base44.entities.Announcement.list('-created_date', 100);
      setAnnouncements(data);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAnnouncements = () => {
    let filtered = [...announcements];

    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.message?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(a => a.priority === priorityFilter);
    }

    if (statusFilter === 'active') {
      const now = new Date();
      filtered = filtered.filter(a => {
        if (!a.is_active) return false;
        if (a.expires_at && new Date(a.expires_at) < now) return false;
        return true;
      });
    } else if (statusFilter === 'expired') {
      const now = new Date();
      filtered = filtered.filter(a => {
        if (a.expires_at && new Date(a.expires_at) < now) return true;
        return false;
      });
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(a => !a.is_active);
    }

    setFilteredAnnouncements(filtered);
  };

  const getAnnouncementStatus = (announcement) => {
    const now = new Date();
    if (!announcement.is_active) return { label: 'Inactive', color: 'bg-gray-100 text-gray-800' };
    if (announcement.expires_at && new Date(announcement.expires_at) < now) {
      return { label: 'Expired', color: 'bg-red-100 text-red-800' };
    }
    return { label: 'Active', color: 'bg-green-100 text-green-800' };
  };

  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-32">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-blue-600" />
                Announcements Archive
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                View all announcements, including previously dismissed ones
              </p>
            </div>
            <Button onClick={loadAnnouncements} variant="outline" size="sm">
              <Archive className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search announcements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-gray-600">
            Showing {filteredAnnouncements.length} of {announcements.length} announcements
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredAnnouncements.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Archive className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No announcements found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnnouncements.map(announcement => {
              const config = priorityConfig[announcement.priority] || priorityConfig.normal;
              const Icon = config.icon;
              const status = getAnnouncementStatus(announcement);

              return (
                <Card key={announcement.id} className={`${config.color} border-2`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <Icon className={`${config.iconColor} w-5 h-5 mt-1 flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-1">{announcement.title}</h3>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <Badge className={config.badgeColor}>
                              {announcement.priority.toUpperCase()}
                            </Badge>
                            <Badge className={status.color}>
                              {status.label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-800 mb-3 whitespace-pre-wrap">{announcement.message}</p>

                    {announcement.image_url && (
                      <div className="mb-3">
                        <img 
                          src={announcement.image_url} 
                          alt="Announcement" 
                          className="w-full max-w-md rounded-lg border shadow-sm"
                        />
                      </div>
                    )}

                    {announcement.video_url && (
                      <div className="mb-3">
                        <video 
                          src={announcement.video_url} 
                          controls 
                          className="w-full max-w-md rounded-lg border shadow-sm"
                        />
                      </div>
                    )}

                    {announcement.audio_url && (
                      <div className="mb-3">
                        <div className="flex items-center gap-2 p-3 border rounded-lg bg-white w-fit max-w-md">
                          <Music className="w-5 h-5 text-purple-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{announcement.audio_name || 'Audio File'}</p>
                            <audio src={announcement.audio_url} controls className="w-full mt-2" />
                          </div>
                        </div>
                      </div>
                    )}

                    {announcement.file_url && (
                      <div className="mb-3">
                        <a 
                          href={announcement.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors w-fit"
                        >
                          <FileText className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-medium">{announcement.file_name || 'Download Attachment'}</span>
                        </a>
                      </div>
                    )}

                    <Separator className="my-3" />

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Posted {format(new Date(announcement.created_date), 'MMM d, yyyy h:mm a')}
                      </div>
                      {announcement.expires_at && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Expires {format(new Date(announcement.expires_at), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}