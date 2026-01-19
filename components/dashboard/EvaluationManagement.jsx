import React, { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Eye, 
  Calendar,
  Building2,
  Users,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  RefreshCw,
  BarChart3,
  FileText,
  Trash2,
  Loader2,
  Send,
  X
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

const MetricCard = ({ title, value, icon: Icon, color, description }) => (
  <Card>
    <CardContent className="p-3 sm:p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-xl sm:text-2xl font-bold ${color}`}>{value}</p>
          {description && (
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-full ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${color}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function EvaluationManagement() {
  const [evaluations, setEvaluations] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [isUpdating, setIsUpdating] = useState(null);
  const [evaluationToDelete, setEvaluationToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [evalData, accountData, userData] = await Promise.all([
        base44.entities.Evaluation.list('-created_date', 500),
        base44.entities.Account.list('-created_date', 1000),
        base44.auth.me().catch(() => null)
      ]);
      
      // Check for evaluations with missing accounts and create placeholders if needed
      const accountIds = new Set(accountData.map(acc => acc.id));
      const missingAccountIds = [...new Set(evalData.map(e => e.account_id).filter(id => id && !accountIds.has(id)))];
      
      if (missingAccountIds.length > 0 && userData?.role === 'admin') {
        console.log(`Found ${missingAccountIds.length} evaluations with missing accounts. Creating placeholders...`);
        try {
          const newAccounts = await Promise.all(
            missingAccountIds.map(accountId => 
              base44.entities.Account.create({
                account_name: `Account (Recovered)`,
                account_type: 'community_hospital',
                contact_person: 'Needs Update',
                contact_email: 'update@required.com',
                id: accountId
              }).catch(() => null)
            )
          );
          // Reload accounts after creating placeholders
          const updatedAccountData = await base44.entities.Account.list('-created_date', 1000);
          setAccounts(updatedAccountData);
        } catch (error) {
          console.error('Error creating placeholder accounts:', error);
          setAccounts(accountData);
        }
      } else {
        setAccounts(accountData);
      }
      
      setEvaluations(evalData);
      setCurrentUser(userData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const accountMap = useMemo(() => new Map(accounts.map(acc => [acc.id, acc.account_name])), [accounts]);

  const canModifyEvaluation = (evaluation) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return evaluation.created_by === currentUser.email || 
           evaluation.sales_consultant_email === currentUser.email;
  };

  const handleStatusUpdate = async (evaluationId, newStatus) => {
    setIsUpdating(evaluationId);
    try {
      await base44.entities.Evaluation.update(evaluationId, { status: newStatus });
      loadData();
    } catch (error) {
      console.error("Error updating evaluation status:", error);
      alert(`Error updating status: ${error.message}`);
    }
    setIsUpdating(null);
  };

  const handleDeleteEvaluation = async () => {
    if (!evaluationToDelete) return;
    setIsDeleting(evaluationToDelete.id);
    try {
      await base44.entities.Evaluation.delete(evaluationToDelete.id);
      loadData();
      setEvaluationToDelete(null);
    } catch (error) {
      console.error("Error deleting evaluation:", error);
      alert(`Error deleting evaluation: ${error.message}`);
    }
    setIsDeleting(null);
  };

  const filteredEvaluations = useMemo(() => {
    return evaluations.filter(evaluation => {
      const accountName = accountMap.get(evaluation.account_id) || '';
      const matchesSearch = searchTerm === '' || 
        evaluation.evaluation_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evaluation.sales_consultant?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        accountName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || evaluation.status === statusFilter;

      let matchesDate = true;
      if (dateFilter !== 'all' && evaluation.created_date) {
        const evalDate = new Date(evaluation.created_date);
        if (!isNaN(evalDate.getTime())) {
          const now = new Date();
          switch (dateFilter) {
            case 'today':
              matchesDate = evalDate.toDateString() === now.toDateString();
              break;
            case 'week':
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              matchesDate = evalDate >= weekAgo;
              break;
            case 'month':
              matchesDate = evalDate.getMonth() === now.getMonth() && evalDate.getFullYear() === now.getFullYear();
              break;
            default:
              matchesDate = true;
          }
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [evaluations, searchTerm, statusFilter, dateFilter, accountMap]);

  const metrics = useMemo(() => {
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    
    return {
      totalEvaluations: evaluations.length,
      thisMonthEvaluations: evaluations.filter(e => {
        if (!e.created_date) return false;
        const date = new Date(e.created_date);
        if (isNaN(date.getTime())) return false;
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
      }).length,
      activeEvaluations: evaluations.filter(e => e.status === 'active').length,
      completedEvaluations: evaluations.filter(e => e.status === 'completed').length,
      conversionRate: evaluations.length > 0 ? 
        Math.round((evaluations.filter(e => e.status === 'completed').length / evaluations.length) * 100) : 0,
      avgItemsPerEval: evaluations.length > 0
        ? Math.round(evaluations.reduce((sum, item) => sum + (item.requested_items?.length || 0), 0) / evaluations.length)
        : 0,
      uniqueAccounts: new Set(evaluations.map(item => item.account_id)).size
    };
  }, [evaluations]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { variant: "secondary", label: "Draft", icon: FileText },
      submitted: { variant: "default", label: "Submitted", icon: Send },
      approved: { variant: "default", label: "Approved", icon: CheckCircle },
      active: { variant: "default", label: "Active", icon: Package },
      completed: { variant: "default", label: "Completed", icon: CheckCircle },
      cancelled: { variant: "destructive", label: "Cancelled", icon: X }
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 text-[10px]">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-3 sm:p-4">
                <Skeleton className="h-16 sm:h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <Skeleton className="h-48 sm:h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <MetricCard
          title="Total"
          value={metrics.totalEvaluations}
          icon={FileText}
          color="text-blue-600"
          description="All time"
        />
        <MetricCard
          title="This Month"
          value={metrics.thisMonthEvaluations}
          icon={Calendar}
          color="text-green-600"
          description="New"
        />
        <MetricCard
          title="Active"
          value={metrics.activeEvaluations}
          icon={Clock}
          color="text-purple-600"
          description="In progress"
        />
        <MetricCard
          title="Completed"
          value={metrics.completedEvaluations}
          icon={CheckCircle}
          color="text-emerald-600"
          description="Done"
        />
        <MetricCard
          title="Conv. Rate"
          value={`${metrics.conversionRate}%`}
          icon={BarChart3}
          color="text-orange-600"
          description="Success"
        />
      </div>

      {/* Evaluation Management Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                  Evaluation Management
                </CardTitle>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Monitor and manage all requests
                </p>
              </div>
              <Button onClick={loadData} variant="outline" size="sm" className="text-xs sm:text-sm w-full sm:w-auto">
                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-3 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 sm:pl-10 text-xs sm:text-sm w-full"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40 text-xs sm:text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value} className="text-xs sm:text-sm">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full sm:w-40 text-xs sm:text-sm">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs sm:text-sm">All Time</SelectItem>
                  <SelectItem value="today" className="text-xs sm:text-sm">Today</SelectItem>
                  <SelectItem value="week" className="text-xs sm:text-sm">This Week</SelectItem>
                  <SelectItem value="month" className="text-xs sm:text-sm">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mb-3 sm:mb-4 text-xs sm:text-sm text-gray-600">
            Showing {filteredEvaluations.length} of {evaluations.length}
          </div>

          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-3">
            {filteredEvaluations.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No evaluations found.
              </div>
            ) : (
              filteredEvaluations.map((evaluation) => (
                <Card key={evaluation.id} className="p-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {evaluation.evaluation_number || evaluation.id.slice(0, 8)}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {accountMap.get(evaluation.account_id) || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {evaluation.created_date ? format(new Date(evaluation.created_date), "MMM d, yyyy") : 'N/A'}
                        </div>
                      </div>
                      {getStatusBadge(evaluation.status)}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Link to={createPageUrl(`EvaluationDetail?id=${evaluation.id}`)} state={{ evaluation }} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full text-xs">
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </Link>
                      {canModifyEvaluation(evaluation) && (
                        <>
                          <Link to={createPageUrl(`EditEvaluation?id=${evaluation.id}`)} state={{ evaluation, account: accounts.find(a => a.id === evaluation.account_id) }} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full text-xs">
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                          </Link>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => setEvaluationToDelete(evaluation)}
                            disabled={isDeleting === evaluation.id}
                            className="text-xs px-2"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Eval #</TableHead>
                  <TableHead className="text-xs">Account</TableHead>
                  <TableHead className="text-xs">Consultant</TableHead>
                  <TableHead className="text-xs">Products</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Created</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvaluations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No evaluations found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvaluations.map((evaluation) => (
                    <TableRow key={evaluation.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-xs">
                        {evaluation.evaluation_number || evaluation.id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3 h-3 text-gray-400" />
                          {accountMap.get(evaluation.account_id) || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-2">
                          <Users className="w-3 h-3 text-gray-400" />
                          {evaluation.sales_consultant || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-2">
                          <Package className="w-3 h-3 text-gray-400" />
                          {evaluation.requested_items?.length || 0} items
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-2">
                          <Select
                            value={evaluation.status}
                            onValueChange={(value) => handleStatusUpdate(evaluation.id, value)}
                            disabled={isUpdating === evaluation.id || !canModifyEvaluation(evaluation)}
                          >
                            <SelectTrigger className="w-32 text-xs h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="submitted">Submitted</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          {isUpdating === evaluation.id && (
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {evaluation.created_date ? format(new Date(evaluation.created_date), "MMM d, yyyy") : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link to={createPageUrl(`EvaluationDetail?id=${evaluation.id}`)} state={{ evaluation }}>
                            <Button variant="outline" size="sm" className="text-xs h-7">
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          </Link>
                          
                          {canModifyEvaluation(evaluation) && (
                            <Link 
                              to={createPageUrl(`EditEvaluation?id=${evaluation.id}`)} 
                              state={{ evaluation, account: accounts.find(a => a.id === evaluation.account_id) }}
                            >
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 text-xs h-7"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                            </Link>
                          )}
                          
                          {canModifyEvaluation(evaluation) && (
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => setEvaluationToDelete(evaluation)}
                              disabled={isDeleting === evaluation.id}
                              className="text-xs h-7"
                            >
                              {isDeleting === evaluation.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3 mr-1" />
                              )}
                              {isDeleting !== evaluation.id && 'Delete'}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!evaluationToDelete} onOpenChange={() => setEvaluationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete evaluation{' '}
              <span className="font-bold">
                {evaluationToDelete?.evaluation_number || evaluationToDelete?.id?.slice(0, 8)}
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteEvaluation} 
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting !== null}
            >
              {isDeleting !== null ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}