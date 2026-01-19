import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Activity, CheckCircle, Building2, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const StatCard = ({ title, value, icon: Icon, bgColor, trend, isLoading }) => (
  <Card className="relative overflow-hidden hover:shadow-lg transition-shadow duration-200">
    <div className={`absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 transform translate-x-6 -translate-y-6 ${bgColor} rounded-full opacity-10`} />
    <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 pt-3 sm:px-6 sm:pt-6">
      <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">{title}</CardTitle>
      <div className={`p-1.5 sm:p-2 rounded-lg ${bgColor} bg-opacity-20`}>
        <Icon className={`w-3 h-3 sm:w-4 sm:h-4 ${bgColor.replace('bg-', 'text-')}`} />
      </div>
    </CardHeader>
    <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
      {isLoading ? (
        <Skeleton className="h-8 w-16" />
      ) : (
        <div className="text-xl sm:text-2xl font-bold text-gray-900">{value}</div>
      )}
      {trend && (
        <div className="flex items-center mt-1 sm:mt-2 text-xs sm:text-sm">
          <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
          <span className="text-green-500 font-medium">{trend}</span>
        </div>
      )}
    </CardContent>
  </Card>
);

export default function StatsGrid() {
  const [stats, setStats] = useState({
    totalEvaluations: 0,
    activeEvaluations: 0,
    completedThisMonth: 0,
    totalAccounts: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [evaluations, accounts] = await Promise.all([
        base44.entities.Evaluation.list('-created_date', 1000),
        base44.entities.Account.list('-created_date', 500)
      ]);

      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();

      const completedThisMonth = evaluations.filter(e => {
        if (e.status !== 'completed') return false;
        const dateStr = e.updated_date || e.created_date;
        if (!dateStr) return false;
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return false;
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
      }).length;

      setStats({
        totalEvaluations: evaluations.length,
        activeEvaluations: evaluations.filter(e => e.status === 'active').length,
        completedThisMonth,
        totalAccounts: accounts.length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 w-full">
      <StatCard
        title="Total Evaluations"
        value={stats.totalEvaluations}
        icon={FileText}
        bgColor="bg-blue-500"
        trend="12% this month"
        isLoading={isLoading}
      />
      <StatCard
        title="Active Evaluations"
        value={stats.activeEvaluations}
        icon={Activity}
        bgColor="bg-green-500"
        trend="8% increase"
        isLoading={isLoading}
      />
      <StatCard
        title="Completed This Month"
        value={stats.completedThisMonth}
        icon={CheckCircle}
        bgColor="bg-purple-500"
        isLoading={isLoading}
      />
      <StatCard
        title="Total Accounts"
        value={stats.totalAccounts}
        icon={Building2}
        bgColor="bg-orange-500"
        trend="5 new accounts"
        isLoading={isLoading}
      />
    </div>
  );
}