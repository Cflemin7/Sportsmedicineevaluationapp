import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  submitted: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  active: "bg-purple-100 text-purple-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800"
};

export default function RecentEvaluations() {
  const [evaluations, setEvaluations] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [evalData, accountData, userData] = await Promise.all([
        base44.entities.Evaluation.list('-created_date', 10),
        base44.entities.Account.list('-created_date', 100),
        base44.auth.me().catch(() => null)
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

  const accountMap = useMemo(() => new Map(accounts.map(acc => [acc.id, acc.account_name])), [accounts]);
  
  const filteredEvaluations = useMemo(() => {
    if (!currentUser) return [];
    
    if (currentUser.role === 'admin') {
      return evaluations;
    }
    
    return evaluations.filter(evalItem => 
      evalItem.created_by === currentUser.email || 
      evalItem.sales_consultant_email === currentUser.email
    );
  }, [evaluations, currentUser]);

  return (
    <Card className="shadow-md w-full">
      <CardHeader className="flex flex-row items-center justify-between px-3 py-3 sm:px-6 sm:py-6">
        <CardTitle className="text-base sm:text-xl font-bold">Recent Evaluations</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={isLoading}
          className="text-xs sm:text-sm"
        >
          <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Eval #</TableHead>
                <TableHead className="text-xs">Account</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Created</TableHead>
                <TableHead className="text-xs"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : filteredEvaluations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500 text-xs sm:text-sm">
                    No evaluations found. Create your first evaluation to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredEvaluations.map((evaluation) => (
                  <TableRow key={evaluation.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-xs sm:text-sm">
                      {evaluation.evaluation_number || evaluation.id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">{accountMap.get(evaluation.account_id) || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge className={`${statusColors[evaluation.status] || statusColors.draft} text-[10px] sm:text-xs`}>
                        {evaluation.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {evaluation.created_date && !isNaN(new Date(evaluation.created_date).getTime()) 
                        ? format(new Date(evaluation.created_date), "MMM d, yyyy") 
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={createPageUrl(`EvaluationDetail?id=${evaluation.id}`)} state={{ evaluation }}>
                         <Button variant="outline" size="sm" className="text-xs">
                           View <ArrowRight className="w-3 h-3 ml-1" />
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
  );
}