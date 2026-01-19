import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Image, Video, Send, Loader2, X, Upload, FileText, Music } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

export default function CreatePost({ onPostCreated }) {
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('none');
  const [audioUrl, setAudioUrl] = useState('');
  const [audioName, setAudioName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingType, setUploadingType] = useState('');
  const [uploadFileSize, setUploadFileSize] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    loadUser();
  }, []);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const estimateUploadTime = (bytes) => {
    const mbps = 1;
    const mb = bytes / (1024 * 1024);
    const seconds = mb / mbps;
    
    if (seconds < 60) {
      return `~${Math.ceil(seconds)} seconds`;
    } else {
      const minutes = Math.ceil(seconds / 60);
      return `~${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === 'image' && !file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (type === 'video' && !file.type.startsWith('video/')) {
      alert('Please select a video file');
      return;
    }
    if (type === 'audio' && !file.type.startsWith('audio/')) {
      alert('Please select an audio file');
      return;
    }

    const fileSize = file.size;
    const fileSizeMB = fileSize / (1024 * 1024);

    if (fileSizeMB > 100 && (type === 'video' || type === 'file')) {
      const proceed = confirm(
        `This file is ${formatFileSize(fileSize)} and may take ${estimateUploadTime(fileSize)} to upload.\n\nDo you want to continue?`
      );
      if (!proceed) return;
    }

    setIsUploading(true);
    setUploadingType(type);
    setUploadFileSize(fileSize);
    
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      
      if (type === 'image') {
        setMediaUrl(result.file_url);
        setMediaType('image');
      } else if (type === 'video') {
        setMediaUrl(result.file_url);
        setMediaType('video');
      } else if (type === 'audio') {
        setAudioUrl(result.file_url);
        setAudioName(file.name);
      } else if (type === 'file') {
        setFileUrl(result.file_url);
        setFileName(file.name);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadingType('');
      setUploadFileSize(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !mediaUrl && !audioUrl && !fileUrl) {
      alert('Please add some content or media to your post');
      return;
    }

    setIsSubmitting(true);
    try {
      await base44.entities.Post.create({
        content: content.trim(),
        media_url: mediaUrl,
        media_type: mediaType,
        audio_url: audioUrl,
        audio_name: audioName,
        file_url: fileUrl,
        file_name: fileName,
        author_name: currentUser?.full_name || 'Unknown User',
        author_email: currentUser?.email || '',
        status: 'pending',
        likes: [],
        comments: []
      });
      
      setContent('');
      setMediaUrl('');
      setMediaType('none');
      setAudioUrl('');
      setAudioName('');
      setFileUrl('');
      setFileName('');
      
      alert('Your post has been submitted and is pending admin approval. It will be visible once approved.');
      
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Error creating post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeMedia = () => {
    setMediaUrl('');
    setMediaType('none');
  };

  const removeAudio = () => {
    setAudioUrl('');
    setAudioName('');
  };

  const removeFile = () => {
    setFileUrl('');
    setFileName('');
  };

  return (
    <Card className="shadow-md w-full min-w-0">
      <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6 pb-3 sm:pb-6 w-full min-w-0">
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 w-full min-w-0">
          <div className="flex items-start gap-2 sm:gap-3 w-full min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0 text-xs sm:text-base">
              {currentUser?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your wins, updates, or ask questions..."
                className="min-h-[60px] sm:min-h-[80px] resize-none text-xs sm:text-sm w-full"
                disabled={isSubmitting || isUploading}
              />
            </div>
          </div>

          {isUploading && (
            <Alert className="border-blue-500 bg-blue-50 w-full">
              <Upload className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
              <AlertDescription className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 sm:h-4 sm:h-4 animate-spin text-blue-600" />
                  <span className="text-blue-800 font-medium text-xs sm:text-sm">
                    Uploading {uploadingType}... Please wait
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] sm:text-xs text-blue-700">
                    <span>File size: {formatFileSize(uploadFileSize)}</span>
                    <span className="hidden sm:inline">Estimated time: {estimateUploadTime(uploadFileSize)}</span>
                  </div>
                  <Progress value={undefined} className="h-2 bg-blue-200" />
                </div>
              </AlertDescription>
            </Alert>
          )}

          {mediaUrl && (
            <div className="relative w-full">
              {mediaType === 'image' && (
                <img src={mediaUrl} alt="Upload preview" className="w-full max-h-48 sm:max-h-64 object-contain rounded-lg border bg-gray-50" />
              )}
              {mediaType === 'video' && (
                <video src={mediaUrl} controls className="w-full max-h-48 sm:max-h-64 rounded-lg border" />
              )}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={removeMedia}
                className="absolute top-2 right-2 h-7 w-7 sm:h-8 sm:w-8"
                disabled={isSubmitting}
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          )}

          {audioUrl && (
            <div className="relative flex items-center gap-2 p-2 sm:p-3 border rounded-lg bg-white w-full min-w-0">
              <Music className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium truncate">{audioName}</p>
                <audio src={audioUrl} controls className="w-full mt-1 sm:mt-2 h-8 sm:h-10" />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={removeAudio}
                disabled={isSubmitting}
                className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          )}

          {fileUrl && (
            <div className="relative flex items-center gap-2 p-2 sm:p-3 border rounded-lg bg-white w-full min-w-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium truncate">{fileName}</p>
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] sm:text-xs text-blue-600 hover:underline">
                  Download File
                </a>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={removeFile}
                disabled={isSubmitting}
                className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0 pt-2 border-t w-full">
            <div className="flex gap-1 sm:gap-2 flex-wrap w-full sm:w-auto">
              <label htmlFor="image-upload" className="flex-1 sm:flex-initial">
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'image')}
                  className="hidden"
                  disabled={isSubmitting || isUploading || mediaUrl}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isSubmitting || isUploading || mediaUrl}
                  onClick={() => document.getElementById('image-upload').click()}
                  className="w-full sm:w-auto text-[10px] sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                >
                  <Image className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Photo</span>
                </Button>
              </label>
              
              <label htmlFor="video-upload" className="flex-1 sm:flex-initial">
                <input
                  id="video-upload"
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFileUpload(e, 'video')}
                  className="hidden"
                  disabled={isSubmitting || isUploading || mediaUrl}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isSubmitting || isUploading || mediaUrl}
                  onClick={() => document.getElementById('video-upload').click()}
                  className="w-full sm:w-auto text-[10px] sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                >
                  <Video className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Video</span>
                </Button>
              </label>

              <label htmlFor="audio-upload" className="flex-1 sm:flex-initial">
                <input
                  id="audio-upload"
                  type="file"
                  accept="audio/*"
                  onChange={(e) => handleFileUpload(e, 'audio')}
                  className="hidden"
                  disabled={isSubmitting || isUploading || audioUrl}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isSubmitting || isUploading || audioUrl}
                  onClick={() => document.getElementById('audio-upload').click()}
                  className="w-full sm:w-auto text-[10px] sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                >
                  <Music className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Audio</span>
                </Button>
              </label>

              <label htmlFor="file-upload" className="flex-1 sm:flex-initial">
                <input
                  id="file-upload"
                  type="file"
                  onChange={(e) => handleFileUpload(e, 'file')}
                  className="hidden"
                  disabled={isSubmitting || isUploading || fileUrl}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isSubmitting || isUploading || fileUrl}
                  onClick={() => document.getElementById('file-upload').click()}
                  className="w-full sm:w-auto text-[10px] sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                >
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">File</span>
                </Button>
              </label>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || isUploading || (!content.trim() && !mediaUrl && !audioUrl && !fileUrl)}
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9"
            >
              {isSubmitting ? (
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              )}
              {isSubmitting ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}