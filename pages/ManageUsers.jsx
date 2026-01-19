import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Search, Users, Mail, Phone, MapPin, Award, Loader2, User as UserIcon, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, users]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const currentUserData = await base44.auth.me();
      setCurrentUser(currentUserData);

      if (currentUserData.role !== 'admin') {
        setAccessDenied(true);
        setIsLoading(false);
        return;
      }

      const usersData = await base44.entities.User.list('-created_date', 1000);
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = users.filter(user =>
      user.full_name?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      user.first_name?.toLowerCase().includes(term) ||
      user.last_name?.toLowerCase().includes(term) ||
      user.title?.toLowerCase().includes(term) ||
      user.territory?.toLowerCase().includes(term) ||
      user.region?.toLowerCase().includes(term) ||
      user.specialization?.toLowerCase().includes(term)
    );
    setFilteredUsers(filtered);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardContent className="p-8 text-center">
            <p className="text-gray-600 mb-4">Access denied. Admin privileges required.</p>
            <Link to={createPageUrl("Dashboard")}>
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("Dashboard")}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Team Directory</h1>
              <p className="text-gray-600">View all team members and their information</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View - Cards */}
      <div className="md:hidden space-y-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              No users found matching your search.
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id} className="shadow hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Profile Picture */}
                  <div className="flex-shrink-0">
                    {user.profile_picture_url ? (
                      <img
                        src={user.profile_picture_url}
                        alt={user.full_name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim()}
                      </h3>
                      {user.role === 'admin' && (
                        <Badge className="bg-blue-600">Admin</Badge>
                      )}
                    </div>
                    
                    {user.title && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Briefcase className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{user.title}</span>
                      </div>
                    )}
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      
                      {user.phone_number && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          <span>{user.phone_number}</span>
                        </div>
                      )}
                      
                      {user.territory && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span>{user.territory}</span>
                        </div>
                      )}
                      
                      {user.specialization && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Award className="w-3 h-3 flex-shrink-0" />
                          <span>{user.specialization}</span>
                        </div>
                      )}
                    </div>

                    <Link to={`${createPageUrl("UserProfile")}?id=${user.id}`}>
                      <Button variant="outline" size="sm" className="mt-3 w-full">
                        View Profile
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop View - Table */}
      <Card className="hidden md:block shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              All Users ({filteredUsers.length})
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Territory</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No users found matching your search criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {user.profile_picture_url ? (
                            <img
                              src={user.profile_picture_url}
                              alt={user.full_name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                              {user.first_name?.[0]}{user.last_name?.[0]}
                            </div>
                          )}
                          <div className="font-medium">
                            {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          {user.title && (
                            <>
                              <Briefcase className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate max-w-[150px]">{user.title}</span>
                            </>
                          )}
                          {!user.title && <span className="text-gray-400">—</span>}
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone_number || 'N/A'}</TableCell>
                      <TableCell>{user.territory || 'N/A'}</TableCell>
                      <TableCell>{user.region || 'N/A'}</TableCell>
                      <TableCell>
                        {user.role === 'admin' ? (
                          <Badge className="bg-blue-600">Admin</Badge>
                        ) : (
                          <Badge variant="outline">User</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link to={`${createPageUrl("UserProfile")}?id=${user.id}`}>
                          <Button variant="outline" size="sm">
                            <UserIcon className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}