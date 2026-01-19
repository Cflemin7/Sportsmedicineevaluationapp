import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Share2, Users, Shield, Smartphone } from "lucide-react";

export default function QRCodePage({ appUrl }) {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(appUrl)}`;
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'J&J MedTech Sports Medicine App',
          text: 'Access the J&J MedTech evaluation platform',
          url: appUrl
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(appUrl);
      alert('App link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">J&J</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            J&J MedTech App Distribution
          </h1>
          <p className="text-gray-600">
            Private app for authorized sales consultants
          </p>
        </div>

        {/* QR Code Card */}
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5" />
              Scan to Install App
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="bg-white p-6 rounded-lg inline-block shadow-inner">
              <img 
                src={qrCodeUrl} 
                alt="QR Code for J&J MedTech App"
                className="mx-auto"
              />
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">How to Install:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">📱 iPhone Users</h4>
                  <ol className="text-sm text-gray-700 space-y-1">
                    <li>1. Scan QR code with camera</li>
                    <li>2. Tap the notification</li>
                    <li>3. Tap "Add to Home Screen"</li>
                    <li>4. Confirm installation</li>
                  </ol>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">📱 Android Users</h4>
                  <ol className="text-sm text-gray-700 space-y-1">
                    <li>1. Scan QR code</li>
                    <li>2. Tap "Install App" button</li>
                    <li>3. Confirm installation</li>
                    <li>4. App appears on home screen</li>
                  </ol>
                </div>
              </div>
            </div>

            <Button onClick={handleShare} className="w-full bg-blue-600 hover:bg-blue-700">
              <Share2 className="w-4 h-4 mr-2" />
              Share App Link
            </Button>
          </CardContent>
        </Card>

        {/* Features Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              App Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-sm">Private access for sales team</span>
              </div>
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-blue-600" />
                <span className="text-sm">Works offline</span>
              </div>
              <div className="flex items-center gap-3">
                <QrCode className="w-5 h-5 text-blue-600" />
                <span className="text-sm">Easy QR code installation</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="text-sm">Secure and controlled</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}