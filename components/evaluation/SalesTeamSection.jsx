import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users } from "lucide-react";

export default function SalesTeamSection({ formData, setFormData }) {
  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Sales Team Information
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sales_rep_name">Sales Representative Name *</Label>
            <Input
              id="sales_rep_name"
              value={formData.sales_rep_name}
              onChange={(e) => setFormData(prev => ({ ...prev, sales_rep_name: e.target.value }))}
              placeholder="Your full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sales_rep_email">Sales Rep Email *</Label>
            <Input
              id="sales_rep_email"
              type="email"
              value={formData.sales_rep_email}
              onChange={(e) => setFormData(prev => ({ ...prev, sales_rep_email: e.target.value }))}
              placeholder="your.email@jnj.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sales_rep_phone">Sales Rep Phone Number</Label>
            <Input
              id="sales_rep_phone"
              value={formData.sales_rep_phone}
              onChange={(e) => setFormData(prev => ({ ...prev, sales_rep_phone: e.target.value }))}
              placeholder="(555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="territory_manager">Territory Manager</Label>
            <Input
              id="territory_manager"
              value={formData.territory_manager}
              onChange={(e) => setFormData(prev => ({ ...prev, territory_manager: e.target.value }))}
              placeholder="Manager name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="territory_manager_email">Territory Manager Email</Label>
            <Input
              id="territory_manager_email"
              type="email"
              value={formData.territory_manager_email}
              onChange={(e) => setFormData(prev => ({ ...prev, territory_manager_email: e.target.value }))}
              placeholder="manager@jnj.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="territory_manager_phone">Territory Manager Phone</Label>
            <Input
              id="territory_manager_phone"
              value={formData.territory_manager_phone}
              onChange={(e) => setFormData(prev => ({ ...prev, territory_manager_phone: e.target.value }))}
              placeholder="(555) 123-4567"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}