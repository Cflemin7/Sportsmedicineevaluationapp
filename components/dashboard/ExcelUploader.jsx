import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ExcelUploader({ type, onSuccess }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState('');

  const schemas = {
    SKU: {
      type: "object",
      properties: {
        sku_code: { type: "string" },
        product_name: { type: "string" },
        category: { type: "string", enum: ["capital_equipment", "disposable"] },
        subcategory: { type: "string" },
        description: { type: "string" },
        unit_price: { type: "number" },
        reprocessable: { type: "boolean" },
        requires_training: { type: "boolean" },
        availability_status: { type: "string", enum: ["available", "limited", "discontinued"] },
        product_family: { type: "string" }
      },
      required: ["sku_code", "product_name", "category"]
    },
    Account: {
      type: "object",
      properties: {
        account_name: { type: "string" },
        ship_to_ucn_number: { type: "string" },
        account_type: { type: "string", enum: ["high_volume_multi_specialty", "community_hospital", "ambulatory_surgery_center", "specialty_clinic"] },
        customer_contact_name: { type: "string" },
        customer_contact_email: { type: "string" },
        customer_contact_phone: { type: "string" },
        contact_person: { type: "string" },
        contact_email: { type: "string" },
        contact_phone: { type: "string" },
        shipping_receiving_hours: { type: "string" },
        is_government: { type: "boolean" }
      },
      required: ["account_name", "account_type", "contact_person", "contact_email"]
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setResult(null);
    setError(null);
    setProgress('');
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setError(null);
    setResult(null);
    setProgress('');

    try {
      setProgress('Uploading file...');
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      
      if (type === 'Account') {
        setProgress('Analyzing file with AI...');
        const llmResult = await base44.integrations.Core.InvokeLLM({
          prompt: `Extract account data from this file. For each account, include:
- account_name
- ship_to_ucn_number (UCN)
- All SKU codes they purchased (as array)
- Their most recent purchase date

Return as JSON array with this structure:
{
  "accounts": [
    {
      "account_name": "string",
      "ship_to_ucn_number": "string",
      "purchased_skus": ["sku1", "sku2"],
      "last_purchase_date": "YYYY-MM-DD"
    }
  ]
}`,
          file_urls: [uploadResult.file_url],
          response_json_schema: {
            type: "object",
            properties: {
              accounts: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    account_name: { type: "string" },
                    ship_to_ucn_number: { type: "string" },
                    purchased_skus: { type: "array", items: { type: "string" } },
                    last_purchase_date: { type: "string" }
                  }
                }
              }
            }
          }
        });

        const accounts = llmResult.accounts;
        if (!Array.isArray(accounts) || accounts.length === 0) {
          throw new Error('No valid account data found in file');
        }

        setProgress(`Processing ${accounts.length} accounts...`);
        
        const existingAccounts = await base44.entities.Account.list('-created_date', 1000);
        let created = 0;
        let updated = 0;

        for (const accountData of accounts) {
          const existing = existingAccounts.find(a => 
            a.ship_to_ucn_number === accountData.ship_to_ucn_number
          );

          const purchaseHistory = {
            skus: accountData.purchased_skus || [],
            last_purchase: accountData.last_purchase_date
          };

          if (existing) {
            await base44.entities.Account.update(existing.id, {
              purchase_history: purchaseHistory
            });
            updated++;
          } else {
            await base44.entities.Account.create({
              account_name: accountData.account_name,
              ship_to_ucn_number: accountData.ship_to_ucn_number,
              account_type: 'community_hospital',
              contact_person: 'Not specified',
              contact_email: 'noemail@example.com',
              purchase_history: purchaseHistory
            });
            created++;
          }
        }

        setResult({
          success: true,
          count: accounts.length,
          message: `Processed ${accounts.length} accounts (${created} created, ${updated} updated with purchase history)`
        });

      } else {
        setProgress('Extracting data...');
        const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url: uploadResult.file_url,
          json_schema: {
            type: "array",
            items: schemas[type]
          }
        });

        if (extractResult.status === 'error') {
          throw new Error(extractResult.details || 'Failed to extract data from file');
        }

        const records = extractResult.output;
        if (!Array.isArray(records) || records.length === 0) {
          throw new Error('No valid records found in the file');
        }

        setProgress(`Creating ${records.length} records...`);
        const createdRecords = await base44.entities.SKU.bulkCreate(records);

        setResult({
          success: true,
          count: createdRecords.length,
          message: `Successfully imported ${createdRecords.length} ${type.toLowerCase()}${createdRecords.length !== 1 ? 's' : ''}`
        });
      }

      if (onSuccess) {
        onSuccess();
      }

      setFile(null);
      document.getElementById(`${type.toLowerCase()}-file-upload`).value = '';

    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      setError(error.message || `Failed to upload ${type} data`);
    } finally {
      setIsUploading(false);
      setProgress('');
    }
  };

  const getTemplateInfo = () => {
    if (type === 'SKU') {
      return {
        columns: 'sku_code, product_name, category, subcategory, description, unit_price, reprocessable, requires_training, availability_status, product_family',
        example: 'Example: 225028, VAPR TRIPOLAR 90, disposable, electrodes, VAPR TRIPOLAR 90 Suction Electrode, 0, false, false, available, VAPR'
      };
    } else {
      return {
        columns: 'account_name, ship_to_ucn_number, account_type, customer_contact_name, customer_contact_email, customer_contact_phone, contact_person, contact_email, contact_phone, shipping_receiving_hours, is_government',
        example: 'Example: General Hospital, UCN123, community_hospital, John Doe, john@hospital.com, (555) 123-4567, Jane Smith, jane@hospital.com, (555) 987-6543, Mon-Fri 8AM-5PM, false'
      };
    }
  };

  const templateInfo = getTemplateInfo();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-green-600" />
          Upload {type} {type === 'Account' ? 'Purchase History' : 'Data'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${type.toLowerCase()}-file-upload`}>{type === 'Account' ? 'Excel or CSV File' : 'CSV File'}</Label>
          <Input
            id={`${type.toLowerCase()}-file-upload`}
            type="file"
            accept={type === 'Account' ? ".xlsx,.xls,.csv" : ".csv"}
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              {type === 'Account' ? (
                <>
                  <p><strong>Upload Excel file with:</strong> Account Name, UCN, SKU codes, Platform, Most Recent Purchase Date</p>
                  <p className="text-xs">AI will extract account info and purchase history automatically.</p>
                </>
              ) : (
                <>
                  <p><strong>File Format:</strong> CSV only.</p>
                  <p><strong>Required columns:</strong></p>
                  <p className="text-xs font-mono bg-gray-100 p-2 rounded">{templateInfo.columns}</p>
                  <p><strong>Example row:</strong></p>
                  <p className="text-xs font-mono bg-gray-100 p-2 rounded">{templateInfo.example}</p>
                </>
              )}
            </div>
          </AlertDescription>
        </Alert>

        {progress && (
          <div className="text-sm text-blue-600 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {progress}
          </div>
        )}

        <Button 
          onClick={handleUpload} 
          disabled={!file || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload {type} Data
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && result.success && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {result.message}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}