import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, User as UserIcon, LayoutDashboard, FilePlus, Building2, Package, Users, FileText, Menu, LogOut } from 'lucide-react';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { base44 } from '@/api/base44Client';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const ProfileSetupForm = ({ user, onComplete }) => {
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    territory: user?.territory || '',
    employee_id: user?.employee_id || '',
    phone_number: user?.phone_number || '',
    region: user?.region || '',
    specialization: user?.specialization || 'Sports Medicine',
    manager_email: user?.manager_email || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValidJNJEmail = user?.email?.toLowerCase().endsWith('@its.jnj.com');
  const isAdmin = user?.role === 'admin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAdmin && !isValidJNJEmail) {
      alert('Access denied. Only users with @its.jnj.com email addresses can create profiles.');
      return;
    }

    const required = ['first_name', 'last_name', 'territory', 'employee_id', 'phone_number', 'region', 'manager_email'];
    const missing = required.filter(field => !formData[field]?.trim());
    
    if (missing.length > 0) {
      alert(`Please fill in all required fields: ${missing.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await base44.auth.updateMe(formData);
      onComplete();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAdmin && !isValidJNJEmail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-3">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center p-4">
            <div className="w-12 h-12 mx-auto mb-3 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white text-lg font-bold">J&J</span>
            </div>
            <CardTitle className="text-xl text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            <Alert className="border-red-500 bg-red-50">
              <AlertDescription className="text-xs">
                <strong>Email Not Authorized:</strong> {user?.email}
                <br/><br/>
                Only users with <strong>@its.jnj.com</strong> email addresses can access this application.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={async () => {
                try {
                  await base44.auth.logout(window.location.origin);
                } catch (error) {
                  console.error('Logout error:', error);
                }
              }}
              variant="outline"
              className="w-full"
              size="sm"
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-3">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center p-4">
          <div className="w-12 h-12 mx-auto mb-3 bg-red-600 rounded-full flex items-center justify-center">
            <span className="text-white text-lg font-bold">J&J</span>
          </div>
          <CardTitle className="text-xl">Complete Your Profile</CardTitle>
          <p className="text-gray-600 text-sm mt-1">Please provide your information to access the app</p>
          <Alert className="mt-3">
            <AlertDescription className="text-xs text-left">
              <strong>Signed in as:</strong> {user?.email}<br/>
              {isAdmin && <span className="text-blue-600 font-semibold">Admin Access</span>}
              {!isAdmin && <span className="text-green-600">✓ Verified @its.jnj.com email</span>}
            </AlertDescription>
          </Alert>
        </CardHeader>
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="first_name" className="text-xs">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="John"
                  required
                  className="text-sm h-9"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="last_name" className="text-xs">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Doe"
                  required
                  className="text-sm h-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="territory" className="text-xs">Territory *</Label>
              <Input
                id="territory"
                value={formData.territory}
                onChange={(e) => setFormData(prev => ({ ...prev, territory: e.target.value }))}
                placeholder="Sales territory"
                required
                className="text-sm h-9"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="employee_id" className="text-xs">Employee ID *</Label>
              <Input
                id="employee_id"
                value={formData.employee_id}
                onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                placeholder="Employee ID"
                required
                className="text-sm h-9"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="phone_number" className="text-xs">Phone Number *</Label>
              <Input
                id="phone_number"
                value={formData.phone_number}
                onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                placeholder="(555) 123-4567"
                required
                className="text-sm h-9"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="region" className="text-xs">Region *</Label>
              <Select 
                value={formData.region} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, region: value }))}
              >
                <SelectTrigger className="text-sm h-9">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Northeast">Northeast</SelectItem>
                  <SelectItem value="Southeast">Southeast</SelectItem>
                  <SelectItem value="Midwest">Midwest</SelectItem>
                  <SelectItem value="Southwest">Southwest</SelectItem>
                  <SelectItem value="West">West</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="specialization" className="text-xs">Specialization</Label>
              <Select 
                value={formData.specialization} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, specialization: value }))}
              >
                <SelectTrigger className="text-sm h-9">
                  <SelectValue placeholder="Select specialization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sports Medicine">Sports Medicine</SelectItem>
                  <SelectItem value="Orthopedic Trauma">Orthopedic Trauma</SelectItem>
                  <SelectItem value="Spine">Spine</SelectItem>
                  <SelectItem value="General Orthopedics">General Orthopedics</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="manager_email" className="text-xs">Territory Manager Email *</Label>
              <Input
                id="manager_email"
                type="email"
                value={formData.manager_email}
                onChange={(e) => setFormData(prev => ({ ...prev, manager_email: e.target.value }))}
                placeholder="manager@jnjmedtech.com"
                required
                className="text-sm h-9"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 h-9 text-sm"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              Complete Profile
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const LoginPrompt = () => {
  const handleLogin = async () => {
    try {
      await base44.auth.redirectToLogin();
    } catch (error) {
      console.error('Login error:', error);
      alert('There was an error during login. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-3">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center p-4">
          <div className="w-12 h-12 mx-auto mb-3 bg-red-600 rounded-full flex items-center justify-center">
            <span className="text-white text-lg font-bold">J&J</span>
          </div>
          <CardTitle className="text-xl">Welcome to J&J MedTech</CardTitle>
          <p className="text-gray-600 text-sm">Sports Medicine Evaluation Platform</p>
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          <Alert className="border-blue-500 bg-blue-50">
            <AlertDescription className="text-xs">
              <strong>Authorization Required:</strong><br/>
              This application is restricted to J&J employees with <strong>@its.jnj.com</strong> email addresses.
            </AlertDescription>
          </Alert>
          <Button 
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 h-10 text-sm"
          >
            <UserIcon className="mr-2 h-4 w-4" />
            Sign In / Create Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const NavLink = ({ to, icon: Icon, children, currentPage, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all hover:bg-gray-100 ${
      currentPage === children.replace(/\s+/g, '') ? "bg-blue-50 text-blue-600" : "text-gray-700"
    }`}
  >
    <Icon className="h-4 w-4" />
    {children}
  </Link>
);

const AuthenticatedLayout = ({ children, currentPageName }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const showSidebar = currentPageName === 'Dashboard' || 
                      currentPageName === 'NewEvaluation' ||
                      currentPageName === 'MyProfile' ||
                      currentPageName === 'ManageAccounts' ||
                      currentPageName === 'ProductCatalog' ||
                      currentPageName === 'ManageUsers' ||
                      currentPageName === 'Reports' ||
                      currentPageName === 'EvaluationDetail' ||
                      currentPageName === 'EditEvaluation' ||
                      currentPageName === 'UserProfile';

  const handleLogout = async () => {
    try {
      await base44.auth.logout(window.location.origin);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!showSidebar) {
    return <div className="min-h-screen bg-white">{children}</div>;
  }

  const NavigationLinks = ({ onClick }) => (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
      <NavLink to={createPageUrl("NewEvaluation")} icon={FilePlus} currentPage={currentPageName} onClick={onClick}>
        New Evaluation
      </NavLink>
      <NavLink to={createPageUrl("Dashboard")} icon={LayoutDashboard} currentPage={currentPageName} onClick={onClick}>
        Dashboard
      </NavLink>
      <div className="mt-3 mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Quick Actions
      </div>
      <NavLink to={createPageUrl("MyProfile")} icon={UserIcon} currentPage={currentPageName} onClick={onClick}>
        My Profile
      </NavLink>
      <NavLink to={createPageUrl("ManageAccounts")} icon={Building2} currentPage={currentPageName} onClick={onClick}>
        Manage Accounts
      </NavLink>
      <NavLink to={createPageUrl("ProductCatalog")} icon={Package} currentPage={currentPageName} onClick={onClick}>
        Product Catalog
      </NavLink>
      <NavLink to={createPageUrl("ManageUsers")} icon={Users} currentPage={currentPageName} onClick={onClick}>
        Team Directory
      </NavLink>
      <NavLink to={createPageUrl("Reports")} icon={FileText} currentPage={currentPageName} onClick={onClick}>
        Generate Reports
      </NavLink>
      <div className="mt-3 pt-3 border-t">
        <Button
          variant="ghost"
          onClick={() => {
            if (onClick) onClick(); // Close mobile menu if clicked from there
            handleLogout();
          }}
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </nav>
  );
  
  return (
    <div className="min-h-screen bg-gray-50/70">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between border-b bg-white px-4 py-3 sticky top-0 z-50">
        <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2 font-semibold text-base">
          <span>J&J MedTech</span>
        </Link>
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex h-14 items-center border-b px-4">
              <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2 font-semibold text-base">
                J&J MedTech
              </Link>
            </div>
            <div className="py-4">
              <NavigationLinks onClick={() => setMobileMenuOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:grid md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] min-h-screen">
        <div className="border-r bg-gray-50/40">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
              <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2 font-semibold text-base">
                J&J MedTech
              </Link>
            </div>
            <div className="flex-1 overflow-auto">
              <NavigationLinks />
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <main className="flex flex-1 flex-col gap-4 p-3 lg:gap-6 lg:p-6">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Content */}
      <div className="md:hidden">
        <main className="p-3">
          {children}
        </main>
      </div>
    </div>
  );
};

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);

  // Public pages that don't require authentication
  const publicPages = ['SignEvaluation'];
  const isPublicPage = publicPages.includes(currentPageName);

  useEffect(() => {
    const checkAuth = async () => {
      // Skip auth check for public pages
      if (isPublicPage) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        const requiredFields = ['first_name', 'last_name', 'territory', 'employee_id', 'phone_number', 'region', 'manager_email'];
        const needsSetup = requiredFields.some(field => !currentUser[field]);
        setNeedsProfileSetup(needsSetup);
      } catch (error) {
        console.log('User not authenticated:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [isPublicPage, currentPageName]);

  const handleProfileComplete = async () => {
    try {
      const updatedUser = await base44.auth.me();
      setUser(updatedUser);
      setNeedsProfileSetup(false);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  // Render public pages immediately without authentication
  if (isPublicPage) {
    return <div className="min-h-screen bg-white">{children}</div>;
  }

  // Show loading spinner for protected pages
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  // Require authentication for protected pages
  if (!user) {
    return <LoginPrompt />;
  }

  if (needsProfileSetup) {
    return <ProfileSetupForm user={user} onComplete={handleProfileComplete} />;
  }

  return (
    <AuthenticatedLayout currentPageName={currentPageName}>
      {children}
    </AuthenticatedLayout>
  );
}