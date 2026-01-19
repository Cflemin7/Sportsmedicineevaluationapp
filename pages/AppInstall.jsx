import React from 'react';
import QRCodePage from '../components/QRCodePage';

export default function AppInstall() {
  // Generate a URL that points to the app root, which will trigger authentication
  const appUrl = window.location.origin;
  
  return <QRCodePage appUrl={appUrl} />;
}