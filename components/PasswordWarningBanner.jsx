import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, X } from "lucide-react";
import { differenceInDays } from 'date-fns';

export default function PasswordWarningBanner() {
  const [user, setUser] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const [daysOld, setDaysOld] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    checkPasswordAge();
  }, []);

  const checkPasswordAge = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // If no last_password_change is set, assume account creation date
      const lastChangeDate = currentUser.last_password_change 
        ? new Date(currentUser.last_password_change)
        : new Date(currentUser.created_date);

      const now = new Date();
      const daysSinceChange = differenceInDays(now, lastChangeDate);
      setDaysOld(daysSinceChange);

      // Show warning if password is older than 90 days and user hasn't acknowledged
      if (daysSinceChange >= 90 && !currentUser.password_change_acknowledged) {
        setShowWarning(true);
      }
    } catch (error) {
      console.error('Error checking password age:', error);
    }
  };

  const handleChangePassword = () => {
    // Redirect to authentication provider's password change page
    window.open('https://app.base44.io/settings/security', '_blank');
  };

  const handleDismiss = async () => {
    try {
      await base44.auth.updateMe({ password_change_acknowledged: true });
      setIsDismissed(true);
      setShowWarning(false);
    } catch (error) {
      console.error('Error dismissing warning:', error);
    }
  };

  if (!showWarning || isDismissed) return null;

  const isUrgent = daysOld >= 120; // 4 months
  const isCritical = daysOld >= 150; // 5 months

  return (
    <Alert className={`${
      isCritical ? 'bg-red-50 border-red-500 text-red-900' :
      isUrgent ? 'bg-orange-50 border-orange-500 text-orange-900' :
      'bg-yellow-50 border-yellow-500 text-yellow-900'
    } relative mb-4`}>
      <AlertTriangle className={`h-4 w-4 ${
        isCritical ? 'text-red-600' :
        isUrgent ? 'text-orange-600' :
        'text-yellow-600'
      }`} />
      <AlertTitle className="flex items-center gap-2 text-sm sm:text-base font-semibold">
        <Shield className="h-4 w-4" />
        {isCritical ? 'Critical: ' : isUrgent ? 'Urgent: ' : ''}Password Change Required
      </AlertTitle>
      <AlertDescription className="text-xs sm:text-sm mt-2">
        <div className="space-y-2">
          <p>
            Your password is <strong>{daysOld} days old</strong>. 
            {isCritical && ' This is a critical security issue!'}
            {isUrgent && !isCritical && ' Please change it soon.'}
            {!isUrgent && ' For security purposes, we recommend changing your password every 90 days.'}
          </p>
          <p className="text-xs">
            Industry best practice requires password rotation every 3 months to maintain account security.
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              onClick={handleChangePassword}
              size="sm"
              className={`${
                isCritical ? 'bg-red-600 hover:bg-red-700' :
                isUrgent ? 'bg-orange-600 hover:bg-orange-700' :
                'bg-yellow-600 hover:bg-yellow-700'
              } text-white`}
            >
              Change Password Now
            </Button>
            {!isCritical && (
              <Button
                onClick={handleDismiss}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                Remind Me Later
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>
      {!isCritical && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="absolute top-2 right-2 h-6 w-6"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </Alert>
  );
}