import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Plus, Edit, Trash2, Loader2, Upload, X, Image, Video, Music, FileText } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ManageAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    priority: 'normal',
    is_active: true,
    expires_at: '',
    image_url: '',
    video_url: '',
    audio_url: '',
    audio_name: '',
    file_url: '',
    file_name: ''
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const data = await base44.entities.Announcement.list('-created_date', 50);
      setAnnouncements(data);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      
      if (type === 'image') {
        setFormData(prev => ({ ...prev, image_url: result.file_url }));
      } else if (type === 'video') {
        setFormData(prev => ({ ...prev, video_url: result.file_url }));
      } else if (type === 'audio') {
        setFormData(prev => ({ ...prev, audio_url: result.file_url, audio_name: file.name }));
      } else if (type === 'file') {
        setFormData(prev => ({ ...prev, file_url: result.file_url, file_name: file.name }));
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      alert('Title and message are required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingAnnouncement) {
        await base44.entities.Announcement.update(editingAnnouncement.id, formData);
      } else {
        await base44.entities.Announcement.create(formData);
      }
      
      setIsDialogOpen(false);
      setEditingAnnouncement(null);
      resetForm();
      loadAnnouncements();
    } catch (error) {
      console.error('Error saving announcement:', error);
      alert('Error saving announcement. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      message: announcement.message,
      priority: announcement.priority,
      is_active: announcement.is_active,
      expires_at: announcement.expires_at || '',
      image_url: announcement.image_url || '',
      video_url: announcement.video_url || '',
      audio_url: announcement.audio_url || '',
      audio_name: announcement.audio_name || '',
      file_url: announcement.file_url || '',
      file_name: announcement.file_name || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    
    try {
      await base44.entities.Announcement.delete(id);
      loadAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Error deleting announcement. Please try again.');
    }
  };

  const handleToggleActive = async (announcement) => {
    try {
      await base44.entities.Announcement.update(announcement.id, {
        is_active: !announcement.is_active
      });
      loadAnnouncements();
    } catch (error) {
      console.error('Error updating announcement:', error);
      alert('Error updating announcement. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      priority: 'normal',
      is_active: true,
      expires_at: '',
      image_url: '',
      video_url: '',
      audio_url: '',
      audio_name: '',
      file_url: '',
      file_name: ''
    });
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    normal: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-blue-600" />
                Manage Announcements
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Create and manage announcements that appear on the dashboard
              </p>
            </div>
            <Button onClick={() => { resetForm(); setEditingAnnouncement(null); setIsDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              New Announcement
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No announcements yet. Create your first announcement!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map(announcement => (
                <Card key={announcement.id} className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{announcement.title}</h3>
                          <Badge className={priorityColors[announcement.priority]}>
                            {announcement.priority}
                          </Badge>
                          {announcement.is_active ? (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{announcement.message}</p>
                        <div className="text-xs text-gray-500">
                          Created {format(new Date(announcement.created_date), 'MMM d, yyyy')}
                          {announcement.expires_at && ` • Expires ${format(new Date(announcement.expires_at), 'MMM d, yyyy')}`}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(announcement)}
                        >
                          {announcement.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(announcement)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(announcement.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {(announcement.image_url || announcement.video_url || announcement.audio_url || announcement.file_url) && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-xs text-gray-500 mb-2">Attachments:</div>
                        <div className="flex gap-2 flex-wrap">
                          {announcement.image_url && <Badge variant="outline"><Image className="w-3 h-3 mr-1" />Image</Badge>}
                          {announcement.video_url && <Badge variant="outline"><Video className="w-3 h-3 mr-1" />Video</Badge>}
                          {announcement.audio_url && <Badge variant="outline"><Music className="w-3 h-3 mr-1" />Audio</Badge>}
                          {announcement.file_url && <Badge variant="outline"><FileText className="w-3 h-3 mr-1" />File</Badge>}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
            <DialogDescription>
              Create an announcement that will be displayed to all users on the dashboard
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Important Update"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Enter your announcement message..."
                className="min-h-[100px]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires_at">Expiration Date (Optional)</Label>
                <Input
                  id="expires_at"
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Active (visible to users)</Label>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-medium">Attachments (Optional)</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="image-upload">Image</Label>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'image')}
                    disabled={isUploading}
                  />
                  {formData.image_url && (
                    <div className="mt-2 relative">
                      <img src={formData.image_url} alt="Preview" className="w-full h-20 object-cover rounded" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1"
                        onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="video-upload">Video</Label>
                  <Input
                    id="video-upload"
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileUpload(e, 'video')}
                    disabled={isUploading}
                  />
                  {formData.video_url && (
                    <div className="mt-2 flex items-center justify-between p-2 bg-green-50 rounded">
                      <span className="text-sm">Video uploaded</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, video_url: '' }))}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="audio-upload">Audio</Label>
                  <Input
                    id="audio-upload"
                    type="file"
                    accept="audio/*"
                    onChange={(e) => handleFileUpload(e, 'audio')}
                    disabled={isUploading}
                  />
                  {formData.audio_url && (
                    <div className="mt-2 flex items-center justify-between p-2 bg-green-50 rounded">
                      <span className="text-sm truncate">{formData.audio_name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, audio_url: '', audio_name: '' }))}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="file-upload">File (PDF, Doc, etc.)</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    onChange={(e) => handleFileUpload(e, 'file')}
                    disabled={isUploading}
                  />
                  {formData.file_url && (
                    <div className="mt-2 flex items-center justify-between p-2 bg-green-50 rounded">
                      <span className="text-sm truncate">{formData.file_name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, file_url: '', file_name: '' }))}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isUploading}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingAnnouncement ? 'Update' : 'Create'} Announcement
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}