import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Building2, Package, FileText, Users, UserCircle, QrCode } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function QuickActions({ accounts }) {
  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      <Card className="shadow-md">
        <CardHeader className="px-3 py-3 sm:px-6 sm:py-6">
          <CardTitle className="text-base sm:text-lg font-bold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3 px-3 pb-3 sm:px-6 sm:pb-6">
          <Link to={createPageUrl("NewEvaluation")} className="block">
            <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm">
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              New Evaluation
            </Button>
          </Link>
          <Link to={createPageUrl("AppInstall")} className="block">
            <Button className="w-full justify-start bg-purple-600 hover:bg-purple-700 text-xs sm:text-sm">
              <QrCode className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Share QR Code
            </Button>
          </Link>
          <Link to={createPageUrl("MyProfile")} className="block">
            <Button variant="outline" className="w-full justify-start text-xs sm:text-sm">
              <UserCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              My Profile
            </Button>
          </Link>
          <Link to={createPageUrl("ManageAccounts")} className="block">
            <Button variant="outline" className="w-full justify-start text-xs sm:text-sm">
              <Building2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Manage Accounts
            </Button>
          </Link>
          <Link to={createPageUrl("ProductCatalog")} className="block">
            <Button variant="outline" className="w-full justify-start text-xs sm:text-sm">
              <Package className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Product Catalog
            </Button>
          </Link>
          <Link to={createPageUrl("ManageUsers")} className="block">
            <Button variant="outline" className="w-full justify-start text-xs sm:text-sm">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              View Users
            </Button>
          </Link>
          <Link to={createPageUrl("Reports")} className="block">
            <Button variant="outline" className="w-full justify-start text-xs sm:text-sm">
              <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Generate Reports
            </Button>
          </Link>
        </CardContent>
      </Card>


    </div>
  );
}