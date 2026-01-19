import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Plus, Mail, User, Phone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { base44 } from '@/api/base44Client';

export default function AccountSection({ formData, setFormData, accounts, handleAccountChange }) {
  const [showNewAccountDialog, setShowNewAccountDialog] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [newAccountData, setNewAccountData] = useState({
    account_name: '',
    account_type: 'community_hospital',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    ship_to_ucn_number: '',
    is_government: false
  });

  const selectedAccount = accounts.find(a => a.id === formData.account_id);

  const handleCreateAccount = async () => {
    // Validate required fields
    if (!newAccountData.account_name || !newAccountData.contact_person || !newAccountData.contact_email) {
      alert('Please fill in all required fields: Account Name, Contact Person, and Contact Email');
      return;
    }

    setIsCreatingAccount(true);
    try {
      const createdAccount = await base44.entities.Account.create(newAccountData);
      
      // Close dialog
      setShowNewAccountDialog(false);
      
      // Reset form
      setNewAccountData({
        account_name: '',
        account_type: 'community_hospital',
        contact_person: '',
        contact_email: '',
        contact_phone: '',
        ship_to_ucn_number: '',
        is_government: false
      });

      // Notify parent to reload accounts and select the new one
      alert('Account created successfully!');
      
      // Auto-select the newly created account
      handleAccountChange(createdAccount.id);
      
      // Reload the page to refresh the accounts list
      window.location.reload();
    } catch (error) {
      console.error('Error creating account:', error);
      alert('Error creating account. Please try again.');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Account Selection
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account_id">Select Account *</Label>
            <div className="flex gap-2">
              <Select
                value={formData.account_id}
                onValueChange={handleAccountChange}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Choose an account..." />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setShowNewAccountDialog(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Account
              </Button>
            </div>
          </div>

          {selectedAccount && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg space-y-2">
              <h4 className="font-semibold text-blue-900">Account Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <span className="ml-2 font-medium">{selectedAccount.account_name}</span>
                </div>
                {selectedAccount.account_type && (
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-medium">
                      {selectedAccount.account_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                )}
                {selectedAccount.contact_person && (
                  <div>
                    <span className="text-gray-600">Contact:</span>
                    <span className="ml-2 font-medium">{selectedAccount.contact_person}</span>
                  </div>
                )}
                {selectedAccount.contact_email && (
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium">{selectedAccount.contact_email}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <Alert className="border-orange-500 bg-orange-50 mt-4">
            <Mail className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-sm text-orange-800">
              <strong>Important:</strong> The e-signature request will be sent to the customer contact email address below. Please verify this information is correct.
            </AlertDescription>
          </Alert>

          <div className="space-y-4 pt-2">
            <h4 className="font-semibold text-gray-900">Customer Contact for E-Signature</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer_contact_name" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  Customer Contact Name *
                </Label>
                <Input
                  id="customer_contact_name"
                  value={formData.customer_contact_name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_contact_name: e.target.value }))}
                  placeholder="Full name of person who will sign"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_contact_email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  Customer Email Address *
                </Label>
                <Input
                  id="customer_contact_email"
                  type="email"
                  value={formData.customer_contact_email || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_contact_email: e.target.value }))}
                  placeholder="email@hospital.com"
                  required
                />
                <p className="text-xs text-gray-600">E-signature request will be sent here</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_contact_phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  Customer Phone Number
                </Label>
                <Input
                  id="customer_contact_phone"
                  value={formData.customer_contact_phone || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_contact_phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New Account Dialog */}
      <Dialog open={showNewAccountDialog} onOpenChange={setShowNewAccountDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Create New Account
            </DialogTitle>
            <DialogDescription>
              Add a new hospital or facility account
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-account-name">Account Name *</Label>
              <Input
                id="new-account-name"
                value={newAccountData.account_name}
                onChange={(e) => setNewAccountData(prev => ({ ...prev, account_name: e.target.value }))}
                placeholder="Hospital or Clinic Name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-account-type">Account Type *</Label>
              <Select
                value={newAccountData.account_type}
                onValueChange={(value) => setNewAccountData(prev => ({ ...prev, account_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high_volume_multi_specialty">High Volume Multi-Specialty</SelectItem>
                  <SelectItem value="community_hospital">Community Hospital</SelectItem>
                  <SelectItem value="ambulatory_surgery_center">Ambulatory Surgery Center</SelectItem>
                  <SelectItem value="specialty_clinic">Specialty Clinic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-contact-person">Contact Person *</Label>
                <Input
                  id="new-contact-person"
                  value={newAccountData.contact_person}
                  onChange={(e) => setNewAccountData(prev => ({ ...prev, contact_person: e.target.value }))}
                  placeholder="Primary contact name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-contact-email">Contact Email *</Label>
                <Input
                  id="new-contact-email"
                  type="email"
                  value={newAccountData.contact_email}
                  onChange={(e) => setNewAccountData(prev => ({ ...prev, contact_email: e.target.value }))}
                  placeholder="contact@hospital.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-contact-phone">Contact Phone</Label>
                <Input
                  id="new-contact-phone"
                  value={newAccountData.contact_phone}
                  onChange={(e) => setNewAccountData(prev => ({ ...prev, contact_phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-ucn-number">UCN Number</Label>
                <Input
                  id="new-ucn-number"
                  value={newAccountData.ship_to_ucn_number}
                  onChange={(e) => setNewAccountData(prev => ({ ...prev, ship_to_ucn_number: e.target.value }))}
                  placeholder="Customer number"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="new-is-government"
                checked={newAccountData.is_government}
                onCheckedChange={(checked) => setNewAccountData(prev => ({ ...prev, is_government: checked }))}
              />
              <Label htmlFor="new-is-government" className="text-sm font-normal">
                This is a government account
              </Label>
            </div>

            {newAccountData.is_government && (
              <Alert className="border-red-500 bg-red-50">
                <AlertDescription className="text-red-800 text-sm">
                  <strong>Government Account:</strong> You must contact US Marketing to obtain Government accounts team approval before creating evaluations for this account.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowNewAccountDialog(false)}
              disabled={isCreatingAccount}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateAccount}
              disabled={isCreatingAccount}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isCreatingAccount ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Account
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}