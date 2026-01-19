import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, TrendingUp, MessageSquare, Bell, FileCheck, Megaphone, Package } from 'lucide-react';

import StatsGrid from '../components/dashboard/StatsGrid';
import RecentEvaluations from '../components/dashboard/RecentEvaluations';
import QuickActions from '../components/dashboard/QuickActions';
import EvaluationManagement from '../components/dashboard/EvaluationManagement';
import CreatePost from '../components/dashboard/CreatePost';
import SocialFeed from '../components/dashboard/SocialFeed';
import AnnouncementBanner from '../components/dashboard/AnnouncementBanner';
import ModeratePosts from '../components/dashboard/ModeratePosts';
import ManageAnnouncements from '../components/dashboard/ManageAnnouncements';
import ManageSKUs from '../components/dashboard/ManageSKUs';
import BulkEvaluationUploader from '../components/dashboard/BulkEvaluationUploader';
import ExcelUploader from '../components/dashboard/ExcelUploader';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [refreshFeed, setRefreshFeed] = useState(0);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    loadUser();
  }, []);

  const handlePostCreated = () => {
    setRefreshFeed(prev => prev + 1);
  };

  return (
    <div className="w-full space-y-6">
      <AnnouncementBanner />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Sports Medicine Dashboard
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            View and manage your evaluations and team updates
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 lg:grid-cols-7 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2">
            <TrendingUp className="w-4 h-4 mr-0 sm:mr-2" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="evaluations" className="text-xs sm:text-sm py-2">
            <ClipboardList className="w-4 h-4 mr-0 sm:mr-2" />
            <span className="hidden sm:inline">Evaluations</span>
          </TabsTrigger>
          <TabsTrigger value="feed" className="text-xs sm:text-sm py-2">
            <MessageSquare className="w-4 h-4 mr-0 sm:mr-2" />
            <span className="hidden sm:inline">Team Feed</span>
          </TabsTrigger>
          {user?.role === 'admin' && (
            <>
              <TabsTrigger value="moderate" className="text-xs sm:text-sm py-2">
                <FileCheck className="w-4 h-4 mr-0 sm:mr-2" />
                <span className="hidden sm:inline">Moderate</span>
              </TabsTrigger>
              <TabsTrigger value="announcements" className="text-xs sm:text-sm py-2">
                <Megaphone className="w-4 h-4 mr-0 sm:mr-2" />
                <span className="hidden sm:inline">Announcements</span>
              </TabsTrigger>
              <TabsTrigger value="accounts" className="text-xs sm:text-sm py-2">
                <Bell className="w-4 h-4 mr-0 sm:mr-2" />
                <span className="hidden sm:inline">Upload Accounts</span>
              </TabsTrigger>
              <TabsTrigger value="skus" className="text-xs sm:text-sm py-2">
                <Package className="w-4 h-4 mr-0 sm:mr-2" />
                <span className="hidden sm:inline">Manage SKUs</span>
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <StatsGrid />
          <div className="grid gap-6 md:grid-cols-2">
            <RecentEvaluations />
            <QuickActions />
          </div>
        </TabsContent>

        <TabsContent value="evaluations" className="space-y-6">
          {user?.role === 'admin' && (
            <BulkEvaluationUploader onSuccess={() => setRefreshFeed(prev => prev + 1)} />
          )}
          <EvaluationManagement />
        </TabsContent>

        <TabsContent value="feed" className="space-y-6">
          <CreatePost onPostCreated={handlePostCreated} />
          <SocialFeed refreshTrigger={refreshFeed} />
        </TabsContent>

        {user?.role === 'admin' && (
          <>
            <TabsContent value="moderate" className="space-y-6">
              <ModeratePosts />
            </TabsContent>
            
            <TabsContent value="announcements" className="space-y-6">
              <ManageAnnouncements />
            </TabsContent>

            <TabsContent value="accounts" className="space-y-6">
              <ExcelUploader type="Account" onSuccess={() => setRefreshFeed(prev => prev + 1)} />
            </TabsContent>

            <TabsContent value="skus" className="space-y-6">
              <ManageSKUs />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}