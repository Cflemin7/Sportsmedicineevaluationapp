import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function BulkEvaluationUploader({ onSuccess }) {
  const [excelFile, setExcelFile] = useState(null);
  const [pdfFiles, setPdfFiles] = useState([]);
  const [uploadedPdfs, setUploadedPdfs] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');

  const evaluationSchema = {
    type: "object",
    properties: {
      date_prepared: { type: "string", description: "Date evaluation was prepared" },
      ucn: { type: "string", description: "UCN number" },
      customer_name: { type: "string", description: "Customer/Account name" },
      address: { type: "string", description: "Full address" },
      contact_name: { type: "string", description: "Contact person name" },
      kit_code: { type: "string", description: "Kit/SKU code" },
      products_evaluated: { type: "string", description: "Products description" },
      quantity: { type: "number", description: "Quantity" }
    },
    required: ["customer_name", "date_prepared"]
  };

  const handleExcelChange = (e) => {
    const selectedFile = e.target.files[0];
    setExcelFile(selectedFile);
    setResult(null);
    setError(null);
  };

  const handlePdfChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setPdfFiles(selectedFiles);
    setResult(null);
    setError(null);
  };

  const handlePdfUpload = async () => {
    if (!pdfFiles || pdfFiles.length === 0) {
      setError('Please select PDF files first');
      return;
    }

    setIsUploading(true);
    setError(null);
    setResult(null);
    setProgress('Uploading PDF files...');

    try {
      let successCount = 0;
      let failCount = 0;
      const errors = [];

      for (let i = 0; i < pdfFiles.length; i++) {
        const pdfFile = pdfFiles[i];
        setProgress(`Processing ${i + 1} of ${pdfFiles.length}: ${pdfFile.name}...`);

        try {
          // Upload the PDF
          const uploadResult = await base44.integrations.Core.UploadFile({ file: pdfFile });

          // Extract data from PDF using AI
          setProgress(`Extracting data from ${pdfFile.name}...`);
          const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
            file_url: uploadResult.file_url,
            json_schema: {
              type: "object",
              properties: {
                ship_to_ucn: { type: "string", description: "Ship To UCN number from customer information section" },
                account_name: { type: "string", description: "Hospital or facility name" },
                purchase_order: { type: "string", description: "Purchase order number" },
                date_prepared: { type: "string", description: "Date prepared or evaluation date" },
                contact_name: { type: "string", description: "Contact person name from customer information" },
                contact_email: { type: "string", description: "Contact email address" },
                contact_phone: { type: "string", description: "Contact phone number" },
                address_street: { type: "string", description: "Street address" },
                address_city: { type: "string", description: "City" },
                address_state: { type: "string", description: "State" },
                address_zip: { type: "string", description: "ZIP code" },
                surgeons: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      anatomies: { 
                        type: "array", 
                        items: { type: "string" },
                        description: "List of anatomies (e.g., SHOULDER, KNEE, HIP)"
                      }
                    }
                  },
                  description: "List of evaluating surgeons with their anatomy focuses"
                },
                capital_equipment: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      kit_code: { type: "string" },
                      description: { type: "string" },
                      quantity: { type: "number" }
                    }
                  },
                  description: "Capital equipment items with kit codes"
                },
                disposables: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      product_number: { type: "string" },
                      description: { type: "string" },
                      quantity: { type: "number" }
                    }
                  },
                  description: "Disposable products with product numbers"
                },
                sales_consultant_name: { type: "string", description: "Sales consultant or contract manager name" },
                company_signatory: { type: "string", description: "Name of person who signed for the company" }
              },
              required: ["account_name"]
            }
          });

          if (extractResult.status === 'error') {
            throw new Error(extractResult.details || 'Failed to extract data from PDF');
          }

          const data = extractResult.output || {};
          console.log('Extracted PDF data:', data);

          // Find or create account with full details
          const accountData = {
            customer_contact_name: data.contact_name || 'Historical Contact',
            customer_contact_email: data.contact_email || 'update@required.com',
            ship_to_ucn_number: data.ship_to_ucn || 'TBD'
          };
          const account = await findOrCreateAccount(data.account_name || `Account from ${pdfFile.name}`, accountData);

          // Update account with extracted address
          if (account && (data.address_street || data.address_city)) {
            await base44.entities.Account.update(account.id, {
              shipping_address: {
                street: data.address_street || '',
                city: data.address_city || '',
                state: data.address_state || '',
                zip_code: data.address_zip || '',
                country: 'USA'
              },
              customer_contact_name: data.contact_name,
              customer_contact_email: data.contact_email,
              customer_contact_phone: data.contact_phone,
              ship_to_ucn_number: data.ship_to_ucn
            });
          }

          // Combine all products (capital equipment and disposables)
          const allProducts = [
            ...(data.capital_equipment || []).map(p => ({
              sku_code: p.kit_code || 'UNKNOWN',
              quantity: p.quantity || 1,
              notes: `${p.description || ''} (Capital Equipment)`
            })),
            ...(data.disposables || []).map(p => ({
              sku_code: p.product_number || 'UNKNOWN',
              quantity: p.quantity || 1,
              notes: `${p.description || ''} (Disposable)`
            }))
          ];

          // Format surgeons with anatomy focuses
          const surgeons = (data.surgeons || []).map(s => ({
            name: s.name || s,
            anatomy_focuses: Array.isArray(s.anatomies) ? s.anatomies : []
          }));

          // Create evaluation record with all extracted data
          const evaluation = await base44.entities.Evaluation.create({
            evaluation_number: data.purchase_order || `UCN${data.ship_to_ucn || 'PDF'}-${Date.now()}-${i}`,
            account_id: account.id,
            ship_to_ucn_number: data.ship_to_ucn || account.ship_to_ucn_number || 'TBD',
            sales_consultant: data.sales_consultant_name || data.company_signatory || 'Historical Import',
            sales_consultant_email: 'historical@import.com',
            customer_contact_name: data.contact_name || 'See PDF',
            customer_contact_email: data.contact_email || accountData.customer_contact_email,
            customer_contact_phone: data.contact_phone || '',
            surgeons: surgeons,
            evaluation_start_date: validateAndFormatDate(data.date_prepared),
            evaluation_end_date: validateAndFormatDate(data.date_prepared),
            purchase_order_number: data.purchase_order || '',
            requested_items: allProducts,
            status: 'completed',
            compliance_notes: `Imported from PDF: ${pdfFile.name}. UCN: ${data.ship_to_ucn || 'N/A'}. ${surgeons.length} surgeon(s). ${allProducts.length} product(s).`,
            pdf_url: uploadResult.file_url,
            signed_pdf_url: uploadResult.file_url,
            signature_status: 'signed'
          });

          console.log('Created evaluation:', evaluation.id, evaluation.evaluation_number);

          successCount++;
        } catch (error) {
          console.error(`Error processing ${pdfFile.name}:`, error);
          failCount++;
          errors.push(`${pdfFile.name}: ${error.message}`);
        }
      }

      setResult({
        success: true,
        successCount,
        failCount,
        totalCount: pdfFiles.length,
        errors: errors.slice(0, 10)
      });

      if (onSuccess) {
        onSuccess();
      }

      // Reset form
      setPdfFiles([]);
      document.getElementById('pdf-upload').value = '';

    } catch (error) {
      console.error('Error uploading PDFs:', error);
      setError(error.message || 'Failed to upload PDFs');
    } finally {
      setIsUploading(false);
      setProgress('');
    }
  };

  const findOrCreateAccount = async (accountName, evalData) => {
    try {
      // Try to find existing account by name
      const accounts = await base44.entities.Account.filter({ account_name: accountName });
      if (accounts && accounts.length > 0) {
        return accounts[0];
      }

      // Create new account if not found
      const newAccount = await base44.entities.Account.create({
        account_name: accountName,
        ship_to_ucn_number: evalData.ship_to_ucn_number || 'TBD',
        account_type: "community_hospital",
        contact_person: evalData.customer_contact_name || "Unknown",
        contact_email: evalData.customer_contact_email || `contact@${accountName.toLowerCase().replace(/\s+/g, '')}.com`,
        customer_contact_name: evalData.customer_contact_name,
        customer_contact_email: evalData.customer_contact_email
      });

      return newAccount;
    } catch (error) {
      console.error('Error finding/creating account:', error);
      throw error;
    }
  };

  const parseSkuItems = (skuString) => {
    try {
      // Try parsing as JSON first
      const parsed = JSON.parse(skuString);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // Fallback: parse comma-separated SKUs
      if (!skuString) return [];
      return skuString.split(',').map(sku => ({
        sku_code: sku.trim(),
        quantity: 1,
        notes: 'Imported from historical data'
      }));
    }
  };

  const parseSurgeons = (surgeonString) => {
    if (!surgeonString) return [];
    return surgeonString.split(',').map(name => ({
      name: name.trim(),
      anatomy_focuses: []
    }));
  };

  const validateAndFormatDate = (dateString) => {
    if (!dateString) return undefined;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return undefined;
      return date.toISOString().split('T')[0];
    } catch {
      return undefined;
    }
  };

  const handleExcelUpload = async () => {
    if (!excelFile) {
      setError('Please select an Excel file first');
      return;
    }

    setIsUploading(true);
    setError(null);
    setResult(null);
    setProgress('Uploading file...');

    try {
      // Upload the Excel file
      const uploadResult = await base44.integrations.Core.UploadFile({ file: excelFile });
      setProgress('Extracting evaluation data...');

      // Extract data from the uploaded file
      const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: uploadResult.file_url,
        json_schema: {
          type: "array",
          items: evaluationSchema
        }
      });

      if (extractResult.status === 'error') {
        throw new Error(extractResult.details || 'Failed to extract data from Excel file');
      }

      const records = extractResult.output;
      if (!Array.isArray(records) || records.length === 0) {
        throw new Error('No valid evaluation records found in the file');
      }

      setProgress(`Processing ${records.length} evaluations...`);
      let successCount = 0;
      let failCount = 0;
      const errors = [];

      // Group records by customer_name and date to consolidate into evaluations
      const evaluationGroups = {};
      
      records.forEach(record => {
        const key = `${record.customer_name}_${record.date_prepared}`;
        if (!evaluationGroups[key]) {
          evaluationGroups[key] = {
            customer_name: record.customer_name,
            ucn: record.ucn,
            address: record.address,
            contact_name: record.contact_name,
            date_prepared: record.date_prepared,
            items: []
          };
        }
        evaluationGroups[key].items.push({
          kit_code: record.kit_code,
          products_evaluated: record.products_evaluated,
          quantity: record.quantity || 1
        });
      });

      const evaluations = Object.values(evaluationGroups);
      setProgress(`Processing ${evaluations.length} evaluations...`);

      // Process each evaluation
      for (let i = 0; i < evaluations.length; i++) {
        const evalData = evaluations[i];
        setProgress(`Processing evaluation ${i + 1} of ${evaluations.length}...`);

        try {
          // Find or create account
          const account = await findOrCreateAccount(evalData.customer_name, {
            customer_contact_name: evalData.contact_name,
            customer_contact_email: `${evalData.contact_name?.toLowerCase().replace(/\s+/g, '.')}@${evalData.customer_name.toLowerCase().replace(/\s+/g, '')}.com`,
            ship_to_ucn_number: evalData.ucn
          });

          // Format requested items from consolidated products
          const requestedItems = evalData.items.map(item => ({
            sku_code: item.kit_code || 'UNKNOWN',
            quantity: item.quantity || 1,
            notes: item.products_evaluated || ''
          }));

          // Create evaluation
          await base44.entities.Evaluation.create({
            evaluation_number: `${evalData.ucn}-${new Date(evalData.date_prepared).getTime()}`,
            account_id: account.id,
            ship_to_ucn_number: account.ship_to_ucn_number || evalData.ucn || 'TBD',
            sales_consultant: 'Historical Import',
            sales_consultant_email: 'historical@import.com',
            customer_contact_name: evalData.contact_name || 'Historical Contact',
            customer_contact_email: account.customer_contact_email,
            evaluation_start_date: validateAndFormatDate(evalData.date_prepared),
            evaluation_end_date: validateAndFormatDate(evalData.date_prepared),
            requested_items: requestedItems,
            status: 'completed',
            compliance_notes: `Imported from historical data. Address: ${evalData.address || 'N/A'}`
          });

          successCount++;
        } catch (error) {
          console.error(`Error processing evaluation ${i + 1}:`, error);
          failCount++;
          errors.push(`Evaluation ${i + 1}: ${error.message}`);
        }
      }

      setResult({
        success: true,
        successCount,
        failCount,
        totalCount: records.length,
        errors: errors.slice(0, 5) // Show first 5 errors
      });

      if (onSuccess) {
        onSuccess();
      }

      // Reset form
      setExcelFile(null);
      document.getElementById('excel-upload').value = '';

    } catch (error) {
      console.error('Error uploading evaluations:', error);
      setError(error.message || 'Failed to upload evaluation data');
    } finally {
      setIsUploading(false);
      setProgress('');
    }
  };



  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Import Historical Evaluations</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="excel">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="excel">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel Import
            </TabsTrigger>
            <TabsTrigger value="pdf">
              <FileText className="w-4 h-4 mr-2" />
              PDF Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="excel" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p><strong>Excel Format:</strong> Date Prepared, UCN, Customer Name, Address, Contact Name, Kit Code, Products evaluated, Qty</p>
                  <p className="text-xs">Rows with the same Customer Name and Date will be grouped into a single evaluation with multiple products.</p>
                </div>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="excel-upload">Excel File (.xlsx, .xls, .csv)</Label>
              <Input
                id="excel-upload"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelChange}
                disabled={isUploading}
              />
            </div>

            <Button 
              onClick={handleExcelUpload} 
              disabled={!excelFile || isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {progress}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Evaluations from Excel
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="pdf" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p><strong>PDF Smart Import:</strong> Upload historical evaluation PDFs with AI-powered data extraction.</p>
                  <p className="text-xs">Automatically extracts: UCN, account name, evaluation date, products, surgeons, sales consultant, contact info, and shipping address. Review extracted data after import.</p>
                </div>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="pdf-upload">PDF Files (Multiple)</Label>
              <Input
                id="pdf-upload"
                type="file"
                accept=".pdf"
                multiple
                onChange={handlePdfChange}
                disabled={isUploading}
              />
              {pdfFiles.length > 0 && (
                <p className="text-sm text-gray-600">{pdfFiles.length} file(s) selected</p>
              )}
            </div>

            <Button 
              onClick={handlePdfUpload} 
              disabled={pdfFiles.length === 0 || isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {progress}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Evaluations from PDFs
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert className="border-green-500 bg-green-50 mt-4">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="space-y-2">
                <p className="font-semibold">
                  Import Complete: {result.successCount} of {result.totalCount} evaluations imported successfully
                </p>
                {result.failCount > 0 && (
                  <div>
                    <p className="text-red-600 font-medium">{result.failCount} failed:</p>
                    <ul className="text-xs list-disc ml-4">
                      {result.errors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                      {result.errors.length < result.failCount && (
                        <li>... and {result.failCount - result.errors.length} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}