
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';
import EvaluationPrintLayout from '../components/evaluation/EvaluationPrintLayout';

export default function EvaluationDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const urlParams = new URLSearchParams(location.search);
  const id = urlParams.get('id');
  
  const [evaluation, setEvaluation] = useState(location.state?.evaluation || null);
  const [account, setAccount] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSendingSignature, setIsSendingSignature] = useState(false);

  const loadData = useCallback(async () => {
      if (!id) {
        setError("No evaluation ID provided in URL");
        setIsLoading(false);
        return;
      }
      try {
        const evalData = location.state?.evaluation || await base44.entities.Evaluation.get(id);
        if (!evalData) {
          setError("Evaluation not found");
        } else {
          setEvaluation(evalData);
          if (evalData.account_id) {
            const accountData = await base44.entities.Account.get(evalData.account_id);
            setAccount(accountData);
          }
          if (evalData.requested_items?.length > 0) {
            setProducts(evalData.requested_items.map(item => ({
              code: item.sku_code,
              description: item.notes,
              quantity: item.quantity
            })));
          }
        }
      } catch (err) {
        console.error("Error loading evaluation:", err);
        setError(`Error loading evaluation: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
  }, [id, location.state]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const generateSignatureToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleSendForSignature = async () => {
    if (!evaluation || !account) return;

    const customerEmail = account.customer_contact_email || account.contact_email;
    const customerName = account.customer_contact_name || account.contact_person;

    if (!customerEmail) {
      alert('No customer email found for this account. Please update the account with a valid email address.');
      return;
    }

    const confirmMessage = `Send evaluation agreement to:\n\nName: ${customerName}\nEmail: ${customerEmail}\n\nThe customer will receive an email with a link to sign the agreement electronically.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setIsSendingSignature(true);
    try {
      const signatureToken = generateSignatureToken();
      const signatureUrl = `${window.location.origin}${createPageUrl('SignEvaluation')}?token=${signatureToken}`;

      await base44.entities.Evaluation.update(evaluation.id, {
        signature_status: 'sent',
        signature_token: signatureToken,
        signature_request_sent_at: new Date().toISOString()
      });

      await base44.integrations.Core.SendEmail({
        from_name: 'DePuy Synthes Sports Medicine',
        to: customerEmail,
        subject: `Equipment Evaluation Agreement - Signature Required`,
        body: `Dear ${customerName},

${evaluation.sales_consultant} from DePuy Synthes Sports Medicine has prepared an Equipment Evaluation Agreement for your review and signature.

Account: ${account.account_name}
Evaluation Period: ${evaluation.evaluation_start_date ? new Date(evaluation.evaluation_start_date).toLocaleDateString() : 'TBD'} - ${evaluation.evaluation_end_date ? new Date(evaluation.evaluation_end_date).toLocaleDateString() : 'TBD'}

Please click the link below to review the agreement and provide your electronic signature:

${signatureUrl}

This link is unique to your evaluation and will remain active until you sign the agreement.

If you have any questions or concerns, please contact:
${evaluation.sales_consultant}
${evaluation.sales_consultant_email}
${evaluation.sales_consultant_phone || ''}

Thank you,
DePuy Synthes Sports Medicine Team

---
This is an automated message. Please do not reply directly to this email.`
      });

      alert(`Signature request sent successfully to ${customerEmail}`);
      await loadData();
    } catch (error) {
      console.error('Error sending signature request:', error);
      alert('Error sending signature request. Please try again.');
    } finally {
      setIsSendingSignature(false);
    }
  };

  const getSignatureStatusBadge = () => {
    if (!evaluation) return null;

    const statusConfig = {
      not_sent: { label: 'Not Sent', color: 'bg-gray-100 text-gray-800' },
      sent: { label: 'Pending Signature', color: 'bg-yellow-100 text-yellow-800' },
      signed: { label: 'Signed', color: 'bg-green-100 text-green-800' }
    };

    const config = statusConfig[evaluation.signature_status] || statusConfig.not_sent;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Unable to Load Evaluation</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <Button 
          onClick={() => navigate(createPageUrl("Dashboard"))}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Dashboard
        </Button>
      </div>
    );
  }

  if (evaluation && account) {
    return (
      <div>
        {/* Signature Status Banner */}
        {evaluation.signature_status && evaluation.signature_status !== 'not_sent' && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-blue-900">E-Signature Status:</span>
                  {getSignatureStatusBadge()}
                </div>
                
                {evaluation.signature_status === 'sent' && evaluation.signature_request_sent_at && (
                  <p className="text-sm text-blue-800">
                    Signature request sent on {new Date(evaluation.signature_request_sent_at).toLocaleString()}
                  </p>
                )}
                
                {evaluation.signature_status === 'signed' && (
                  <div className="space-y-1">
                    <p className="text-sm text-green-800 font-medium">
                      ✓ Signed by {evaluation.signed_by_name} on {new Date(evaluation.signed_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-green-700">
                      {evaluation.signed_by_title} • {evaluation.signed_by_email}
                    </p>
                    {evaluation.customer_po_number && (
                      <p className="text-xs text-green-700 font-medium">
                        Customer PO#: {evaluation.customer_po_number}
                      </p>
                    )}
                    {evaluation.signature_data_url && (
                      <div className="mt-2 pt-2 border-t border-green-200">
                        <p className="text-xs text-green-700 mb-1">Electronic Signature:</p>
                        <img 
                          src={evaluation.signature_data_url} 
                          alt="Customer Signature" 
                          className="h-16 bg-white border border-green-300 rounded px-2"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {evaluation.signature_status === 'sent' && (
                <Button
                  onClick={handleSendForSignature}
                  variant="outline"
                  size="sm"
                  disabled={isSendingSignature}
                >
                  Resend Request
                </Button>
              )}
            </div>
          </div>
        )}

        <EvaluationPrintLayout
          evaluation={evaluation}
          account={account}
          products={products}
          onClose={() => navigate(createPageUrl("Dashboard"))}
          onSendForSignature={evaluation.signature_status === 'not_sent' ? handleSendForSignature : null}
          isSendingSignature={isSendingSignature}
        />
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-screen text-gray-500">
        Evaluation data could not be fully loaded.
    </div>
  );
}
