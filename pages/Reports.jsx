import React, { useState, useEffect, useMemo } from "react";
import { Evaluation, Account, User } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, TrendingUp, BarChart3, PieChart, Calendar, Users, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Reports() {
  const [evaluations, setEvaluations] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6months');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [evalData, accountData, userData] = await Promise.all([
          Evaluation.list('-created_date', 500),
          Account.list('-created_date', 200),
          User.me().catch(() => null)
        ]);
        setEvaluations(evalData);
        setAccounts(accountData);
        setCurrentUser(userData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Filter evaluations by time range
  const filteredEvaluations = useMemo(() => {
    const now = new Date();
    let startDate;
    
    switch(timeRange) {
      case '1month':
        startDate = subMonths(now, 1);
        break;
      case '3months':
        startDate = subMonths(now, 3);
        break;
      case '6months':
        startDate = subMonths(now, 6);
        break;
      case '1year':
        startDate = subMonths(now, 12);
        break;
      default: // 'all' time range
        return evaluations;
    }
    
    return evaluations.filter(item => {
      if (!item.created_date) return false;
      const date = new Date(item.created_date);
      return !isNaN(date.getTime()) && date >= startDate;
    });
  }, [evaluations, timeRange]);

  // Evaluations over time (monthly)
  const evaluationsTrend = useMemo(() => {
    const now = new Date();
    const monthsToShow = timeRange === '1year' ? 12 : 6;
    const months = eachMonthOfInterval({
      start: subMonths(now, monthsToShow),
      end: now
    });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthEvals = filteredEvaluations.filter(item => {
        if (!item.created_date) return false;
        const evalDate = new Date(item.created_date);
        return !isNaN(evalDate.getTime()) && evalDate >= monthStart && evalDate <= monthEnd;
      });

      return {
        month: format(month, 'MMM yyyy'),
        total: monthEvals.length,
        completed: monthEvals.filter(item => item.status === 'completed').length,
        active: monthEvals.filter(item => item.status === 'active').length,
        cancelled: monthEvals.filter(item => item.status === 'cancelled').length
      };
    });
  }, [filteredEvaluations, timeRange]);

  // Status breakdown
  const statusBreakdown = useMemo(() => {
    const statuses = ['draft', 'submitted', 'approved', 'active', 'completed', 'cancelled'];
    return statuses.map(status => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: filteredEvaluations.filter(item => item.status === status).length
    })).filter(item => item.value > 0);
  }, [filteredEvaluations]);

  // Top accounts by evaluation count
  const topAccounts = useMemo(() => {
    const accountCounts = {};
    filteredEvaluations.forEach(evalItem => {
      const account = accounts.find(a => a.id === evalItem.account_id);
      if (account) {
        accountCounts[account.account_name] = (accountCounts[account.account_name] || 0) + 1;
      }
    });
    
    return Object.entries(accountCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  }, [filteredEvaluations, accounts]);

  // Sales consultant performance
  const consultantPerformance = useMemo(() => {
    const consultantData = {};
    filteredEvaluations.forEach(evalItem => {
      const name = evalItem.sales_consultant || 'Unknown';
      if (!consultantData[name]) {
        consultantData[name] = {
          total: 0,
          completed: 0,
          active: 0,
          conversionRate: 0
        };
      }
      consultantData[name].total++;
      if (evalItem.status === 'completed') consultantData[name].completed++;
      if (evalItem.status === 'active') consultantData[name].active++;
    });

    return Object.entries(consultantData)
      .map(([name, data]) => ({
        name,
        ...data,
        conversionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [filteredEvaluations]);

  // Product category analysis
  const categoryAnalysis = useMemo(() => {
    const categories = { capital_equipment: 0, disposable: 0 };
    
    filteredEvaluations.forEach(evalItem => {
      evalItem.requested_items?.forEach(item => {
        // Determine category from SKU code pattern
        const code = item.sku_code;
        if (code && String(code).startsWith('9')) { // Ensure code is not null/undefined and is string
          categories.capital_equipment++;
        } else if (code) { // Only count if code exists and is not capital equipment
          categories.disposable++;
        }
      });
    });

    return [
      { name: 'Capital Equipment', value: categories.capital_equipment },
      { name: 'Disposables', value: categories.disposable }
    ];
  }, [filteredEvaluations]);

  // Key metrics
  const keyMetrics = useMemo(() => {
    const completed = filteredEvaluations.filter(item => item.status === 'completed').length;
    const active = filteredEvaluations.filter(item => item.status === 'active').length;
    const conversionRate = filteredEvaluations.length > 0 
      ? Math.round((completed / filteredEvaluations.length) * 100) 
      : 0;
    
    const avgItemsPerEval = filteredEvaluations.length > 0
      ? Math.round(filteredEvaluations.reduce((sum, item) => sum + (item.requested_items?.length || 0), 0) / filteredEvaluations.length)
      : 0;

    return {
      total: filteredEvaluations.length,
      completed,
      active,
      conversionRate,
      avgItemsPerEval,
      uniqueAccounts: new Set(filteredEvaluations.map(item => item.account_id)).size
    };
  }, [filteredEvaluations]);

  const handleExport = () => {
    const csvData = filteredEvaluations.map(evalItem => {
      const account = accounts.find(a => a.id === evalItem.account_id);
      return {
        'Evaluation Number': evalItem.evaluation_number || evalItem.id?.slice(0, 8),
        'Account': account?.account_name || 'N/A',
        'Sales Consultant': evalItem.sales_consultant || 'N/A',
        'Status': evalItem.status,
        'Start Date': evalItem.evaluation_start_date || 'N/A',
        'End Date': evalItem.evaluation_end_date || 'N/A',
        'Items Count': evalItem.requested_items?.length || 0,
        'Created Date': evalItem.created_date && !isNaN(new Date(evalItem.created_date).getTime()) ? format(new Date(evalItem.created_date), 'yyyy-MM-dd') : 'N/A'
      };
    });

    if (csvData.length === 0) {
      alert("No data to export.");
      return;
    }

    const headers = Object.keys(csvData[0]);
    const csv = [
      headers.join(','),
      ...csvData.map(row => headers.map(h => {
        const value = row[h];
        // Handle potential commas or double quotes in values by wrapping in quotes and escaping existing quotes
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluations-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a); // Append to body to ensure it's clickable in all browsers
    a.click();
    document.body.removeChild(a); // Clean up
    window.URL.revokeObjectURL(url); // Free up memory
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="outline" size="sm" className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Sales Reports</h1>
            <p className="text-sm sm:text-base text-gray-600">Evaluation performance insights</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2 px-3 pt-3 sm:px-6 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Total</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600">{keyMetrics.total}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2 px-3 pt-3 sm:px-6 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Conv. Rate</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
              <div className="text-2xl sm:text-3xl font-bold text-green-600">{keyMetrics.conversionRate}%</div>
              <p className="text-xs text-gray-500 mt-1">{keyMetrics.completed} done</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2 px-3 pt-3 sm:px-6 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Active</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
              <div className="text-2xl sm:text-3xl font-bold text-purple-600">{keyMetrics.active}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2 px-3 pt-3 sm:px-6 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Accounts</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
              <div className="text-2xl sm:text-3xl font-bold text-orange-600">{keyMetrics.uniqueAccounts}</div>
              <p className="text-xs text-gray-500 mt-1">{keyMetrics.avgItemsPerEval} items/eval</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Tabs */}
        <Tabs defaultValue="trends" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="trends" className="text-xs sm:text-sm">Trends</TabsTrigger>
            <TabsTrigger value="status" className="text-xs sm:text-sm">Status</TabsTrigger>
            <TabsTrigger value="accounts" className="text-xs sm:text-sm">Accounts</TabsTrigger>
            <TabsTrigger value="performance" className="text-xs sm:text-sm">Team</TabsTrigger>
          </TabsList>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-4 mt-4">
            <Card className="shadow-sm">
              <CardHeader className="px-3 py-3 sm:px-6 sm:py-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <span className="text-sm sm:text-base">Evaluations Over Time</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={evaluationsTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Total" />
                    <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Done" />
                    <Line type="monotone" dataKey="active" stroke="#8b5cf6" strokeWidth={2} name="Active" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="px-3 py-3 sm:px-6 sm:py-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <span className="text-sm sm:text-base">Product Categories</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={categoryAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Status Tab */}
          <TabsContent value="status" className="space-y-4 mt-4">
            <Card className="shadow-sm">
              <CardHeader className="px-3 py-3 sm:px-6 sm:py-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <span className="text-sm sm:text-base">Status Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={statusBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                  </RePieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Accounts Tab */}
          <TabsContent value="accounts" className="space-y-4 mt-4">
            <Card className="shadow-sm">
              <CardHeader className="px-3 py-3 sm:px-6 sm:py-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <span className="text-sm sm:text-base">Top 10 Accounts</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topAccounts} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={100} 
                      tick={{ fontSize: 9 }}
                    />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4 mt-4">
            <Card className="shadow-sm">
              <CardHeader className="px-3 py-3 sm:px-6 sm:py-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <span className="text-sm sm:text-base">Top 10 Sales Team</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={consultantPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80}
                      tick={{ fontSize: 9 }}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="total" fill="#3b82f6" name="Total" />
                    <Bar dataKey="completed" fill="#10b981" name="Done" />
                    <Bar dataKey="active" fill="#8b5cf6" name="Active" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="px-3 py-3 sm:px-6 sm:py-6">
                <CardTitle className="text-base sm:text-lg">Sales Details</CardTitle>
              </CardHeader>
              <CardContent className="px-0 sm:px-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Name</th>
                        <th className="text-right p-2">Total</th>
                        <th className="text-right p-2">Done</th>
                        <th className="text-right p-2">Active</th>
                        <th className="text-right p-2">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consultantPerformance.map((consultant, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="p-2 text-xs sm:text-sm">{consultant.name}</td>
                          <td className="text-right p-2">{consultant.total}</td>
                          <td className="text-right p-2 text-green-600">{consultant.completed}</td>
                          <td className="text-right p-2 text-purple-600">{consultant.active}</td>
                          <td className="text-right p-2 font-semibold">{consultant.conversionRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}