import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function EvaluationSummary({ formData, accounts }) {
  const selectedAccount = accounts.find(a => a.id === formData.account_id);
  const totalProducts = formData.products?.length || 0;
  const capitalItems = formData.products?.filter(p => p.category === 'capital_equipment') || [];
  const disposableItems = formData.products?.filter(p => p.category === 'disposable') || [];
  
  const completionChecks = [
    { label: 'Account Selected', completed: Boolean(formData.account_id) },
    { label: 'Products Added', completed: totalProducts > 0 },
    { label: 'Shipping Info', completed: Boolean(formData.ship_to_name && formData.ship_to_address) }
  ];

  const completedChecks = completionChecks.filter(check => check.completed).length;

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-900 text-white">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Evaluation Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Completion Progress</span>
            <span>{completedChecks}/{completionChecks.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedChecks / completionChecks.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-2">
          {completionChecks.map((check, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              {check.completed ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-gray-400" />
              )}
              <span className={check.completed ? 'text-gray-900' : 'text-gray-500'}>
                {check.label}
              </span>
            </div>
          ))}
        </div>

        <Separator />

        {/* Account Info */}
        {selectedAccount && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Account</h4>
            <p className="text-sm text-gray-600">{selectedAccount.account_name}</p>
          </div>
        )}

        {/* Product Summary */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Product Overview</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total Items:</span>
              <Badge variant="outline">{totalProducts}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Capital Equipment:</span>
              <Badge variant="default">{capitalItems.length}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Disposables:</span>
              <Badge variant="secondary">{disposableItems.length}</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}