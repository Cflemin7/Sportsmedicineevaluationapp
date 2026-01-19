import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User as UserIcon, Mail, Phone, MapPin, Building2, Award, Calendar, Loader2, Briefcase, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';

export default function UserProfile() {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const userId = urlParams.get('id');
  
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await base44.entities.User.get(userId);
        setUser(userData);
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!userId || !user) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardContent className="p-8 text-center">
            <p className="text-gray-600 mb-4">User not found</p>
            <Link to={createPageUrl("ManageUsers")}>
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Users
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to={createPageUrl("ManageUsers")}>
          <Button variant="outline" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg mb-6">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center gap-6">
            {/* Profile Picture */}
            <div>
              {user.profile_picture_url ? (
                <img
                  src={user.profile_picture_url}
                  alt={`${user.full_name}'s profile`}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-lg">
                  {user.first_name?.[0]}{user.last_name?.[0]}
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">
                {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User Profile'}
              </CardTitle>
              {user.title && (
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-4 h-4" />
                  <span className="text-blue-100">{user.title}</span>
                </div>
              )}
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4" />
                <span className="text-blue-100">{user.email}</span>
              </div>
              {user.role === 'admin' && (
                <Badge className="bg-white text-blue-600">Admin</Badge>
              )}
            </div>
          </div>
        </CardHeader>

        {user.bio && (
          <CardContent className="p-6 border-b">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">About</h3>
                <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{user.bio}</p>
              </div>
            </div>
          </CardContent>
        )}

        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Contact & Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            {user.phone_number && (
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Phone Number</p>
                  <p className="font-medium">{user.phone_number}</p>
                </div>
              </div>
            )}

            {/* Territory */}
            {user.territory && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Territory</p>
                  <p className="font-medium">{user.territory}</p>
                </div>
              </div>
            )}

            {/* Region */}
            {user.region && (
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Region</p>
                  <p className="font-medium">{user.region}</p>
                </div>
              </div>
            )}

            {/* Specialization */}
            {user.specialization && (
              <div className="flex items-start gap-3">
                <Award className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Specialization</p>
                  <p className="font-medium">{user.specialization}</p>
                </div>
              </div>
            )}

            {/* Employee ID */}
            {user.employee_id && (
              <div className="flex items-start gap-3">
                <UserIcon className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Employee ID</p>
                  <p className="font-medium">{user.employee_id}</p>
                </div>
              </div>
            )}

            {/* Manager Email */}
            {user.manager_email && (
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Territory Manager</p>
                  <p className="font-medium">{user.manager_email}</p>
                </div>
              </div>
            )}

            {/* Member Since */}
            {user.created_date && (
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Member Since</p>
                  <p className="font-medium">{format(new Date(user.created_date), 'MMMM d, yyyy')}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}