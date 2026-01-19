import React, { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Printer, Loader2, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function EvaluationPrintLayout({ evaluation, account, products, onClose, onSendForSignature, isSendingSignature }) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = useCallback(async () => {
    window.print();
  }, []);

  if (!evaluation || !account) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading evaluation data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Action Bar - Hidden in print */}
      <div className="no-print bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" onClick={onClose} className="text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            {onSendForSignature && (
              <Button
                onClick={onSendForSignature}
                disabled={isSendingSignature}
                className="bg-green-600 hover:bg-green-700 text-sm"
              >
                {isSendingSignature ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send for E-Signature
                  </>
                )}
              </Button>
            )}
            
            <Button onClick={handleDownloadPDF} className="bg-blue-600 hover:bg-blue-700 text-sm">
              <Printer className="w-4 h-4 mr-2" />
              Print / Save PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Contract Document - Print Optimized */}
      <div id="print-content" className="contract-document">
        <style>{`
          @media print {
            body { margin: 0; padding: 0; }
            .no-print { display: none !important; }
            .contract-document { 
              font-family: Arial, sans-serif;
              font-size: 9pt;
              line-height: 1.3;
              color: #000;
              max-width: 100%;
              margin: 0;
              padding: 0.5in;
            }
            .page-break { page-break-before: always; }
            .page-1 { page-break-after: always; }
            .terms-section { 
              page-break-before: always;
              page-break-inside: avoid;
              font-size: 8pt;
              line-height: 1.2;
            }
            .terms-section p { margin-bottom: 6px; }
            .terms-section div { margin-bottom: 8px; }
            h1 { font-size: 14pt; margin: 0.3em 0; }
            h2 { font-size: 12pt; margin: 0.25em 0; }
            h3 { font-size: 10pt; margin: 0.2em 0; }
            table { page-break-inside: avoid; font-size: 8pt; }
            .signature-section { page-break-inside: avoid; }
          }
          
          @media screen {
            .contract-document {
              max-width: 8.5in;
              margin: 0 auto;
              padding: 1in;
              background: white;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
              font-family: Arial, sans-serif;
              font-size: 11pt;
              line-height: 1.5;
              color: #000;
            }
          }
          
          @media screen and (max-width: 768px) {
            .contract-document {
              max-width: 100%;
              padding: 0.5rem;
              font-size: 10pt;
              box-shadow: none;
            }
            .mobile-responsive-table {
              font-size: 9pt;
            }
            .mobile-hide-on-small {
              display: none;
            }
          }
        `}</style>

        {/* Letterhead */}
        <div style={{ textAlign: 'center', borderBottom: '3px solid #CC0000', paddingBottom: '15px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '10px' }} className="md:flex-row md:justify-center">
            <div style={{ width: '50px', height: '50px', background: '#CC0000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: 'white', fontSize: '18pt', fontWeight: 'bold' }}>J&J</span>
            </div>
            <div style={{ textAlign: 'center' }} className="md:text-left">
              <h1 style={{ margin: 0, fontSize: 'clamp(14pt, 4vw, 20pt)', fontWeight: 'bold' }}>DePuy Synthes Sports Medicine</h1>
              <p style={{ margin: 0, fontSize: 'clamp(9pt, 2.5vw, 10pt)', color: '#666' }}>A Johnson & Johnson MedTech Company</p>
            </div>
          </div>
        </div>

        {/* Document Title */}
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <h2 style={{ fontSize: 'clamp(14pt, 4vw, 18pt)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', margin: '10px 0' }}>
            EQUIPMENT EVALUATION AGREEMENT
          </h2>
          <p style={{ fontSize: 'clamp(9pt, 2.5vw, 10pt)', color: '#666', margin: '5px 0' }}>
            Agreement No: {evaluation.evaluation_number || `EVAL-${evaluation.id?.slice(0, 8).toUpperCase()}`}
          </p>
          <p style={{ fontSize: 'clamp(9pt, 2.5vw, 10pt)', color: '#666', margin: '5px 0' }}>
            Date Issued: {format(new Date(evaluation.created_date), 'MMMM d, yyyy')}
          </p>
        </div>

        {/* Parties Section */}
        <div style={{ margin: '20px 0', padding: '15px', border: '1px solid #ccc', background: '#f9f9f9' }}>
          <h3 style={{ fontSize: 'clamp(11pt, 3vw, 13pt)', fontWeight: 'bold', marginBottom: '10px' }}>PARTIES TO THIS AGREEMENT</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>PROVIDER:</p>
            <p style={{ marginLeft: '20px', marginBottom: '3px' }}>DePuy Synthes Sports Medicine</p>
            <p style={{ marginLeft: '20px', marginBottom: '3px' }}>A Division of DePuy Synthes Sales, Inc.</p>
            <p style={{ marginLeft: '20px', marginBottom: '3px' }}>Johnson & Johnson MedTech</p>
          </div>

          <div>
            <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>CUSTOMER:</p>
            <p style={{ marginLeft: '20px', marginBottom: '3px' }}><strong>{account.account_name}</strong></p>
            <p style={{ marginLeft: '20px', marginBottom: '3px' }}>
              {account.billing_address?.street}, {account.billing_address?.city}, {account.billing_address?.state} {account.billing_address?.zip_code}
            </p>
            {account.ship_to_ucn_number && (
              <p style={{ marginLeft: '20px', marginBottom: '3px' }}>UCN: {account.ship_to_ucn_number}</p>
            )}
            <p style={{ marginLeft: '20px', marginBottom: '3px' }}>Primary Contact: {account.contact_person || 'N/A'}</p>
          </div>
        </div>

        {/* Evaluation Details */}
        <div style={{ margin: '20px 0' }}>
          <h3 style={{ fontSize: 'clamp(11pt, 3vw, 13pt)', fontWeight: 'bold', borderBottom: '2px solid #000', paddingBottom: '5px', marginBottom: '10px' }}>
            EVALUATION DETAILS
          </h3>
          
          <table className="mobile-responsive-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: 'clamp(9pt, 2.5vw, 11pt)' }}>
            <tbody>
              <tr>
                <td style={{ padding: '8px', border: '1px solid #ccc', width: '40%', fontWeight: 'bold', background: '#f5f5f5' }}>
                  Sales Consultant:
                </td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                  {evaluation.sales_consultant}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px', border: '1px solid #ccc', fontWeight: 'bold', background: '#f5f5f5' }}>
                  Consultant Email:
                </td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                  {evaluation.sales_consultant_email}
                </td>
              </tr>
              {evaluation.sales_consultant_phone && (
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #ccc', fontWeight: 'bold', background: '#f5f5f5' }}>
                    Consultant Phone:
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                    {evaluation.sales_consultant_phone}
                  </td>
                </tr>
              )}
              {evaluation.territory_manager && (
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #ccc', fontWeight: 'bold', background: '#f5f5f5' }}>
                    Territory Manager:
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                    {evaluation.territory_manager}
                  </td>
                </tr>
              )}
              {(evaluation.evaluation_start_date || evaluation.evaluation_end_date) && (
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #ccc', fontWeight: 'bold', background: '#f5f5f5' }}>
                    Evaluation Period:
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                    {evaluation.evaluation_start_date && format(new Date(evaluation.evaluation_start_date), 'MMMM d, yyyy')}
                    {evaluation.evaluation_start_date && evaluation.evaluation_end_date && ' through '}
                    {evaluation.evaluation_end_date && format(new Date(evaluation.evaluation_end_date), 'MMMM d, yyyy')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Surgeons */}
          {evaluation.surgeons && evaluation.surgeons.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Evaluating Physicians:</p>
              {evaluation.surgeons.map((surgeon, index) => (
                <div key={index} style={{ marginLeft: '20px', marginBottom: '8px' }}>
                  <p style={{ marginBottom: '3px' }}>• {surgeon.name}</p>
                  {surgeon.anatomy_focuses && surgeon.anatomy_focuses.length > 0 && (
                    <p style={{ marginLeft: '20px', fontSize: '10pt', color: '#666' }}>
                      Focus Areas: {surgeon.anatomy_focuses.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Equipment List */}
        <div className="page-1" style={{ margin: '20px 0', overflowX: 'auto' }}>
          <h3 style={{ fontSize: 'clamp(11pt, 3vw, 13pt)', fontWeight: 'bold', borderBottom: '2px solid #000', paddingBottom: '5px', marginBottom: '10px' }}>
            EQUIPMENT TO BE EVALUATED
          </h3>
          
          <table className="mobile-responsive-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '300px', fontSize: 'clamp(9pt, 2.5vw, 11pt)' }}>
            <thead>
              <tr style={{ background: '#000', color: 'white' }}>
                <th style={{ padding: '6px 4px', border: '1px solid #000', textAlign: 'left', fontSize: 'clamp(9pt, 2.5vw, 10pt)' }}>SKU</th>
                <th style={{ padding: '6px 4px', border: '1px solid #000', textAlign: 'left', fontSize: 'clamp(9pt, 2.5vw, 10pt)' }}>Description</th>
                <th style={{ padding: '6px 4px', border: '1px solid #000', textAlign: 'center', width: '50px', fontSize: 'clamp(9pt, 2.5vw, 10pt)' }}>Qty</th>
              </tr>
            </thead>
            <tbody>
              {(evaluation.requested_items || []).map((item, index) => (
                <tr key={index} style={{ background: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                  <td style={{ padding: '4px 3px', border: '1px solid #ccc', fontFamily: 'Courier New', wordBreak: 'break-word', fontSize: 'clamp(8pt, 2vw, 9pt)' }}>
                    {item.sku_code}
                  </td>
                  <td style={{ padding: '4px 3px', border: '1px solid #ccc', wordBreak: 'break-word', fontSize: 'clamp(8pt, 2vw, 9pt)' }}>
                    {item.notes || 'N/A'}
                  </td>
                  <td style={{ padding: '4px 3px', border: '1px solid #ccc', textAlign: 'center', fontWeight: 'bold', fontSize: 'clamp(9pt, 2vw, 10pt)' }}>
                    {item.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Terms and Conditions - Page 2 */}
        <div className="terms-section" style={{ margin: '15px 0' }}>
          <h3 style={{ fontSize: 'clamp(11pt, 3vw, 12pt)', fontWeight: 'bold', borderBottom: '2px solid #000', paddingBottom: '3px', marginBottom: '8px' }}>
            TERMS AND CONDITIONS
          </h3>
          
          <div style={{ textAlign: 'justify', lineHeight: '1.2', fontSize: 'clamp(8pt, 2.5vw, 9pt)' }}>
            <p style={{ marginBottom: '8px', fontSize: 'clamp(8pt, 2.5vw, 9pt)' }}>
              This Equipment Evaluation Agreement ("Agreement") is entered into between DePuy Synthes Sports Medicine, 
              a division of DePuy Synthes Sales, Inc., a Johnson & Johnson MedTech company ("Provider"), and {account.account_name} ("Customer").
            </p>

            <div style={{ marginBottom: '8px' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '3px', fontSize: 'clamp(8pt, 2.5vw, 9pt)' }}>1. EQUIPMENT OWNERSHIP AND TITLE</p>
              <p style={{ marginLeft: '10px', textAlign: 'justify' }}>
                All equipment provided remains the sole property of Provider. Customer acknowledges no title or ownership rights are transferred. 
                Customer agrees to maintain equipment in good condition and use reasonable care in handling.
              </p>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '3px', fontSize: 'clamp(8pt, 2.5vw, 9pt)' }}>2. EVALUATION PERIOD</p>
              <p style={{ marginLeft: '10px', textAlign: 'justify' }}>
                The evaluation period is as specified above. Extensions require written Provider approval. At conclusion, Customer shall 
                return equipment in original condition or execute a purchase order at current list price.
              </p>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '3px', fontSize: 'clamp(8pt, 2.5vw, 9pt)' }}>3. COMPLIANCE - DISPOSABLE ITEMS</p>
              <p style={{ marginLeft: '10px', textAlign: 'justify', fontWeight: 'bold', color: '#CC0000' }}>
                IMPORTANT: Disposables are limited to ten (10) units per surgeon per anatomical area, mandated to ensure compliance with 
                federal and state healthcare regulations including anti-kickback statutes. Customer agrees to strictly adhere to this limitation.
              </p>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '3px', fontSize: 'clamp(8pt, 2.5vw, 9pt)' }}>4. LIABILITY AND INSURANCE</p>
              <p style={{ marginLeft: '10px', textAlign: 'justify' }}>
                Customer assumes full responsibility for equipment during evaluation. Customer agrees to maintain adequate insurance 
                and indemnify Provider from any claims or losses arising from use or storage of equipment.
              </p>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '3px', fontSize: 'clamp(8pt, 2.5vw, 9pt)' }}>5. PERMITTED USE</p>
              <p style={{ marginLeft: '10px', textAlign: 'justify' }}>
                Equipment is for evaluation by qualified medical professionals only. Use must comply with laws and manufacturer's instructions. 
                Commercial use, rental, or transfer to third parties is strictly prohibited.
              </p>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '3px', fontSize: 'clamp(8pt, 2.5vw, 9pt)' }}>6. RETURN OR PURCHASE</p>
              <p style={{ marginLeft: '10px', textAlign: 'justify' }}>
                Upon completion, Customer must return equipment properly packaged or submit a purchase order. Equipment not returned or 
                purchased within 30 days will be invoiced at full retail price.
              </p>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '3px', fontSize: 'clamp(8pt, 2.5vw, 9pt)' }}>7. TERMINATION</p>
              <p style={{ marginLeft: '10px', textAlign: 'justify' }}>
                Either party may terminate upon written notice. Upon termination, Customer shall immediately return all equipment. 
                Provider may terminate immediately if Customer breaches any material term.
              </p>
            </div>

            {evaluation.government_approval_obtained && (
              <div style={{ marginBottom: '8px', padding: '6px', border: '1px solid #FFA500', background: '#FFF8DC' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '3px', fontSize: 'clamp(8pt, 2.5vw, 9pt)' }}>8. GOVERNMENT APPROVAL</p>
                <p style={{ marginLeft: '10px', textAlign: 'justify' }}>
                  This evaluation received approval from Provider's Government Accounts Team and complies with 
                  government procurement regulations and anti-kickback provisions.
                </p>
              </div>
            )}

            {(evaluation.special_instructions || evaluation.compliance_notes) && (
              <div style={{ marginTop: '10px', padding: '8px', border: '1px solid #ccc', background: '#f9f9f9' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: 'clamp(8pt, 2vw, 9pt)' }}>ADDITIONAL PROVISIONS:</p>
                {evaluation.special_instructions && (
                  <div style={{ marginBottom: '6px' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '8pt', marginBottom: '3px' }}>Special Instructions:</p>
                    <p style={{ marginLeft: '10px', fontSize: '8pt' }}>
                      {evaluation.special_instructions}
                    </p>
                  </div>
                )}
                {evaluation.compliance_notes && (
                  <div>
                    <p style={{ fontWeight: 'bold', fontSize: '8pt', marginBottom: '3px' }}>Compliance Notes:</p>
                    <p style={{ marginLeft: '10px', fontSize: '8pt' }}>
                      {evaluation.compliance_notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Signature Section */}
        <div className="signature-section" style={{ margin: '12px 0', padding: '10px', border: '2px solid #000' }}>
          <h3 style={{ fontSize: 'clamp(11pt, 3vw, 13pt)', fontWeight: 'bold', textAlign: 'center', marginBottom: '15px', textTransform: 'uppercase' }}>
            ACKNOWLEDGMENT AND ACCEPTANCE
          </h3>
          
          {evaluation.signature_status === 'signed' && evaluation.signature_data_url ? (
            <div style={{ padding: '15px', border: '2px solid #28a745', background: '#f0fff4' }}>
              <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                <p style={{ fontSize: 'clamp(11pt, 3vw, 14pt)', fontWeight: 'bold', color: '#28a745', marginBottom: '5px' }}>
                  ✓ EXECUTED ELECTRONICALLY
                </p>
                <p style={{ fontSize: 'clamp(8pt, 2.5vw, 10pt)', color: '#666' }}>
                  This document was electronically signed on {format(new Date(evaluation.signed_at), 'MMMM d, yyyy \'at\' h:mm a')}
                </p>
              </div>
              
              <div className="signature-grid">
                <style>{`
                  @media screen and (max-width: 768px) {
                    .signature-grid { display: flex; flex-direction: column; gap: 15px; }
                    .signature-box { border-left: none !important; border-top: 1px solid #ccc; padding-top: 15px; }
                    .signature-box:first-child { border-top: none; padding-top: 0; }
                  }
                  @media screen and (min-width: 769px) {
                    .signature-grid { display: table; width: 100%; border-collapse: collapse; }
                    .signature-box { display: table-cell; width: 50%; vertical-align: top; padding: 10px; }
                    .signature-box + .signature-box { border-left: 1px solid #ccc; }
                  }
                `}</style>
                
                <div className="signature-box">
                  <p style={{ fontWeight: 'bold', marginBottom: '10px', borderBottom: '1px solid #ccc', paddingBottom: '5px', fontSize: 'clamp(9pt, 2.5vw, 10pt)' }}>
                    CUSTOMER SIGNATURE:
                  </p>
                  <img 
                    src={evaluation.signature_data_url} 
                    alt="Customer Signature" 
                    style={{ height: '50px', maxWidth: '100%', margin: '10px 0', border: '1px solid #ccc', padding: '5px', background: 'white' }}
                  />
                  <p style={{ marginTop: '8px', fontSize: 'clamp(8pt, 2.5vw, 10pt)' }}>
                    <strong>Signed By:</strong> {evaluation.signed_by_name}
                  </p>
                  <p style={{ fontSize: 'clamp(8pt, 2.5vw, 10pt)' }}>
                    <strong>Title:</strong> {evaluation.signed_by_title}
                  </p>
                  <p style={{ fontSize: 'clamp(8pt, 2.5vw, 10pt)', wordBreak: 'break-word' }}>
                    <strong>Email:</strong> {evaluation.signed_by_email}
                  </p>
                  <p style={{ fontSize: 'clamp(8pt, 2.5vw, 10pt)' }}>
                    <strong>Facility:</strong> {account.account_name}
                  </p>
                  {evaluation.customer_po_number && (
                    <p style={{ fontSize: 'clamp(8pt, 2.5vw, 10pt)', fontWeight: 'bold', color: '#0066cc', marginTop: '5px' }}>
                      <strong>Customer PO#:</strong> {evaluation.customer_po_number}
                    </p>
                  )}
                  <p style={{ fontSize: 'clamp(8pt, 2.5vw, 10pt)', marginTop: '5px' }}>
                    <strong>Date:</strong> {format(new Date(evaluation.signed_at), 'MMMM d, yyyy')}
                  </p>
                </div>
                
                <div className="signature-box">
                  <p style={{ fontWeight: 'bold', marginBottom: '10px', borderBottom: '1px solid #ccc', paddingBottom: '5px', fontSize: 'clamp(9pt, 2.5vw, 10pt)' }}>
                    DEPUY SYNTHES COUNTER-SIGNATURE:
                  </p>
                  <div style={{ height: '50px', margin: '10px 0', borderBottom: '2px solid #000' }}></div>
                  <p style={{ marginTop: '8px', fontSize: 'clamp(8pt, 2.5vw, 10pt)' }}>
                    <strong>Company:</strong> DePuy Synthes Sales, Inc.
                  </p>
                  <p style={{ fontSize: 'clamp(8pt, 2.5vw, 10pt)' }}>
                    <strong>Authorized Representative</strong>
                  </p>
                  <p style={{ fontSize: 'clamp(8pt, 2.5vw, 10pt)', marginTop: '10px' }}>
                    <strong>Date:</strong> _______________________
                  </p>
                  <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #ccc', fontSize: 'clamp(8pt, 2vw, 9pt)', color: '#666' }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>Sales Representative:</p>
                    <p>{evaluation.sales_consultant}</p>
                    <p style={{ wordBreak: 'break-word' }}>{evaluation.sales_consultant_email}</p>
                    {evaluation.sales_consultant_phone && <p>{evaluation.sales_consultant_phone}</p>}
                  </div>
                </div>
              </div>
              
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #ccc', fontSize: 'clamp(8pt, 2vw, 9pt)', textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                This document has been electronically signed and is legally binding under the Electronic Signatures in 
                Global and National Commerce Act (ESIGN) and the Uniform Electronic Transactions Act (UETA). The electronic 
                signature above constitutes the valid authorization by an authorized representative of {account.account_name}.
                <br/><br/>
                <strong>Note:</strong> This agreement becomes effective upon counter-signature by an authorized DePuy Synthes representative.
              </div>
            </div>
          ) : (
            <div>
              <p style={{ textAlign: 'center', marginBottom: '15px', fontStyle: 'italic', fontSize: 'clamp(8pt, 2.5vw, 10pt)' }}>
                By signing below, the authorized representatives acknowledge that they have read, understood, and agree 
                to be bound by all terms and conditions set forth in this Equipment Evaluation Agreement.
              </p>
              
              <div className="signature-grid">
                <style>{`
                  @media screen and (max-width: 768px) {
                    .signature-grid { display: flex; flex-direction: column; gap: 15px; }
                    .signature-box { border-left: none !important; border-top: 1px solid #ccc; padding-top: 15px; }
                    .signature-box:first-child { border-top: none; padding-top: 0; }
                  }
                  @media screen and (min-width: 769px) {
                    .signature-grid { display: table; width: 100%; border-collapse: collapse; }
                    .signature-box { display: table-cell; width: 50%; vertical-align: top; padding: 15px; }
                    .signature-box + .signature-box { border-left: 1px solid #ccc; }
                  }
                `}</style>
                
                <div className="signature-box">
                  <p style={{ fontWeight: 'bold', marginBottom: '30px', fontSize: 'clamp(9pt, 2.5vw, 10pt)' }}>CUSTOMER:</p>
                  <div style={{ borderBottom: '2px solid #000', marginBottom: '8px', height: '30px' }}></div>
                  <p style={{ fontSize: 'clamp(8pt, 2vw, 9pt)', marginBottom: '3px' }}>Authorized Signature</p>
                  
                  <div style={{ marginTop: '15px' }}>
                    <div style={{ borderBottom: '1px solid #666', marginBottom: '5px', height: '15px' }}></div>
                    <p style={{ fontSize: 'clamp(8pt, 2vw, 9pt)', marginBottom: '12px' }}>Printed Name</p>
                    
                    <div style={{ borderBottom: '1px solid #666', marginBottom: '5px', height: '15px' }}></div>
                    <p style={{ fontSize: 'clamp(8pt, 2vw, 9pt)', marginBottom: '12px' }}>Title</p>

                    <div style={{ borderBottom: '1px solid #666', marginBottom: '5px', height: '15px' }}></div>
                    <p style={{ fontSize: 'clamp(8pt, 2vw, 9pt)', marginBottom: '12px' }}>Facility Name</p>
                    
                    <div style={{ borderBottom: '1px solid #666', marginBottom: '5px', height: '15px' }}></div>
                    <p style={{ fontSize: 'clamp(8pt, 2vw, 9pt)', marginBottom: '12px' }}>Customer PO Number</p>
                    
                    <div style={{ borderBottom: '1px solid #666', marginBottom: '5px', height: '15px' }}></div>
                    <p style={{ fontSize: 'clamp(8pt, 2vw, 9pt)' }}>Date</p>
                  </div>
                </div>
                
                <div className="signature-box">
                  <p style={{ fontWeight: 'bold', marginBottom: '30px', fontSize: 'clamp(9pt, 2.5vw, 10pt)' }}>DEPUY SYNTHES COUNTER-SIGNATURE:</p>
                  <div style={{ borderBottom: '2px solid #000', marginBottom: '8px', height: '30px' }}></div>
                  <p style={{ fontSize: 'clamp(8pt, 2vw, 9pt)', marginBottom: '3px' }}>Authorized Company Representative Signature</p>
                  
                  <div style={{ marginTop: '15px' }}>
                    <div style={{ borderBottom: '1px solid #666', marginBottom: '5px', height: '15px' }}></div>
                    <p style={{ fontSize: 'clamp(8pt, 2vw, 9pt)', marginBottom: '12px' }}>Printed Name</p>
                    
                    <div style={{ borderBottom: '1px solid #666', marginBottom: '5px', height: '15px' }}></div>
                    <p style={{ fontSize: 'clamp(8pt, 2vw, 9pt)', marginBottom: '12px' }}>Title</p>
                    
                    <p style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: 'clamp(8pt, 2vw, 9pt)' }}>DePuy Synthes Sales, Inc.</p>
                    <p style={{ fontSize: 'clamp(8pt, 2vw, 9pt)', marginBottom: '12px' }}>Company Name</p>
                    
                    <div style={{ borderBottom: '1px solid #666', marginBottom: '5px', height: '15px' }}></div>
                    <p style={{ fontSize: 'clamp(8pt, 2vw, 9pt)', marginBottom: '12px' }}>Date</p>
                    
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #ccc', fontSize: 'clamp(8pt, 2vw, 9pt)', color: '#666' }}>
                      <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>Prepared By:</p>
                      <p>{evaluation.sales_consultant}</p>
                      <p style={{ fontSize: 'clamp(7pt, 1.8vw, 8pt)' }}>Sales Consultant</p>
                      <p style={{ fontSize: 'clamp(7pt, 1.8vw, 8pt)', wordBreak: 'break-word' }}>{evaluation.sales_consultant_email}</p>
                      {evaluation.sales_consultant_phone && <p style={{ fontSize: 'clamp(7pt, 1.8vw, 8pt)' }}>{evaluation.sales_consultant_phone}</p>}
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{ marginTop: '15px', padding: '8px', background: '#f9f9f9', border: '1px solid #ccc', fontSize: 'clamp(8pt, 2vw, 9pt)', color: '#666', fontStyle: 'italic', textAlign: 'center' }}>
                <strong>Important:</strong> This agreement becomes effective only upon counter-signature by an authorized 
                representative of DePuy Synthes Sales, Inc. The sales consultant listed above is the contact person for 
                this evaluation but is not authorized to execute this agreement on behalf of DePuy Synthes.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '2px solid #ccc', fontSize: '9pt', textAlign: 'center', color: '#666' }}>
          <p style={{ marginBottom: '3px' }}>
            <strong>DePuy Synthes Sports Medicine</strong> | A Division of DePuy Synthes Sales, Inc.
          </p>
          <p style={{ marginBottom: '3px' }}>Johnson & Johnson MedTech</p>
          <p style={{ marginBottom: '10px' }}>325 Paramount Drive, Raynham, MA 02767 | www.jnjmedtech.com</p>
          <p style={{ fontSize: '8pt', fontStyle: 'italic' }}>
            Document Generated: {format(new Date(), 'MMMM d, yyyy \'at\' h:mm a')} | 
            Agreement ID: {evaluation.evaluation_number || evaluation.id}
          </p>
        </div>
      </div>
    </div>
  );
}