import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Building2, Phone, Mail, MapPin, FileText, Package, Calendar, AlertCircle, RefreshCw, Upload, Loader2, X, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ManageAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [skus, setSkus] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accountEvaluations, setAccountEvaluations] = useState([]);
  const [loadError, setLoadError] = useState(null);

  // Upload historical evaluation states
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [accountMode, setAccountMode] = useState('existing'); // 'existing' or 'new'
  const [uploadData, setUploadData] = useState({
    // Existing account
    existing_account_id: '',
    // New account fields
    account_name: '',
    account_type: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    ship_to_ucn_number: '',
    // Evaluation fields
    evaluation_number: '',
    evaluation_date: '',
    pdf_file: null,
    notes: '',
    // Products
    selected_products: []
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [isExtractingData, setIsExtractingData] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      let accountsData = [];
      let evaluationsData = [];
      let skusData = [];
      let userData = null;

      try {
        accountsData = await base44.entities.Account.list('-created_date');
      } catch (error) {
        console.error('Error loading accounts:', error);
        setLoadError('Unable to load accounts. You may not have permission to view this data.');
      }

      try {
        evaluationsData = await base44.entities.Evaluation.list('-created_date', 1000);
      } catch (error) {
        console.error('Error loading evaluations:', error);
      }

      try {
        skusData = await base44.entities.SKU.list('-created_date', 500);
      } catch (error) {
        console.error('Error loading SKUs:', error);
      }

      try {
        userData = await base44.auth.me();
      } catch (error) {
        console.error('Error loading user:', error);
      }

      // Merge duplicate accounts (same name AND same UCN)
      const accountMap = new Map();
      const accountsToDelete = [];

      for (const account of accountsData) {
        const key = `${account.account_name?.toLowerCase()}_${account.ship_to_ucn_number}`;
        
        if (!account.account_name || !account.ship_to_ucn_number) {
          accountMap.set(account.id, account);
          continue;
        }

        if (accountMap.has(key)) {
          const existing = accountMap.get(key);
          
          // Merge purchase history
          if (account.purchase_history || existing.purchase_history) {
            const existingSkus = existing.purchase_history?.skus || [];
            const newSkus = account.purchase_history?.skus || [];
            const mergedSkus = [...new Set([...existingSkus, ...newSkus])];
            
            const existingDate = existing.purchase_history?.last_purchase;
            const newDate = account.purchase_history?.last_purchase;
            let latestDate = existingDate;
            
            if (existingDate && newDate) {
              latestDate = new Date(existingDate) > new Date(newDate) ? existingDate : newDate;
            } else if (newDate) {
              latestDate = newDate;
            }
            
            existing.purchase_history = {
              skus: mergedSkus,
              last_purchase: latestDate
            };
          }
          
          accountsToDelete.push(account.id);
        } else {
          accountMap.set(key, account);
        }
      }

      // Update merged accounts and delete duplicates
      if (accountsToDelete.length > 0 && userData?.role === 'admin') {
        try {
          for (const [key, account] of accountMap) {
            if (typeof key === 'string' && account.purchase_history) {
              await base44.entities.Account.update(account.id, {
                purchase_history: account.purchase_history
              });
            }
          }
          
          for (const accountId of accountsToDelete) {
            await base44.entities.Account.delete(accountId);
          }
          
          accountsData = Array.from(accountMap.values());
        } catch (error) {
          console.error('Error merging accounts:', error);
        }
      } else {
        accountsData = Array.from(accountMap.values());
      }

      setAccounts(accountsData);
      setEvaluations(evaluationsData);
      setSkus(skusData);
      setCurrentUser(userData);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoadError('An unexpected error occurred. Please try refreshing the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterAccounts = useCallback(() => {
    let filtered = accounts;

    if (searchTerm) {
      filtered = filtered.filter(account =>
        account.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.contact_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(account => account.account_type === typeFilter);
    }

    setFilteredAccounts(filtered);
  }, [accounts, searchTerm, typeFilter]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAccounts();
  }, [filterAccounts]);

  const handleViewHistory = (account) => {
    const accountEvals = evaluations.filter(e => e.account_id === account.id);
    setAccountEvaluations(accountEvals);
    setSelectedAccount(account);
  };

  const handleUploadHistorical = () => {
    setAccountMode('existing');
    setUploadData({
      existing_account_id: '',
      account_name: '',
      account_type: '',
      contact_person: '',
      contact_email: '',
      contact_phone: '',
      ship_to_ucn_number: '',
      evaluation_number: '',
      evaluation_date: '',
      pdf_file: null,
      notes: '',
      selected_products: []
    });
    setProductSearch('');
    setShowUploadDialog(true);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setUploadData(prev => ({ ...prev, pdf_file: file }));

      // Ask user if they want to auto-extract data
      const shouldExtract = confirm('Would you like to automatically extract information from this PDF? This will auto-fill the form fields.');

      if (shouldExtract) {
        await extractDataFromPDF(file);
      }
    } else {
      alert('Please select a PDF file');
      e.target.value = '';
    }
  };

  const extractDataFromPDF = async (file) => {
    setIsExtractingData(true);
    try {
      // First upload the file
      const uploadResult = await base44.integrations.Core.UploadFile({ file });

      // Define the JSON schema for extraction
      const jsonSchema = {
        type: "object",
        properties: {
          account_name: {
            type: "string",
            description: "Hospital or clinic name"
          },
          contact_person: {
            type: "string",
            description: "Primary contact person name"
          },
          contact_email: {
            type: "string",
            description: "Contact email address"
          },
          contact_phone: {
            type: "string",
            description: "Contact phone number"
          },
          ucn_number: {
            type: "string",
            description: "UCN or customer number"
          },
          street_address: { // These fields are for potential future use or AI output, not directly mapped to uploadData state
            type: "string",
            description: "Street address"
          },
          city: {
            type: "string",
            description: "City"
          },
          state: {
            type: "string",
            description: "State"
          },
          zip_code: {
            type: "string",
            description: "ZIP code"
          },
          evaluation_number: {
            type: "string",
            description: "Evaluation number or reference number"
          },
          evaluation_date: {
            type: "string",
            description: "Evaluation date in YYYY-MM-DD format"
          },
          products: {
            type: "array",
            description: "List of products or SKUs mentioned in the document",
            items: {
              type: "object",
              properties: {
                sku_code: {
                  type: "string",
                  description: "Product SKU code"
                },
                product_name: {
                  type: "string",
                  description: "Product name or description"
                },
                quantity: {
                  type: "integer",
                  description: "Quantity requested"
                }
              }
            }
          },
          notes: {
            type: "string",
            description: "Any additional notes or special instructions"
          }
        }
      };

      // Extract data from the PDF
      const extractionResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: uploadResult.file_url,
        json_schema: jsonSchema
      });

      if (extractionResult.status === 'success' && extractionResult.output) {
        const data = extractionResult.output;

        // Update form with extracted data
        setUploadData(prev => ({
          ...prev,
          account_name: data.account_name || prev.account_name,
          contact_person: data.contact_person || prev.contact_person,
          contact_email: data.contact_email || prev.contact_email,
          contact_phone: data.contact_phone || prev.contact_phone,
          ship_to_ucn_number: data.ucn_number || prev.ship_to_ucn_number,
          evaluation_number: data.evaluation_number || prev.evaluation_number,
          evaluation_date: data.evaluation_date || prev.evaluation_date,
          notes: data.notes || prev.notes,
          pdf_file: file // Make sure the file is still set after extraction
        }));

        // Match and add products from the catalog
        if (data.products && Array.isArray(data.products)) {
          const matchedProducts = [];

          for (const extractedProduct of data.products) {
            // Try to find matching SKU in catalog
            const matchedSKU = skus.find(sku =>
              sku.sku_code === extractedProduct.sku_code ||
              (extractedProduct.product_name && sku.product_name?.toLowerCase().includes(extractedProduct.product_name?.toLowerCase())) ||
              (extractedProduct.sku_code && sku.sku_code?.includes(extractedProduct.sku_code))
            );

            if (matchedSKU) {
              matchedProducts.push({
                sku_code: matchedSKU.sku_code,
                product_name: matchedSKU.product_name,
                category: matchedSKU.category,
                quantity: extractedProduct.quantity || 1
              });
            }
          }

          if (matchedProducts.length > 0) {
            setUploadData(prev => ({
              ...prev,
              selected_products: matchedProducts
            }));
          }
        }

        // Try to find existing account by name
        if (data.account_name) {
          const existingAccount = accounts.find(a =>
            a.account_name?.toLowerCase() === data.account_name.toLowerCase()
          );

          if (existingAccount) {
            setAccountMode('existing');
            setUploadData(prev => ({
              ...prev,
              existing_account_id: existingAccount.id,
              contact_person: existingAccount.contact_person || data.contact_person || '',
              contact_email: existingAccount.contact_email || data.contact_email || ''
            }));
            alert(`Found existing account: ${existingAccount.account_name}. Data has been pre-filled.`);
          } else {
            setAccountMode('new');
            alert('Data extracted successfully! Please review the pre-filled information before submitting.');
          }
        } else {
          alert('Data extracted successfully! Please review the pre-filled information before submitting.');
        }
      } else {
        alert('Could not extract data from PDF. Please fill in the form manually. Error: ' + (extractionResult.details || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error extracting data from PDF:', error);
      alert('Error extracting data from PDF. Please fill in the form manually.');
    } finally {
      setIsExtractingData(false);
    }
  };

  const addProduct = (sku) => {
    if (!uploadData.selected_products.find(p => p.sku_code === sku.sku_code)) {
      setUploadData(prev => ({
        ...prev,
        selected_products: [...prev.selected_products, {
          sku_code: sku.sku_code,
          product_name: sku.product_name,
          category: sku.category,
          quantity: 1
        }]
      }));
    }
  };

  const removeProduct = (skuCode) => {
    setUploadData(prev => ({
      ...prev,
      selected_products: prev.selected_products.filter(p => p.sku_code !== skuCode)
    }));
  };

  const updateProductQuantity = (skuCode, quantity) => {
    setUploadData(prev => ({
      ...prev,
      selected_products: prev.selected_products.map(p =>
        p.sku_code === skuCode ? { ...p, quantity: Math.max(1, parseInt(quantity) || 1) } : p
      )
    }));
  };

  const handleUploadSubmit = async () => {
    if (!uploadData.pdf_file) {
      alert('Please select a PDF file');
      return;
    }

    if (!uploadData.evaluation_number || !uploadData.evaluation_date) {
      alert('Please provide an evaluation number and date');
      return;
    }

    let accountId = uploadData.existing_account_id;

    // Validate based on mode
    if (accountMode === 'new') {
      if (!uploadData.account_name || !uploadData.contact_person || !uploadData.contact_email) {
        alert('Please provide account name, contact person, and contact email for the new account');
        return;
      }
    } else {
      if (!accountId) {
        alert('Please select an account');
        return;
      }
    }

    setIsUploading(true);
    try {
      // Upload the PDF file
      const uploadResult = await base44.integrations.Core.UploadFile({
        file: uploadData.pdf_file
      });

      // Create new account if needed
      if (accountMode === 'new') {
        const newAccount = await base44.entities.Account.create({
          account_name: uploadData.account_name,
          account_type: uploadData.account_type || 'community_hospital',
          contact_person: uploadData.contact_person,
          contact_email: uploadData.contact_email,
          contact_phone: uploadData.contact_phone || '',
          ship_to_ucn_number: uploadData.ship_to_ucn_number || '',
          is_government: false
        });
        accountId = newAccount.id;
      }

      // Create a completed evaluation record with the uploaded PDF
      await base44.entities.Evaluation.create({
        account_id: accountId,
        evaluation_number: uploadData.evaluation_number,
        sales_consultant: currentUser?.full_name || 'Historical Import',
        sales_consultant_email: currentUser?.email || '',
        customer_contact_name: uploadData.contact_person || 'N/A',
        customer_contact_email: uploadData.contact_email || 'historical@example.com',
        evaluation_start_date: uploadData.evaluation_date,
        evaluation_end_date: uploadData.evaluation_date,
        status: 'completed',
        special_instructions: `Historical evaluation imported on ${new Date().toLocaleDateString()}${uploadData.notes ? `\n\nNotes: ${uploadData.notes}` : ''}`,
        pdf_generated: true,
        pdf_url: uploadResult.file_url,
        signed_pdf_url: uploadResult.file_url,
        signature_status: 'signed',
        signed_at: new Date(uploadData.evaluation_date).toISOString(),
        requested_items: uploadData.selected_products.map(p => ({
          sku_code: p.sku_code,
          quantity: p.quantity,
          notes: p.product_name
        }))
      });

      alert('Historical evaluation uploaded successfully!');
      setShowUploadDialog(false);
      await loadData();
    } catch (error) {
      console.error('Error uploading historical evaluation:', error);
      alert('Error uploading evaluation. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const getProductName = (skuCode) => {
    const sku = skus.find(s => s.sku_code === skuCode);
    return sku ? sku.product_name : skuCode;
  };

  const getProductCategory = (skuCode) => {
    const sku = skus.find(s => s.sku_code === skuCode);
    return sku?.category || 'unknown';
  };

  const formatAccountType = (type) => {
    return type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A';
  };

  const getAccountEvaluationCount = (accountId) => {
    return evaluations.filter(e => e.account_id === accountId).length;
  };

  const filteredProducts = skus.filter(sku =>
    sku.product_name?.toLowerCase().includes(productSearch.toLowerCase()) ||
    sku.sku_code?.toLowerCase().includes(productSearch.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("Dashboard")}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Accounts</h1>
              <p className="text-gray-600">View and manage all customer accounts with evaluation history</p>
            </div>
          </div>

          {isAdmin && (
            <Button
              onClick={handleUploadHistorical}
              className="bg-green-600 hover:bg-green-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Historical Evaluation
            </Button>
          )}
        </div>
      </div>

      {loadError && (
        <Alert className="mb-6 border-orange-500 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="flex items-center justify-between">
              <span>{loadError}</span>
              <Button variant="outline" size="sm" onClick={loadData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {isExtractingData && (
        <Alert className="mb-6 border-blue-500 bg-blue-50">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>Extracting data from PDF...</strong>
            <p className="text-sm mt-1">Our AI is reading the document and extracting account, evaluation, and product information. This may take a few seconds.</p>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              All Accounts ({filteredAccounts.length})
            </CardTitle>
            <div className="flex gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search accounts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="high_volume_multi_specialty">High Volume Multi-Specialty</SelectItem>
                  <SelectItem value="community_hospital">Community Hospital</SelectItem>
                  <SelectItem value="ambulatory_surgery_center">Ambulatory Surgery Center</SelectItem>
                  <SelectItem value="specialty_clinic">Specialty Clinic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>UCN Number</TableHead>
                  <TableHead>Purchase History</TableHead>
                  <TableHead>Government</TableHead>
                  <TableHead>Evaluations</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      {loadError ? 'Unable to load accounts. Please try refreshing.' : 'No accounts found matching your criteria.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccounts.map((account) => {
                    const evalCount = getAccountEvaluationCount(account.id);
                    return (
                      <TableRow key={account.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            {account.account_name}
                          </div>
                        </TableCell>
                        <TableCell>{formatAccountType(account.account_type)}</TableCell>
                        <TableCell>{account.contact_person || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {account.contact_email && (
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="w-3 h-3 text-gray-400" />
                                {account.contact_email}
                              </div>
                            )}
                            {account.contact_phone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="w-3 h-3 text-gray-400" />
                                {account.contact_phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{account.ship_to_ucn_number || 'N/A'}</TableCell>
                        <TableCell>
                          {account.purchase_history ? (
                            <div className="space-y-1">
                              <div className="text-xs text-gray-600">
                                <span className="font-medium">{account.purchase_history.skus?.length || 0}</span> SKUs
                              </div>
                              {account.purchase_history.last_purchase && (
                                <div className="text-xs text-gray-500">
                                  Last: {!isNaN(new Date(account.purchase_history.last_purchase).getTime()) 
                                    ? format(new Date(account.purchase_history.last_purchase), 'MMM d, yyyy')
                                    : 'N/A'}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">No data</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            account.is_government
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {account.is_government ? 'Yes' : 'No'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={evalCount > 0 ? 'default' : 'secondary'}>
                            {evalCount} {evalCount === 1 ? 'evaluation' : 'evaluations'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewHistory(account)}
                            disabled={evalCount === 0}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            View History
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Evaluation History Dialog */}
      <Dialog open={!!selectedAccount} onOpenChange={() => setSelectedAccount(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              {selectedAccount?.account_name} - Account History
            </DialogTitle>
            <DialogDescription>
              Purchase history and evaluation records for this account
            </DialogDescription>
          </DialogHeader>

          {/* Purchase History Section */}
          {selectedAccount?.purchase_history && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  Purchase History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedAccount.purchase_history.last_purchase && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">Last Purchase:</span>
                    <span>{!isNaN(new Date(selectedAccount.purchase_history.last_purchase).getTime()) 
                      ? format(new Date(selectedAccount.purchase_history.last_purchase), 'MMMM d, yyyy')
                      : 'N/A'}</span>
                  </div>
                )}
                {selectedAccount.purchase_history.skus && selectedAccount.purchase_history.skus.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Products Purchased ({selectedAccount.purchase_history.skus.length} SKUs):</p>
                    <div className="space-y-2">
                      {selectedAccount.purchase_history.skus.map((sku, idx) => {
                        const skuProduct = skus.find(s => s.sku_code === sku);
                        return (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded border border-blue-200">
                            <Package className="w-4 h-4 text-blue-600" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{skuProduct?.product_name || sku}</p>
                              <p className="text-xs text-gray-600">SKU: {sku}</p>
                            </div>
                            {skuProduct?.category && (
                              <Badge variant={skuProduct.category === 'capital_equipment' ? 'default' : 'secondary'} className="text-xs">
                                {skuProduct.category === 'capital_equipment' ? 'Capital' : 'Disposable'}
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {accountEvaluations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No evaluations found for this account.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {accountEvaluations.map((evaluation) => (
                <Card key={evaluation.id} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-lg">
                          Evaluation #{evaluation.evaluation_number || evaluation.id.slice(0, 8)}
                        </h4>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Created: {evaluation.created_date && !isNaN(new Date(evaluation.created_date).getTime()) ? format(new Date(evaluation.created_date), 'MMM d, yyyy') : 'N/A'}</span>
                          </div>
                          {evaluation.evaluation_start_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>Start: {evaluation.evaluation_start_date && !isNaN(new Date(evaluation.evaluation_start_date).getTime()) ? format(new Date(evaluation.evaluation_start_date), 'MMM d, yyyy') : 'N/A'}</span>
                            </div>
                          )}
                          {evaluation.evaluation_end_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>End: {evaluation.evaluation_end_date && !isNaN(new Date(evaluation.evaluation_end_date).getTime()) ? format(new Date(evaluation.evaluation_end_date), 'MMM d, yyyy') : 'N/A'}</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-2">
                          <Badge className={
                            evaluation.status === 'completed' ? 'bg-green-100 text-green-800' :
                            evaluation.status === 'active' ? 'bg-blue-100 text-blue-800' :
                            evaluation.status === 'approved' ? 'bg-purple-100 text-purple-800' :
                            evaluation.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {evaluation.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline">
                          {evaluation.requested_items?.length || 0} products
                        </Badge>
                        {evaluation.pdf_url && (
                          <a
                            href={evaluation.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <FileText className="w-4 h-4" />
                            View PDF
                          </a>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {evaluation.requested_items && evaluation.requested_items.length > 0 && (
                    <CardContent>
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm text-gray-700 mb-3">Products Evaluated:</h5>
                        <div className="grid gap-2">
                          {evaluation.requested_items.map((item, itemIdx) => {
                            const category = getProductCategory(item.sku_code);
                            return (
                              <div key={itemIdx} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border">
                                <div className="flex items-start gap-3 flex-1">
                                  <Package className={`w-5 h-5 mt-0.5 ${
                                    category === 'capital_equipment' ? 'text-blue-600' : 'text-green-600'
                                  }`} />
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{getProductName(item.sku_code)}</p>
                                    <p className="text-xs text-gray-600">SKU: {item.sku_code}</p>
                                    {item.notes && (
                                      <p className="text-xs text-gray-500 mt-1">{item.notes}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <Badge variant={category === 'capital_equipment' ? 'default' : 'secondary'} className="text-xs">
                                    {category === 'capital_equipment' ? 'Capital' : 'Disposable'}
                                  </Badge>
                                  <span className="text-xs text-gray-600">Qty: {item.quantity}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Historical Evaluation Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-green-600" />
              Upload Historical Evaluation
            </DialogTitle>
            <DialogDescription>
              Upload a PDF and we'll automatically extract the information, or fill it in manually
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert className="border-blue-500 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                <strong>✨ AI-Powered Extraction:</strong> Upload your PDF first, and we'll automatically extract account details, evaluation information, and products. You can review and edit everything before submitting.
              </AlertDescription>
            </Alert>

            {/* PDF Upload Section - moved to top */}
            <div className="space-y-2 p-4 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
              <Label htmlFor="pdf-file" className="text-base font-semibold text-blue-900">
                Step 1: Upload PDF {isExtractingData && "(Extracting...)"} *
              </Label>
              <p className="text-sm text-blue-700 mb-2">
                Upload your evaluation PDF and we'll automatically extract the information
              </p>
              <Input
                id="pdf-file"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={isExtractingData}
              />
              {uploadData.pdf_file && (
                <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                  <FileText className="w-4 h-4" />
                  {uploadData.pdf_file.name}
                  {!isExtractingData && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Reset all auto-filled data that was extracted
                        setUploadData({
                          existing_account_id: '',
                          account_name: '',
                          account_type: '',
                          contact_person: '',
                          contact_email: '',
                          contact_phone: '',
                          ship_to_ucn_number: '',
                          evaluation_number: '',
                          evaluation_date: '',
                          pdf_file: null,
                          notes: '',
                          selected_products: []
                        });
                        setProductSearch('');
                        setAccountMode('existing');
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <Label className="text-base font-semibold text-gray-900 mb-3 block">
                Step 2: Review & Edit Information
              </Label>

              <Tabs value={accountMode} onValueChange={setAccountMode}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="existing">Existing Account</TabsTrigger>
                  <TabsTrigger value="new">New Account</TabsTrigger>
                </TabsList>

                <TabsContent value="existing" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="existing-account">Select Account *</Label>
                    <Select
                      value={uploadData.existing_account_id}
                      onValueChange={(value) => {
                        const account = accounts.find(a => a.id === value);
                        setUploadData(prev => ({
                          ...prev,
                          existing_account_id: value,
                          contact_person: account?.contact_person || '',
                          contact_email: account?.contact_email || ''
                        }));
                      }}
                    >
                      <SelectTrigger>
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
                  </div>
                </TabsContent>

                <TabsContent value="new" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="account-name">Account Name *</Label>
                      <Input
                        id="account-name"
                        value={uploadData.account_name}
                        onChange={(e) => setUploadData(prev => ({ ...prev, account_name: e.target.value }))}
                        placeholder="Hospital or Clinic Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account-type">Account Type</Label>
                      <Select
                        value={uploadData.account_type}
                        onValueChange={(value) => setUploadData(prev => ({ ...prev, account_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high_volume_multi_specialty">High Volume Multi-Specialty</SelectItem>
                          <SelectItem value="community_hospital">Community Hospital</SelectItem>
                          <SelectItem value="ambulatory_surgery_center">Ambulatory Surgery Center</SelectItem>
                          <SelectItem value="specialty_clinic">Specialty Clinic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ucn-number">UCN Number</Label>
                      <Input
                        id="ucn-number"
                        value={uploadData.ship_to_ucn_number}
                        onChange={(e) => setUploadData(prev => ({ ...prev, ship_to_ucn_number: e.target.value }))}
                        placeholder="Customer number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-person">Contact Person *</Label>
                      <Input
                        id="contact-person"
                        value={uploadData.contact_person}
                        onChange={(e) => setUploadData(prev => ({ ...prev, contact_person: e.target.value }))}
                        placeholder="Primary contact name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">Contact Email *</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={uploadData.contact_email}
                        onChange={(e) => setUploadData(prev => ({ ...prev, contact_email: e.target.value }))}
                        placeholder="contact@hospital.com"
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="contact-phone">Contact Phone</Label>
                      <Input
                        id="contact-phone"
                        value={uploadData.contact_phone}
                        onChange={(e) => setUploadData(prev => ({ ...prev, contact_phone: e.target.value }))}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="eval-number">Evaluation Number *</Label>
                  <Input
                    id="eval-number"
                    value={uploadData.evaluation_number}
                    onChange={(e) => setUploadData(prev => ({ ...prev, evaluation_number: e.target.value }))}
                    placeholder="EVAL-2024-001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eval-date">Evaluation Date *</Label>
                  <Input
                    id="eval-date"
                    type="date"
                    value={uploadData.evaluation_date}
                    onChange={(e) => setUploadData(prev => ({ ...prev, evaluation_date: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Products Section */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label>Products Evaluated</Label>
                <Badge variant="secondary">{uploadData.selected_products.length} selected</Badge>
              </div>

              {uploadData.selected_products.length > 0 && (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {uploadData.selected_products.map((product) => (
                    <div key={product.sku_code} className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{product.product_name}</p>
                        <p className="text-xs text-gray-600">SKU: {product.sku_code}</p>
                      </div>
                      <Input
                        type="number"
                        min="1"
                        value={product.quantity}
                        onChange={(e) => updateProductQuantity(product.sku_code, e.target.value)}
                        className="w-16 h-8"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProduct(product.sku_code)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search products to add..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {productSearch && (
                  <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-2">
                    {filteredProducts.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No products found</p>
                    ) : (
                      filteredProducts.map((sku) => (
                        <div
                          key={sku.id}
                          className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                          onClick={() => {
                            addProduct(sku);
                            setProductSearch('');
                          }}
                        >
                          <div>
                            <p className="text-sm font-medium">{sku.product_name}</p>
                            <p className="text-xs text-gray-600">SKU: {sku.sku_code}</p>
                          </div>
                          <Badge variant={sku.category === 'capital_equipment' ? 'default' : 'secondary'}>
                            {sku.category === 'capital_equipment' ? 'Capital' : 'Disposable'}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={uploadData.notes}
                onChange={(e) => setUploadData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any additional notes about this historical evaluation..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowUploadDialog(false)}
                disabled={isUploading || isExtractingData}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUploadSubmit}
                disabled={isUploading || isExtractingData}
                className="bg-green-600 hover:bg-green-700"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Evaluation
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}