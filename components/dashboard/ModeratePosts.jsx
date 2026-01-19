import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Loader2, Music, FileText, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ModeratePosts() {
  const [pendingPosts, setPendingPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [rejectDialog, setRejectDialog] = useState({ open: false, postId: null });
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadCurrentUser();
    loadPendingPosts();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadPendingPosts = async () => {
    try {
      const data = await base44.entities.Post.list('-created_date', 100);
      const pending = data.filter(post => post.status === 'pending');
      setPendingPosts(pending);
    } catch (error) {
      console.error('Error loading pending posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (postId) => {
    if (!currentUser) return;
    
    setIsProcessing(true);
    try {
      await base44.entities.Post.update(postId, {
        status: 'approved',
        reviewed_by: currentUser.email,
        reviewed_at: new Date().toISOString()
      });
      
      await loadPendingPosts();
    } catch (error) {
      console.error('Error approving post:', error);
      alert('Error approving post. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!currentUser || !rejectDialog.postId) return;
    
    setIsProcessing(true);
    try {
      await base44.entities.Post.update(rejectDialog.postId, {
        status: 'rejected',
        reviewed_by: currentUser.email,
        reviewed_at: new Date().toISOString(),
        rejection_reason: rejectionReason.trim() || 'No reason provided'
      });
      
      setRejectDialog({ open: false, postId: null });
      setRejectionReason('');
      await loadPendingPosts();
    } catch (error) {
      console.error('Error rejecting post:', error);
      alert('Error rejecting post. Please try again.');
    } finally {
      setIsProcessing(false);
    }
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
    <>
      <Card className="shadow-md">
        <CardHeader className="bg-yellow-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <CardTitle className="text-lg">Posts Pending Review</CardTitle>
            </div>
            <Badge className="bg-yellow-500 text-white">
              {pendingPosts.length} pending
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {pendingPosts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No posts pending review</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPosts.map(post => (
                <Card key={post.id} className="border-2 border-yellow-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {post.author_name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{post.author_name}</h4>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    {post.content && (
                      <p className="text-gray-800 mb-3 whitespace-pre-wrap text-sm">{post.content}</p>
                    )}

                    {post.media_url && (
                      <div className="mb-3">
                        {post.media_type === 'image' && (
                          <img 
                            src={post.media_url} 
                            alt="Post media" 
                            className="w-full rounded-lg border max-h-64 object-contain bg-gray-50"
                          />
                        )}
                        {post.media_type === 'video' && (
                          <video 
                            src={post.media_url} 
                            controls 
                            className="w-full rounded-lg border max-h-64"
                          />
                        )}
                      </div>
                    )}

                    {post.audio_url && (
                      <div className="mb-3">
                        <div className="flex items-center gap-2 p-3 border rounded-lg bg-white">
                          <Music className="w-5 h-5 text-purple-600 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{post.audio_name || 'Audio File'}</p>
                            <audio src={post.audio_url} controls className="w-full mt-2" />
                          </div>
                        </div>
                      </div>
                    )}

                    {post.file_url && (
                      <div className="mb-3">
                        <a 
                          href={post.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 border rounded-lg bg-white hover:bg-gray-50"
                        >
                          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{post.file_name || 'Download Attachment'}</p>
                            <p className="text-xs text-gray-500">Click to download</p>
                          </div>
                        </a>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => handleApprove(post.id)}
                        disabled={isProcessing}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => setRejectDialog({ open: true, postId: post.id })}
                        disabled={isProcessing}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={rejectDialog.open} onOpenChange={(open) => !isProcessing && setRejectDialog({ ...rejectDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Post</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this post. The author will be notified.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter rejection reason..."
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialog({ open: false, postId: null });
                setRejectionReason('');
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Reject Post'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}