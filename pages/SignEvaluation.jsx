import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Loader2, PenTool, RotateCcw, FileText, Building2, User, AlertCircle } from "lucide-react";

export default function SignEvaluation() {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const token = urlParams.get('token');
  
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [account, setAccount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  
  const [signerInfo, setSignerInfo] = useState({
    name: '',
    email: '',
    title: '',
    po_number: ''
  });

  useEffect(() => {
    loadEvaluation();
  }, [token]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const loadEvaluation = async () => {
    if (!token) {
      setError('Invalid signature link - no token provided');
      setIsLoading(false);
      return;
    }

    try {
      // Use the SDK's filter method to find evaluation by signature_token
      const evaluations = await base44.entities.Evaluation.filter({ signature_token: token });
      
      if (!evaluations || evaluations.length === 0) {
        setError('Evaluation not found. The link may be invalid or expired.');
        setIsLoading(false);
        return;
      }

      const evalData = evaluations[0];

      if (evalData.signature_status === 'signed') {
        setError('This document has already been signed');
        setIsLoading(false);
        return;
      }

      if (evalData.signature_status !== 'sent') {
        setError('This signature request is not active');
        setIsLoading(false);
        return;
      }

      setEvaluation(evalData);

      // Load account data - account info is already in evaluation data if needed
      // We don't need to fetch the full account for signature page
      if (evalData.account_id) {
        // Set minimal account data from evaluation if available
        setAccount({
          account_name: evalData.customer_contact_name || 'Account',
          id: evalData.account_id
        });
      }
    } catch (err) {
      console.error('Error loading evaluation:', err);
      setError('Error loading evaluation. Please contact your sales representative or try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    setIsDrawing(true);
    setHasSignature(true);
    ctx.beginPath();
    ctx.moveTo(
      e.clientX - rect.left || e.touches[0].clientX - rect.left,
      e.clientY - rect.top || e.touches[0].clientY - rect.top
    );
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    e.preventDefault();
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    const x = e.clientX ? e.clientX - rect.left : e.touches[0].clientX - rect.left;
    const y = e.clientY ? e.clientY - rect.top : e.touches[0].clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hasSignature) {
      alert('Please provide your signature');
      return;
    }

    if (!signerInfo.name || !signerInfo.email || !signerInfo.title || !signerInfo.po_number) {
      alert('Please fill in all required fields including the no-charge PO number');
      return;
    }

    setIsSubmitting(true);
    try {
      const canvas = canvasRef.current;
      const signatureDataUrl = canvas.toDataURL('image/png');

      await base44.entities.Evaluation.update(evaluation.id, {
        signature_status: 'signed',
        signed_at: new Date().toISOString(),
        signed_by_name: signerInfo.name,
        signed_by_email: signerInfo.email,
        signed_by_title: signerInfo.title,
        customer_po_number: signerInfo.po_number,
        signature_data_url: signatureDataUrl
      });

      setSuccess(true);
    } catch (error) {
      console.error('Error submitting signature:', error);
      alert('Error submitting signature. Please try again or contact your sales representative.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Unable to Load Document
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="border-red-500 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
            <p className="text-sm text-gray-600 mt-4">
              If you continue to experience issues, please contact your sales representative for assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Successfully Signed!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-gray-600">
              Thank you for signing the evaluation agreement. Your sales representative has been notified and will contact you shortly.
            </p>
            <Alert className="border-green-500 bg-green-50">
              <AlertDescription className="text-green-800 text-sm">
                <strong>Confirmation Details:</strong><br/>
                Signed by: {signerInfo.name}<br/>
                Email: {signerInfo.email}<br/>
                PO Number: {signerInfo.po_number}<br/>
                Date: {new Date().toLocaleString()}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-lg">J&J</span>
              </div>
              <div>
                <CardTitle className="text-xl">Electronic Signature Required</CardTitle>
                <p className="text-blue-100 text-sm mt-1">DePuy Synthes Sports Medicine Equipment Evaluation Agreement</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Evaluation Info */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Evaluation Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {account && (
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="font-semibold text-gray-900">{account.account_name}</p>
                  {account.billing_address && (
                    <p className="text-sm text-gray-600">
                      {account.billing_address.street}, {account.billing_address.city}, {account.billing_address.state} {account.billing_address.zip_code}
                    </p>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Sales Consultant</p>
                <p className="font-medium text-gray-900">{evaluation.sales_consultant}</p>
                <p className="text-sm text-gray-600">{evaluation.sales_consultant_email}</p>
              </div>
            </div>

            {evaluation.evaluation_start_date && evaluation.evaluation_end_date && (
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Evaluation Period</p>
                  <p className="font-medium text-gray-900">
                    {new Date(evaluation.evaluation_start_date).toLocaleDateString()} - {new Date(evaluation.evaluation_end_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Signature Form */}
        <form onSubmit={handleSubmit}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Your Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={signerInfo.name}
                    onChange={(e) => setSignerInfo(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={signerInfo.email}
                    onChange={(e) => setSignerInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john.doe@hospital.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title/Position *</Label>
                  <Input
                    id="title"
                    value={signerInfo.title}
                    onChange={(e) => setSignerInfo(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Director of Surgery, Purchasing Manager"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="po_number">No-Charge PO Number *</Label>
                  <Input
                    id="po_number"
                    value={signerInfo.po_number}
                    onChange={(e) => setSignerInfo(prev => ({ ...prev, po_number: e.target.value }))}
                    placeholder="Enter your PO number"
                    required
                  />
                  <p className="text-xs text-gray-600">Your facility's purchase order number for this evaluation</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <PenTool className="w-5 h-5 text-blue-600" />
                  Your Signature
                </CardTitle>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={clearSignature}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Please sign below using your mouse, trackpad, or finger
              </p>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={200}
                  className="w-full touch-none cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>

              <Alert className="mt-4">
                <AlertDescription className="text-xs">
                  By signing this document electronically, you agree to the terms and conditions outlined in the Equipment Evaluation Agreement. Your electronic signature is legally binding and equivalent to a handwritten signature.
                </AlertDescription>
              </Alert>

              <Button 
                type="submit" 
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting Signature...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Submit Signed Agreement
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}