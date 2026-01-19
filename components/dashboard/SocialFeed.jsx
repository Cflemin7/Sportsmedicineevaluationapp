import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, MessageCircle, Send, Trash2, Loader2, Music, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Separator } from '@/components/ui/separator';

export default function SocialFeed({ refreshTrigger }) {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [showComments, setShowComments] = useState({});
  const [isSubmitting, setIsSubmitting] = useState({});

  useEffect(() => {
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

  useEffect(() => {
    loadPosts();
  }, [refreshTrigger, currentUser]);

  const loadPosts = async () => {
    if (!currentUser) return;
    
    try {
      const data = await base44.entities.Post.list('-created_date', 50);
      
      let filteredData = data;
      if (currentUser?.role !== 'admin') {
        // Regular users see approved posts OR posts without a status (legacy posts)
        filteredData = data.filter(post => !post.status || post.status === 'approved');
      }
      // Admins see all posts
      
      setPosts(filteredData);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (post) => {
    if (!currentUser) return;

    try {
      const userEmail = currentUser.email;
      const hasLiked = post.likes?.includes(userEmail);
      
      const newLikes = hasLiked
        ? post.likes.filter(email => email !== userEmail)
        : [...(post.likes || []), userEmail];

      await base44.entities.Post.update(post.id, { likes: newLikes });
      loadPosts();
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  const handleComment = async (postId) => {
    const commentText = commentInputs[postId]?.trim();
    if (!commentText || !currentUser) return;

    setIsSubmitting(prev => ({ ...prev, [postId]: true }));
    try {
      const post = posts.find(p => p.id === postId);
      const newComment = {
        author_name: currentUser.full_name,
        author_email: currentUser.email,
        content: commentText,
        created_at: new Date().toISOString()
      };

      const updatedComments = [...(post.comments || []), newComment];
      await base44.entities.Post.update(postId, { comments: updatedComments });
      
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      loadPosts();
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Error adding comment. Please try again.');
    } finally {
      setIsSubmitting(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await base44.entities.Post.delete(postId);
      loadPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Error deleting post. Please try again.');
    }
  };

  const toggleComments = (postId) => {
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const canDeletePost = (post) => {
    if (!currentUser) return false;
    return currentUser.role === 'admin' || post.author_email === currentUser.email;
  };

  if (isLoading) {
    return (
      <Card className="shadow-md w-full min-w-0">
        <CardContent className="p-4 sm:p-6">
          <div className="flex justify-center items-center h-32">
            <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (posts.length === 0) {
    return (
      <Card className="shadow-md w-full min-w-0">
        <CardContent className="p-4 sm:p-6 text-center text-gray-500">
          <p className="text-xs sm:text-sm">No posts yet. Be the first to share your wins!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 w-full min-w-0">
      {posts.map(post => {
        const hasLiked = post.likes?.includes(currentUser?.email);
        const likeCount = post.likes?.length || 0;
        const commentCount = post.comments?.length || 0;
        const isPending = post.status === 'pending';
        const isRejected = post.status === 'rejected';

        return (
          <Card key={post.id} className="shadow-md hover:shadow-lg transition-shadow w-full min-w-0">
            <CardContent className="p-3 sm:p-4 md:p-6 w-full min-w-0">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0 text-xs sm:text-base">
                    {post.author_name?.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{post.author_name}</h4>
                    <p className="text-[10px] sm:text-xs text-gray-500">
                      {formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}
                    </p>
                    {currentUser?.role === 'admin' && (
                      <div className="mt-1">
                        {isPending && (
                          <Badge className="bg-yellow-100 text-yellow-800 text-[10px]">
                            Pending Review
                          </Badge>
                        )}
                        {isRejected && (
                          <Badge className="bg-red-100 text-red-800 text-[10px]">
                            Rejected
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {canDeletePost(post) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePost(post.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 w-7 sm:h-8 sm:w-8 p-0"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                )}
              </div>

              {post.content && (
                <p className="text-gray-800 mb-3 sm:mb-4 whitespace-pre-wrap text-xs sm:text-sm break-words">{post.content}</p>
              )}

              {post.media_url && (
                <div className="mb-3 sm:mb-4 w-full">
                  {post.media_type === 'image' && (
                    <img 
                      src={post.media_url} 
                      alt="Post media" 
                      className="w-full rounded-lg border max-h-64 sm:max-h-96 object-contain bg-gray-50"
                    />
                  )}
                  {post.media_type === 'video' && (
                    <video 
                      src={post.media_url} 
                      controls 
                      className="w-full rounded-lg border max-h-64 sm:max-h-96"
                    />
                  )}
                </div>
              )}

              {post.audio_url && (
                <div className="mb-3 sm:mb-4 w-full">
                  <div className="flex items-center gap-2 p-2 sm:p-3 border rounded-lg bg-white w-full min-w-0">
                    <Music className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium truncate">{post.audio_name || 'Audio File'}</p>
                      <audio src={post.audio_url} controls className="w-full mt-1 sm:mt-2 h-8 sm:h-10" />
                    </div>
                  </div>
                </div>
              )}

              {post.file_url && (
                <div className="mb-3 sm:mb-4 w-full">
                  <a 
                    href={post.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 sm:p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors w-full min-w-0"
                  >
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium truncate">{post.file_name || 'Download Attachment'}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500">Click to download</p>
                    </div>
                  </a>
                </div>
              )}

              <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                {likeCount > 0 && (
                  <span>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</span>
                )}
                {commentCount > 0 && (
                  <span>{commentCount} {commentCount === 1 ? 'comment' : 'comments'}</span>
                )}
              </div>

              <Separator className="my-2 sm:my-3" />

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(post)}
                  className={`flex-1 text-xs sm:text-sm h-8 sm:h-9 ${hasLiked ? 'text-blue-600' : 'text-gray-600'}`}
                >
                  <ThumbsUp className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${hasLiked ? 'fill-current' : ''}`} />
                  {hasLiked ? 'Liked' : 'Like'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleComments(post.id)}
                  className="flex-1 text-gray-600 text-xs sm:text-sm h-8 sm:h-9"
                >
                  <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Comment
                </Button>
              </div>

              {showComments[post.id] && (
                <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3 pt-3 border-t">
                  {post.comments?.map((comment, idx) => (
                    <div key={idx} className="flex gap-2">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-[10px] sm:text-sm font-semibold flex-shrink-0">
                        {comment.author_name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1 bg-gray-100 rounded-lg p-2 sm:p-3 min-w-0">
                        <p className="font-semibold text-xs sm:text-sm truncate">{comment.author_name}</p>
                        <p className="text-xs sm:text-sm text-gray-800 mt-1 break-words">{comment.content}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-2 items-start pt-2">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] sm:text-sm font-semibold flex-shrink-0">
                      {currentUser?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 flex gap-2 min-w-0">
                      <Input
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                        placeholder="Write a comment..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleComment(post.id);
                          }
                        }}
                        disabled={isSubmitting[post.id]}
                        className="flex-1 text-xs sm:text-sm h-8 sm:h-9 min-w-0"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleComment(post.id)}
                        disabled={!commentInputs[post.id]?.trim() || isSubmitting[post.id]}
                        className="bg-blue-600 hover:bg-blue-700 h-8 sm:h-9 px-2 sm:px-3 flex-shrink-0"
                      >
                        {isSubmitting[post.id] ? (
                          <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}