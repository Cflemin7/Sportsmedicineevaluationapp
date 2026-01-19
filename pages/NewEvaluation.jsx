import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  Users,
  Package,
  Loader2,
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  X
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge"; // Added import
import { format } from 'date-fns'; // Added import
import AccountSection from "../components/evaluation/AccountSection";
import ShippingSection from "../components/evaluation/ShippingSection";
import SalesTeamSection from "../components/evaluation/SalesTeamSection";
import ProductsSection from "../components/evaluation/ProductsSection";
import EvaluationSummary from "../components/evaluation/EvaluationSummary";

export default function NewEvaluation() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [governmentApprovalFile, setGovernmentApprovalFile] = useState('');
  const [governmentApprovalFileName, setGovernmentApprovalFileName] = useState('');
  const [isUploadingApproval, setIsUploadingApproval] = useState(false);
  const [complianceViolations, setComplianceViolations] = useState([]);
  const [isCheckingCompliance, setIsCheckingCompliance] = useState(false);

  const [formData, setFormData] = useState({
    account_id: "",
    ship_to_ucn_number: "",
    evaluation_date: new Date().toISOString().split('T')[0],
    ship_to_name: "",
    ship_to_address: "",
    ship_to_city: "",
    ship_to_state: "",
    ship_to_zip: "",
    ship_to_country: "USA",
    ship_to_phone: "",
    ship_to_attention: "",
    sales_rep_name: "",
    sales_rep_email: "",
    sales_rep_phone: "",
    territory_manager: "",
    territory_manager_email: "",
    territory_manager_phone: "",
    customer_contact_name: "",
    customer_contact_email: "",
    customer_contact_phone: "",
    surgeons: [{ name: "", anatomy_focuses: [] }],
    evaluation_start_date: "",
    evaluation_end_date: "",
    purchase_order_number: "",
    products: [],
    special_instructions: "",
    clinical_notes: "",
    compliance_notes: "",
    is_government: false,
    government_approval_obtained: false,
    status: "draft"
  });

  useEffect(() => {
    loadAccounts();
    loadProducts();
  }, []);

  const loadAccounts = async () => {
    try {
      const accountsList = await base44.entities.Account.list('-created_date', 1000);
      setAccounts(accountsList || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const loadProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const skuList = await base44.entities.SKU.list('-created_date', 1000);
      setAllProducts(skuList || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const checkProductCompliance = async (accountId, products) => {
    if (!accountId || products.length === 0) {
      setComplianceViolations([]);
      return true;
    }

    setIsCheckingCompliance(true);
    try {
      // Get all previous evaluations for this account
      const allEvaluations = await base44.entities.Evaluation.list('-created_date', 1000);
      const accountEvaluations = allEvaluations.filter(e => e.account_id === accountId);

      const violations = [];
      const now = new Date();
      const twelveMonthsAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));

      // Check each product in the cart
      for (const product of products) {
        // Find any previous evaluations with this SKU
        for (const evaluation of accountEvaluations) {
          const evalDate = new Date(evaluation.created_date);
          
          // Check if evaluation is within last 12 months
          if (evalDate > twelveMonthsAgo) {
            // Check if this SKU was in that evaluation
            const hadThisSKU = evaluation.requested_items?.some(item => item.sku_code === product.sku_code);
            
            if (hadThisSKU) {
              // Calculate when they can evaluate again (366 days from last evaluation)
              const canEvaluateDate = new Date(evalDate.getTime() + (366 * 24 * 60 * 60 * 1000));
              const daysUntilEligible = Math.ceil((canEvaluateDate - now) / (1000 * 60 * 60 * 24));
              
              violations.push({
                sku_code: product.sku_code,
                product_name: product.product_name,
                last_evaluation_date: evalDate,
                can_evaluate_date: canEvaluateDate,
                days_until_eligible: daysUntilEligible,
                evaluation_number: evaluation.evaluation_number || evaluation.id.slice(0, 8)
              });
              // Only need to find one violation per product, so break after the first match
              break; 
            }
          }
        }
      }

      setComplianceViolations(violations);
      return violations.length === 0;
    } catch (error) {
      console.error('Error checking compliance:', error);
      return true; // Allow on error, but log it
    } finally {
      setIsCheckingCompliance(false);
    }
  };

  const handleAccountChange = (accountId) => {
    const account = accounts.find(a => a.id === accountId);
    if (account) {
      setFormData(prev => ({
        ...prev,
        account_id: accountId,
        ship_to_ucn_number: account.ship_to_ucn_number || "",
        ship_to_name: account.account_name || "",
        ship_to_address: account.billing_address?.street || "",
        ship_to_city: account.billing_address?.city || "",
        ship_to_state: account.billing_address?.state || "",
        ship_to_zip: account.billing_address?.zip_code || "",
        ship_to_country: account.billing_address?.country || "USA",
        ship_to_phone: account.contact_phone || "",
        ship_to_attention: account.contact_person || "",
        is_government: account.is_government || false,
      }));
      
      if (account.is_government) {
        alert("IMPORTANT: This is a government account. You must contact US Marketing to obtain Government accounts team approval before proceeding.");
      }

      // Check compliance when account changes
      checkProductCompliance(accountId, formData.products);
    } else {
      setFormData(prev => ({ ...prev, account_id: accountId }));
      setComplianceViolations([]);
    }
  };

  // Watch for product changes and recheck compliance
  useEffect(() => {
    if (formData.account_id && formData.products.length > 0) {
      checkProductCompliance(formData.account_id, formData.products);
    } else {
      setComplianceViolations([]);
    }
  }, [formData.products, formData.account_id]);

  const addSurgeon = () => {
    setFormData(prev => ({
      ...prev,
      surgeons: [...prev.surgeons, { name: "", anatomy_focuses: [] }]
    }));
  };

  const removeSurgeon = (index) => {
    setFormData(prev => ({
      ...prev,
      surgeons: prev.surgeons.filter((_, i) => i !== index)
    }));
  };

  const updateSurgeonName = (index, name) => {
    setFormData(prev => ({
      ...prev,
      surgeons: prev.surgeons.map((surgeon, i) =>
        i === index ? { ...surgeon, name } : surgeon
      )
    }));
  };

  const handleAnatomyChange = (surgeonIndex, anatomy, isChecked) => {
    setFormData(prev => {
      const newSurgeons = [...prev.surgeons];
      const currentAnatomies = newSurgeons[surgeonIndex].anatomy_focuses || [];
      if (isChecked) {
        newSurgeons[surgeonIndex].anatomy_focuses = [...new Set([...currentAnatomies, anatomy])];
      } else {
        newSurgeons[surgeonIndex].anatomy_focuses = currentAnatomies.filter(a => a !== anatomy);
      }
      return { ...prev, surgeons: newSurgeons };
    });
  };

  const handleGovernmentApprovalUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingApproval(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setGovernmentApprovalFile(result.file_url);
      setGovernmentApprovalFileName(file.name);
    } catch (error) {
      console.error('Error uploading government approval:', error);
      alert('Error uploading approval file. Please try again.');
    } finally {
      setIsUploadingApproval(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.account_id) {
      alert('Please select an account');
      return;
    }

    if (!formData.customer_contact_name || !formData.customer_contact_email) {
      alert('Please provide customer contact name and email for e-signature');
      return;
    }

    if (formData.products.length === 0) {
      alert('Please add at least one product');
      return;
    }

    // Check compliance before submitting
    const isCompliant = await checkProductCompliance(formData.account_id, formData.products);
    if (!isCompliant) {
      alert('Cannot submit evaluation: Compliance violations detected. Please review the warnings above and remove the products that are not yet eligible for evaluation.');
      return;
    }

    if (formData.is_government) {
      if (!formData.government_approval_obtained) {
        alert('Government account evaluations require explicit approval acknowledgment.');
        return;
      }
      if (!governmentApprovalFile) {
        alert('Government account evaluations require an uploaded approval document.');
        return;
      }
    }

    setIsLoading(true);
    try {
      const evaluationData = {
        account_id: formData.account_id,
        ship_to_ucn_number: formData.ship_to_ucn_number,
        sales_consultant: formData.sales_rep_name,
        sales_consultant_email: formData.sales_rep_email,
        sales_consultant_phone: formData.sales_rep_phone,
        territory_manager: formData.territory_manager,
        territory_manager_email: formData.territory_manager_email,
        territory_manager_phone: formData.territory_manager_phone,
        customer_contact_name: formData.customer_contact_name,
        customer_contact_email: formData.customer_contact_email,
        customer_contact_phone: formData.customer_contact_phone,
        surgeons: formData.surgeons,
        evaluation_start_date: formData.evaluation_start_date,
        evaluation_end_date: formData.evaluation_end_date,
        purchase_order_number: formData.purchase_order_number,
        requested_items: formData.products.map(p => ({
          sku_code: p.sku_code,
          quantity: p.quantity,
          notes: p.product_name
        })),
        special_instructions: formData.special_instructions,
        compliance_notes: formData.compliance_notes,
        government_approval_obtained: formData.is_government && formData.government_approval_obtained,
        government_approval_file_url: governmentApprovalFile,
        government_approval_file_name: governmentApprovalFileName,
        status: formData.status
      };

      await base44.entities.Evaluation.create(evaluationData);
      navigate(createPageUrl("Dashboard"));
    } catch (error) {
      console.error('Error creating evaluation:', error);
      alert('Error creating evaluation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("Dashboard")}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">New Evaluation Request</h1>
              <p className="text-gray-600 mt-1">Create a new equipment evaluation</p>
            </div>
          </div>
        </div>

        {/* Instructions Card */}
        <Card className="shadow-lg mb-6 border-blue-200 bg-blue-50">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Instructions for Creating an Evaluation Request
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Before You Begin:</h4>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                  <li>Ensure you have discussed the evaluation with the account and have their commitment</li>
                  <li>Confirm the evaluation dates and surgeon schedules</li>
                  <li>Verify shipping address and contact information</li>
                  <li>For government accounts: Obtain approval from US Marketing before proceeding</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Step-by-Step Process:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li><strong>Select Account:</strong> Choose the hospital or facility from the dropdown (or create a new account if needed)</li>
                  <li><strong>Verify Shipping Information:</strong> Confirm the shipping address is correct and complete</li>
                  <li><strong>Enter Sales Team Information:</strong> Fill in your contact details and territory manager information</li>
                  <li><strong>Add Surgeons:</strong> List all evaluating surgeons and their anatomy focus areas</li>
                  <li><strong>Select Products:</strong> Choose the equipment and disposables for evaluation</li>
                  <li><strong>Set Evaluation Dates:</strong> Enter the start and end dates for the evaluation period</li>
                  <li><strong>Add Special Instructions:</strong> Include any special handling, delivery notes, or compliance requirements</li>
                  <li><strong>Government Accounts:</strong> If applicable, upload government approval documentation</li>
                  <li><strong>Review & Submit:</strong> Check the summary and submit your evaluation request</li>
                  <li><strong>Final Step:</strong> Once the contract is signed and a no-charge PO# is provided, create a Salesforce case and submit to Contract Management for processing</li>
                </ol>
              </div>

              <Alert className="border-orange-500 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800 text-sm">
                  <strong>Important Reminder:</strong> For disposable items, ensure compliance with the 10-unit limit per surgeon per anatomy. Capital equipment evaluations require proper setup coordination and training schedules.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Violations Alert */}
        {complianceViolations.length > 0 && (
          <Alert className="mb-6 border-red-500 bg-red-50">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-900">
              <div className="space-y-3">
                <div>
                  <strong className="text-lg">⚠️ Compliance Violation Detected</strong>
                  <p className="mt-2 text-sm">
                    The following products cannot be evaluated because they were evaluated within the last 12 months. 
                    Per compliance policy, products can only be re-evaluated after 366 days from the previous evaluation.
                  </p>
                </div>
                
                <div className="space-y-2">
                  {complianceViolations.map((violation, index) => (
                    <Card key={index} className="border-red-300 bg-white">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-red-900">{violation.product_name}</h4>
                              <p className="text-sm text-gray-600">SKU: {violation.sku_code}</p>
                            </div>
                            <Badge className="bg-red-600 text-white">Not Eligible</Badge>
                          </div>
                          <div className="text-sm space-y-1">
                            <p>
                              <strong>Last Evaluated:</strong> {format(new Date(violation.last_evaluation_date), 'MMM d, yyyy')}
                              {' '}(Eval #{violation.evaluation_number})
                            </p>
                            <p>
                              <strong>Eligible Again:</strong> {format(new Date(violation.can_evaluate_date), 'MMM d, yyyy')}
                            </p>
                            <p className="text-red-700 font-medium">
                              ⏱️ {violation.days_until_eligible > 0 ? `${violation.days_until_eligible} days remaining until eligible` : 'Eligible Today'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Alert className="border-orange-500 bg-orange-50">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-900 text-sm">
                    <strong>Action Required:</strong> Please remove the non-compliant products from your cart before submitting this evaluation.
                  </AlertDescription>
                </Alert>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {isCheckingCompliance && (
          <Alert className="mb-6 border-blue-500 bg-blue-50">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <AlertDescription className="text-blue-900">
              Checking product compliance for this account...
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <AccountSection 
            formData={formData}
            setFormData={setFormData}
            accounts={accounts}
            handleAccountChange={handleAccountChange}
          />

          <ShippingSection
            formData={formData}
            setFormData={setFormData}
          />

          <SalesTeamSection
            formData={formData}
            setFormData={setFormData}
          />

          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Evaluating Surgeons
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addSurgeon}
                  className="bg-white text-indigo-600 hover:bg-gray-100"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Surgeon
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {formData.surgeons.map((surgeon, index) => (
                <div key={index} className="p-4 border rounded-lg bg-gray-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Surgeon {index + 1}</h4>
                    {formData.surgeons.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeSurgeon(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Surgeon Name</Label>
                    <Input
                      value={surgeon.name}
                      onChange={(e) => updateSurgeonName(index, e.target.value)}
                      placeholder="Dr. Smith"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Anatomy Focus Areas</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {['Shoulder', 'Knee', 'Hip', 'Ankle', 'Elbow', 'Wrist', 'Spine', 'Sports Medicine', 'General Surgery'].map(anatomy => (
                        <div key={anatomy} className="flex items-center space-x-2">
                          <Checkbox
                            id={`surgeon-${index}-${anatomy}`}
                            checked={surgeon.anatomy_focuses?.includes(anatomy) || false}
                            onCheckedChange={(checked) => handleAnatomyChange(index, anatomy, checked)}
                          />
                          <Label htmlFor={`surgeon-${index}-${anatomy}`} className="text-sm">
                            {anatomy}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <ProductsSection
            formData={formData}
            setFormData={setFormData}
            allProducts={allProducts}
            isLoadingProducts={isLoadingProducts}
          />

          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Evaluation Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="evaluation_start_date">Evaluation Start Date</Label>
                  <Input
                    id="evaluation_start_date"
                    type="date"
                    value={formData.evaluation_start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, evaluation_start_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="evaluation_end_date">Evaluation End Date</Label>
                  <Input
                    id="evaluation_end_date"
                    type="date"
                    value={formData.evaluation_end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, evaluation_end_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchase_order_number">Purchase Order Number</Label>
                  <Input
                    id="purchase_order_number"
                    value={formData.purchase_order_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, purchase_order_number: e.target.value }))}
                    placeholder="PO-123456"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-900 text-white">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_contact_name">Customer Contact Name</Label>
                  <Input
                    id="customer_contact_name"
                    value={formData.customer_contact_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_contact_name: e.target.value }))}
                    placeholder="Jane Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_contact_email">Customer Contact Email</Label>
                  <Input
                    id="customer_contact_email"
                    type="email"
                    value={formData.customer_contact_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_contact_email: e.target.value }))}
                    placeholder="jane.doe@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_contact_phone">Customer Contact Phone</Label>
                  <Input
                    id="customer_contact_phone"
                    type="tel"
                    value={formData.customer_contact_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_contact_phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="special_instructions">Special Instructions</Label>
                <Textarea
                  id="special_instructions"
                  value={formData.special_instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, special_instructions: e.target.value }))}
                  placeholder="Any special handling or delivery instructions..."
                  className="h-24"
                />
              </div>

              <div>
                <Label htmlFor="compliance_notes">Compliance Notes</Label>
                <Textarea
                  id="compliance_notes"
                  value={formData.compliance_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, compliance_notes: e.target.value }))}
                  placeholder="Any compliance or regulatory notes..."
                  className="h-24"
                />
              </div>

              {formData.is_government && (
                <>
                  <Alert className="border-orange-500 bg-orange-50">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      <div className="space-y-2">
                        <p><strong>GOVERNMENT ACCOUNT EVALUATION</strong></p>
                        <p>This evaluation requires approval from the Government accounts team. You must contact <strong>US Marketing</strong> to obtain Government approval before proceeding.</p>
                      </div>
                    </AlertDescription>
                  </Alert>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="government_approval_obtained"
                      checked={formData.government_approval_obtained}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, government_approval_obtained: checked }))}
                    />
                    <Label htmlFor="government_approval_obtained">
                      Government approval has been obtained for this evaluation
                    </Label>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-orange-800 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Government Approval File Upload
                    </h4>
                    <div className="space-y-2">
                      <Label htmlFor="government-approval-file" className="text-sm font-medium">
                        Upload Government Approval Email (e.g., .eml, .msg, PDF, image) *
                      </Label>
                      <div className="flex items-center gap-3">
                        <Input
                          id="government-approval-file"
                          type="file"
                          onChange={handleGovernmentApprovalUpload}
                          disabled={isUploadingApproval}
                          className="flex-1"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.eml,.msg"
                        />
                        {isUploadingApproval && (
                          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        )}
                      </div>
                      {governmentApprovalFile && (
                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-green-800 truncate">{governmentApprovalFileName || 'Uploaded File'}</p>
                            <a
                              href={governmentApprovalFile}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-green-700 hover:underline"
                            >
                              View uploaded file
                            </a>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setGovernmentApprovalFile('');
                              setGovernmentApprovalFileName('');
                            }}
                            className="text-red-600 hover:text-red-700 p-1 h-auto"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <EvaluationSummary formData={formData} accounts={accounts} />

          <div className="flex justify-end gap-4">
            <Link to={createPageUrl("Dashboard")}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isLoading || isCheckingCompliance || complianceViolations.length > 0}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Evaluation
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}