import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User as UserIcon, Loader2, AlertCircle, Calendar, Upload, Camera, X, Briefcase, FileText, Lock, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, differenceInDays } from 'date-fns';

const PasswordWarningBanner = ({ createdDate }) => {
  if (!createdDate) return null;
  
  const daysSinceCreation = differenceInDays(new Date(), new Date(createdDate));
  const daysUntilExpiration = 90 - daysSinceCreation;
  
  if (daysUntilExpiration > 30) return null;
  
  if (daysUntilExpiration <= 0) {
    return (
      <Alert className="border-red-500 bg-red-50 mb-6">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <div className="space-y-2">
            <p className="font-semibold">⚠️ Password Expired</p>
            <p className="text-sm">
              Your password has expired. Please contact your system administrator to reset your password.
            </p>
          </div>
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Alert className="border-orange-500 bg-orange-50 mb-6">
      <AlertCircle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-800">
        <div className="space-y-2">
          <p className="font-semibold">Password Expiration Warning</p>
          <p className="text-sm">
            Your password will expire in <strong>{daysUntilExpiration} days</strong>. 
            Please contact your system administrator to update your password before it expires.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default function MyProfile() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    title: '',
    bio: '',
    territory: '',
    employee_id: '',
    phone_number: '',
    region: '',
    specialization: '',
    manager_email: '',
    profile_picture_url: ''
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setFormData({
        first_name: currentUser.first_name || '',
        last_name: currentUser.last_name || '',
        title: currentUser.title || '',
        bio: currentUser.bio || '',
        territory: currentUser.territory || '',
        employee_id: currentUser.employee_id || '',
        phone_number: currentUser.phone_number || '',
        region: currentUser.region || '',
        specialization: currentUser.specialization || 'Sports Medicine',
        manager_email: currentUser.manager_email || '',
        profile_picture_url: currentUser.profile_picture_url || ''
      });
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setIsUploadingPicture(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      const newProfilePictureUrl = result.file_url;
      
      // Update in database
      await base44.auth.updateMe({ profile_picture_url: newProfilePictureUrl });
      
      // Update local state
      setFormData(prev => ({ ...prev, profile_picture_url: newProfilePictureUrl }));
      setUser(prev => ({ ...prev, profile_picture_url: newProfilePictureUrl }));
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Error uploading profile picture. Please try again.');
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    if (!confirm('Are you sure you want to remove your profile picture?')) {
      return;
    }

    setIsUploadingPicture(true);
    try {
      await base44.auth.updateMe({ profile_picture_url: '' });
      setFormData(prev => ({ ...prev, profile_picture_url: '' }));
      setUser(prev => ({ ...prev, profile_picture_url: '' }));
    } catch (error) {
      console.error('Error removing profile picture:', error);
      alert('Error removing profile picture. Please try again.');
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const required = ['first_name', 'last_name', 'territory', 'employee_id', 'phone_number', 'region', 'manager_email'];
    const missing = required.filter(field => !formData[field]?.trim());
    
    if (missing.length > 0) {
      alert(`Please fill in all required fields: ${missing.map(f => f.replace(/_/g, ' ')).join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await base44.auth.updateMe(formData);
      alert('Profile updated successfully!');
      await loadUserData();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }

    setIsChangingPassword(true);
    try {
      await base44.auth.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert('Password changed successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      alert(error.message || 'Failed to change password. Please check your current password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("Dashboard")}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600">Manage your personal information</p>
            </div>
          </div>
        </div>

        <PasswordWarningBanner createdDate={user?.created_date} />

        <div className="flex items-center gap-4 mb-6">
          <Badge variant="outline" className="flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            Member since {user?.created_date ? format(new Date(user.created_date), 'MMM d, yyyy') : 'N/A'}
          </Badge>
          {user?.role === 'admin' && (
            <Badge className="bg-blue-600">Admin</Badge>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-blue-600" />
              Profile Picture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Profile Picture Display */}
              <div className="relative">
                {formData.profile_picture_url ? (
                  <div className="relative">
                    <img
                      src={formData.profile_picture_url}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-lg"
                    />
                    {!isUploadingPicture && (
                      <button
                        type="button"
                        onClick={handleRemoveProfilePicture}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </div>
                )}
                {isUploadingPicture && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Profile Picture</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Upload a professional photo (max 5MB, JPG or PNG)
                  </p>
                </div>
                <div className="flex gap-2">
                  <Label htmlFor="profile-picture" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      {isUploadingPicture ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4" />
                          {formData.profile_picture_url ? 'Change Picture' : 'Upload Picture'}
                        </>
                      )}
                    </div>
                  </Label>
                  <Input
                    id="profile-picture"
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureUpload}
                    disabled={isUploadingPicture}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Title & Bio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title / Position</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Senior Sales Consultant, Territory Manager"
              />
              <p className="text-xs text-gray-500">Your current role or position</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio / About Me</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell your team a bit about yourself, your experience, interests, or what you specialize in..."
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">Share your background, experience, or interests with your team</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-blue-600" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Read-only Email */}
            <div className="space-y-2">
              <Label>Email Address (Read-only)</Label>
              <Input
                value={user?.email || ''}
                disabled
                className="bg-gray-50"
              />
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="John"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            {/* Work Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee_id">Employee ID *</Label>
                <Input
                  id="employee_id"
                  value={formData.employee_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                  placeholder="EMP-12345"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number *</Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                  placeholder="(555) 123-4567"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="territory">Territory *</Label>
                <Input
                  id="territory"
                  value={formData.territory}
                  onChange={(e) => setFormData(prev => ({ ...prev, territory: e.target.value }))}
                  placeholder="Northeast Region"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Region *</Label>
                <Select 
                  value={formData.region} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, region: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Northeast">Northeast</SelectItem>
                    <SelectItem value="Southeast">Southeast</SelectItem>
                    <SelectItem value="Midwest">Midwest</SelectItem>
                    <SelectItem value="Southwest">Southwest</SelectItem>
                    <SelectItem value="West">West</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Select 
                  value={formData.specialization} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, specialization: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sports Medicine">Sports Medicine</SelectItem>
                    <SelectItem value="Orthopedic Trauma">Orthopedic Trauma</SelectItem>
                    <SelectItem value="Spine">Spine</SelectItem>
                    <SelectItem value="General Orthopedics">General Orthopedics</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manager_email">Territory Manager Email *</Label>
                <Input
                  id="manager_email"
                  type="email"
                  value={formData.manager_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, manager_email: e.target.value }))}
                  placeholder="manager@jnjmedtech.com"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Password Change Section */}
      <Card className="shadow-lg mt-6 bg-slate-800 border-slate-700">
        <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-900">
          <CardTitle className="flex items-center gap-2 text-white">
            <Lock className="w-5 h-5" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-slate-200">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  required
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pr-10"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-slate-200">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  required
                  minLength={8}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pr-10"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-400">Must be at least 8 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-200">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pr-10"
                  placeholder="Re-enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isChangingPassword}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Changing Password...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}