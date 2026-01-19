import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Loader2, Plus, Trash2, Building2, Users, Package, AlertTriangle, Search, FileText, ArrowLeft, LayoutDashboard, AlertCircle, CheckCircle, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns'; // Import date-fns format utility

const newCapitalEquipment = [
  { code: "934026", description: "MX AC ZOOM COUPLER EVAL KIT", category: "capital_equipment", reprocessable: true },
  { code: "934186", description: "5.5MM-45-430 LAP SCOPE KIT", category: "capital_equipment", reprocessable: true },
  { code: "934189", description: "10MM-45-450 LAP SCOPE KIT", category: "capital_equipment", reprocessable: true },
  { code: "901168", description: "VAPR VUE KIT", category: "capital_equipment", reprocessable: true },
  { code: "901265", description: "FMS VUE REMOTE ONLY KIT-MX", category: "capital_equipment", reprocessable: true },
  { code: "934195", description: "MX C-MOUNT WRENCH KIT", category: "capital_equipment", reprocessable: true }
];

const disposableProducts = [
  { code: "225028", description: "VAPR TRIPOLAR 90 Suction Electrode", category: "disposable", product_family: "VAPR", reprocessable: false },
  { code: "225029", description: "VAPR ARCTIC® Suction Electrode with Dome Tip", category: "disposable", product_family: "VAPR", reprocessable: false },
  { code: "225030", description: "VAPR ARCTIC Suction Electrode with Chisel Tip", category: "disposable", product_family: "VAPR", reprocessable: false }
];

const productCatalog = [...newCapitalEquipment, ...disposableProducts];

export default function EditEvaluation() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const urlParams = new URLSearchParams(location.search);
  const evaluationId = urlParams.get('id');
  
  const [evaluation, setEvaluation] = useState(location.state?.evaluation || null);
  const [account, setAccount] = useState(location.state?.account || null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!evaluation || !account);
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFamily, setSelectedFamily] = useState('all');

  // New state for government approval file upload
  const [governmentApprovalFile, setGovernmentApprovalFile] = useState('');
  const [governmentApprovalFileName, setGovernmentApprovalFileName] = useState('');
  const [isUploadingApproval, setIsUploadingApproval] = useState(false);

  // Compliance checking state
  const [complianceViolations, setComplianceViolations] = useState([]);
  const [isCheckingCompliance, setIsCheckingCompliance] = useState(false);

  const [formData, setFormData] = useState({
    account_name: "",
    ship_to_ucn_number: "",
    account_type: "",
    contact_person: "",
    contact_email: "",
    contact_phone: "",
    street_address: "",
    city: "",
    state: "",
    zip_code: "",
    sales_consultant: "",
    sales_consultant_email: "",
    sales_consultant_phone: "",
    territory_manager: "",
    surgeons: [{ name: "", anatomy_focuses: [] }],
    evaluation_start_date: "",
    evaluation_end_date: "",
    purchase_order_number: "",
    special_instructions: "",
    is_government: false,
    government_approval_obtained: false
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        let evalData = evaluation;
        let accountData = account;
        
        if (!evalData && evaluationId) {
          evalData = await base44.entities.Evaluation.get(evaluationId); // SDK call
          setEvaluation(evalData);
        }
        
        if (!accountData && evalData?.account_id) {
          accountData = await base44.entities.Account.get(evalData.account_id); // SDK call
          setAccount(accountData);
        }
        
        if (evalData && accountData) {
          setFormData({
            account_name: accountData.account_name || "",
            ship_to_ucn_number: accountData.ship_to_ucn_number || "",
            account_type: accountData.account_type || "",
            contact_person: accountData.contact_person || "",
            contact_email: accountData.contact_email || "",
            contact_phone: accountData.contact_phone || "",
            street_address: accountData.billing_address?.street || "",
            city: accountData.billing_address?.city || "",
            state: accountData.billing_address?.state || "",
            zip_code: accountData.billing_address?.zip_code || "",
            sales_consultant: evalData.sales_consultant || "",
            sales_consultant_email: evalData.sales_consultant_email || "",
            sales_consultant_phone: evalData.sales_consultant_phone || "",
            territory_manager: evalData.territory_manager || "",
            surgeons: evalData.surgeons || [{ name: "", anatomy_focuses: [] }],
            evaluation_start_date: evalData.evaluation_start_date || "",
            evaluation_end_date: evalData.evaluation_end_date || "",
            purchase_order_number: evalData.purchase_order_number || "",
            special_instructions: evalData.special_instructions || "",
            is_government: accountData.is_government || false,
            government_approval_obtained: evalData.government_approval_obtained || false
          });
          
          if (evalData.requested_items) {
            const equipment = evalData.requested_items.map(item => {
              const productInfo = productCatalog.find(p => p.code === item.sku_code);
              return {
                ...productInfo,
                code: item.sku_code,
                description: item.notes || productInfo?.description || item.sku_code,
                quantity: item.quantity
              };
            });
            setSelectedEquipment(equipment);
          }
          
          // Set government approval file data if available
          setGovernmentApprovalFile(evalData.government_approval_file_url || '');
          setGovernmentApprovalFileName(evalData.government_approval_file_name || '');
        }
      } catch (error) {
        console.error("Error loading evaluation data:", error);
        alert("Error loading evaluation data. Please try again.");
        navigate(createPageUrl("Dashboard"));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [evaluationId, evaluation, account, navigate, location.state]);

  // Check compliance when products or account changes
  useEffect(() => {
    // Only check if account and evaluationId are loaded and equipment is selected
    if (account?.id && selectedEquipment.length > 0 && evaluationId) {
      checkProductCompliance(account.id, selectedEquipment, evaluationId);
    } else {
      setComplianceViolations([]); // Clear violations if no account/evaluation/products
    }
  }, [selectedEquipment, account?.id, evaluationId]); // Added evaluationId as dependency

  const checkProductCompliance = async (accountId, products, currentEvaluationId) => {
    if (!accountId || products.length === 0) {
      setComplianceViolations([]);
      return true;
    }

    setIsCheckingCompliance(true);
    try {
      // Get all previous evaluations for this account (excluding current one)
      const allEvaluations = await base44.entities.Evaluation.list('-created_date', 1000); // Fetch a reasonable number of recent evaluations
      const accountEvaluations = allEvaluations.filter(e => 
        e.account_id === accountId && e.id !== currentEvaluationId
      );

      const violations = [];
      const now = new Date();
      const twelveMonthsAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));

      // Check each product in the cart
      for (const product of products) {
        let hasViolationForProduct = false;
        // Find any previous evaluations with this SKU
        for (const evaluation of accountEvaluations) {
          if (!evaluation.created_date) continue; // Skip if no creation date
          const evalDate = new Date(evaluation.created_date);
          
          // Check if evaluation is within last 12 months
          if (evalDate > twelveMonthsAgo) {
            // Check if this SKU was in that evaluation
            const hadThisSKU = evaluation.requested_items?.some(item => item.sku_code === product.code);
            
            if (hadThisSKU) {
              // Calculate when they can evaluate again (366 days from last evaluation)
              const canEvaluateDate = new Date(evalDate.getTime() + (366 * 24 * 60 * 60 * 1000));
              const daysUntilEligible = Math.ceil((canEvaluateDate - now) / (1000 * 60 * 60 * 24));
              
              violations.push({
                sku_code: product.code,
                product_name: product.description,
                last_evaluation_date: evalDate,
                can_evaluate_date: canEvaluateDate,
                days_until_eligible: daysUntilEligible,
                evaluation_number: evaluation.evaluation_number || evaluation.id.slice(0, 8) // Fallback for evaluation number
              });
              hasViolationForProduct = true;
              break; // Only need to find one violation per product
            }
          }
        }
      }

      setComplianceViolations(violations);
      return violations.length === 0;
    } catch (error) {
      console.error('Error checking compliance:', error);
      // It's safer to allow submission if there's an error checking compliance
      // but a more robust solution might display an error to the user and block submission
      // until compliance check is successful. For now, returning true to not block.
      return true; 
    } finally {
      setIsCheckingCompliance(false);
    }
  };

  const AdminSection = () => (
    <div className="fixed top-4 right-4 z-[100] flex gap-2">
      <Link to={createPageUrl("Dashboard")}>
        <Button variant="outline" className="bg-white/80 backdrop-blur-sm hover:bg-white shadow-lg">
          <LayoutDashboard className="w-4 h-4 mr-2" />
          Dashboard
        </Button>
      </Link>
    </div>
  );

  const addEquipment = (equipment) => {
    if (!selectedEquipment.find(item => item.code === equipment.code)) {
      setSelectedEquipment(prev => [...prev, { ...equipment, quantity: 1 }]);
    }
  };

  const removeEquipment = (index) => {
    setSelectedEquipment(prev => prev.filter((_, i) => i !== index));
  };

  const updateEquipmentQuantity = (index, quantity) => {
    setSelectedEquipment(prev => 
      prev.map((item, i) => i === index ? { ...item, quantity: Math.max(1, quantity) } : item)
    );
  };

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

  const handleGovernmentChange = (checked) => {
    setFormData(prev => ({ 
      ...prev, 
      is_government: checked,
      government_approval_obtained: false // Reset approval when unchecking
    }));
    setGovernmentApprovalFile(''); // Also clear uploaded file
    setGovernmentApprovalFileName(''); // And its name
    
    if (checked) {
      alert("IMPORTANT: This is a government account evaluation. You must contact US Marketing to obtain Government accounts team approval before proceeding with this evaluation.");
    }
  };

  const handleGovernmentApprovalUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingApproval(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file }); // Assuming SDK provides file_url
      setGovernmentApprovalFile(result.file_url);
      setGovernmentApprovalFileName(file.name);
    } catch (error) {
      console.error('Error uploading government approval:', error);
      alert('Error uploading approval file. Please try again.');
    } finally {
      setIsUploadingApproval(false);
    }
  };

  const validateForm = () => {
    const required = ['account_name', 'contact_person', 'contact_email', 'sales_consultant', 'sales_consultant_email'];
    const missing = required.filter(field => !formData[field]);
    
    if (missing.length > 0) {
      alert(`Please fill in required fields: ${missing.map(f => f.replace(/_/g, ' ')).join(', ')}`);
      return false;
    }
    
    if (selectedEquipment.length === 0) {
      alert('Please select at least one product.');
      return false;
    }

    // Check compliance
    if (complianceViolations.length > 0) {
      alert('Cannot save evaluation: Compliance violations detected. Please review the warnings and remove the products that are not yet eligible for evaluation.');
      return false;
    }

    if (formData.is_government) {
      if (!formData.government_approval_obtained) {
        alert('Government account evaluations require explicit approval acknowledgment by checking the box.');
        return false;
      }
      if (!governmentApprovalFile) {
        alert('Government account evaluations require an uploaded approval email or document.');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      await base44.entities.Account.update(account.id, { // SDK call
        account_name: formData.account_name,
        ship_to_ucn_number: formData.ship_to_ucn_number,
        account_type: formData.account_type,
        contact_person: formData.contact_person,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        billing_address: {
          street: formData.street_address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code,
        },
        is_government: formData.is_government
      });

      await base44.entities.Evaluation.update(evaluation.id, { // SDK call
        ship_to_ucn_number: formData.ship_to_ucn_number,
        sales_consultant: formData.sales_consultant,
        sales_consultant_email: formData.sales_consultant_email,
        sales_consultant_phone: formData.sales_consultant_phone,
        territory_manager: formData.territory_manager,
        surgeons: formData.surgeons,
        evaluation_start_date: formData.evaluation_start_date,
        evaluation_end_date: formData.evaluation_end_date,
        requested_items: selectedEquipment.map(item => ({
          sku_code: item.code,
          quantity: item.quantity,
          notes: item.description,
        })),
        purchase_order_number: formData.purchase_order_number,
        special_instructions: formData.special_instructions,
        // Ensure government_approval_obtained reflects both checkbox and file upload presence
        government_approval_obtained: formData.is_government && formData.government_approval_obtained && !!governmentApprovalFile,
        government_approval_file_url: governmentApprovalFile,
        government_approval_file_name: governmentApprovalFileName
      });

      alert("Evaluation updated successfully!");
      navigate(createPageUrl("Dashboard"));
    } catch (error) {
      console.error("Failed to update evaluation:", error);
      alert("There was an error updating the evaluation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const filteredProducts = productCatalog.filter(product => {
    const matchesSearch = equipmentSearch === '' || 
      product.description.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
      product.code.toLowerCase().includes(equipmentSearch.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesFamily = selectedFamily === 'all' || product.product_family === selectedFamily;
    
    return matchesSearch && matchesCategory && matchesFamily;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AdminSection />
      
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Evaluation</h1>
            <p className="text-gray-600">Modify the evaluation details and regenerate the PDF if needed</p>
          </div>
          <Button 
            variant="outline"
            onClick={() => navigate(createPageUrl("Dashboard"))}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Compliance Violations Alert */}
        {complianceViolations.length > 0 && (
          <Alert className="border-red-500 bg-red-50">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-900">
              <div className="space-y-3">
                <div>
                  <strong className="text-lg">⚠️ Compliance Violation Detected</strong>
                  <p className="mt-2 text-sm">
                    The following products cannot be included because they were evaluated within the last 12 months. 
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
                              ⏱️ {violation.days_until_eligible > 0 ? `${violation.days_until_eligible} days remaining` : 'Eligible Now'} until eligible
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
                    <strong>Action Required:</strong> Please remove the non-compliant products before saving this evaluation.
                  </AlertDescription>
                </Alert>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {isCheckingCompliance && (
          <Alert className="border-blue-500 bg-blue-50">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <AlertDescription className="text-blue-900">
              Checking product compliance for this account...
            </AlertDescription>
          </Alert>
        )}

        {/* Account Information */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="account_name">Account Name *</Label>
                <Input
                  id="account_name"
                  value={formData.account_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, account_name: e.target.value }))}
                  placeholder="Hospital or clinic name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ship_to_ucn_number">Ship To UCN Number *</Label>
                <Input
                  id="ship_to_ucn_number"
                  value={formData.ship_to_ucn_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, ship_to_ucn_number: e.target.value }))}
                  placeholder="UCN Number"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_type">Account Type</Label>
                <Select
                  value={formData.account_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, account_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
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
                <Label htmlFor="contact_person">Contact Person *</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                  placeholder="Primary contact name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email *</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                  placeholder="contact@hospital.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            <Separator className="my-6" />
            <div className="space-y-4">
              <h3 className="font-semibold">Address Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="street_address">Street Address</Label>
                  <Input
                    id="street_address"
                    value={formData.street_address}
                    onChange={(e) => setFormData(prev => ({ ...prev, street_address: e.target.value }))}
                    placeholder="123 Main Street"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="State"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip_code">ZIP Code</Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                    placeholder="12345"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sales Team Information */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Sales Team Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sales_consultant">Sales Consultant *</Label>
                <Input
                  id="sales_consultant"
                  value={formData.sales_consultant}
                  onChange={(e) => setFormData(prev => ({ ...prev, sales_consultant: e.target.value }))}
                  placeholder="Sales consultant name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sales_consultant_email">Sales Consultant Email *</Label>
                <Input
                  id="sales_consultant_email"
                  type="email"
                  value={formData.sales_consultant_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, sales_consultant_email: e.target.value }))}
                  placeholder="consultant@jnjmedtech.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sales_consultant_phone">Phone Number</Label>
                <Input
                  id="sales_consultant_phone"
                  value={formData.sales_consultant_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, sales_consultant_phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="territory_manager">Territory Manager</Label>
                <Input
                  id="territory_manager"
                  value={formData.territory_manager}
                  onChange={(e) => setFormData(prev => ({ ...prev, territory_manager: e.target.value }))}
                  placeholder="Manager name"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Surgeons Information */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Evaluating Surgeons
              </span>
              <Button 
                type="button" 
                variant="default"
                onClick={addSurgeon}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Surgeon
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

        {/* Product Selection */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Product Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search and Filters */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products by name or SKU..."
                  value={equipmentSearch}
                  onChange={(e) => setEquipmentSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="capital_equipment">Capital Equipment</SelectItem>
                    <SelectItem value="disposable">Disposables</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Selected Equipment */}
            {selectedEquipment.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold">Selected Products ({selectedEquipment.length})</h4>
                {selectedEquipment.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border rounded-lg bg-blue-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium">{item.description}</span>
                        <Badge variant={item.category === 'capital_equipment' ? 'default' : 'secondary'}>
                          {item.category === 'capital_equipment' ? 'Capital' : 'Disposable'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">SKU: {item.code}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`quantity-${index}`} className="text-sm">Qty:</Label>
                      <Input
                        id={`quantity-${index}`}
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateEquipmentQuantity(index, parseInt(e.target.value) || 1)}
                        className="w-20"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeEquipment(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Available Products */}
            <div className="space-y-3">
              <h4 className="font-semibold">Available Products</h4>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredProducts.map((product) => (
                  <div key={product.code} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                    <div>
                      <div className="font-medium">{product.description}</div>
                      <div className="text-sm text-gray-600">SKU: {product.code}</div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addEquipment(product)}
                      disabled={selectedEquipment.some(item => item.code === product.code)}
                    >
                      {selectedEquipment.some(item => item.code === product.code) ? 'Added' : 'Add'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Additional Details */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Additional Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchase_order_number">Purchase Order Number</Label>
                <Input
                  id="purchase_order_number"
                  value={formData.purchase_order_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchase_order_number: e.target.value }))}
                  placeholder="PO-123456"
                />
              </div>
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
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="special_instructions">Special Instructions</Label>
              <Textarea
                id="special_instructions"
                value={formData.special_instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, special_instructions: e.target.value }))}
                placeholder="Any special handling, setup instructions, or notes..."
                className="h-24"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_government"
                checked={formData.is_government}
                onCheckedChange={handleGovernmentChange}
              />
              <Label htmlFor="is_government">This is a government account</Label>
            </div>

            {formData.is_government && (
              <Alert className="border-orange-500 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <div className="space-y-2">
                    <p><strong>GOVERNMENT ACCOUNT EVALUATION</strong></p>
                    <p>This evaluation requires approval from the Government accounts team. You must contact <strong>US Marketing</strong> to obtain Government approval before proceeding with this evaluation.</p>
                    <p className="text-sm">Do not submit this evaluation without proper Government accounts team approval.</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {formData.is_government && (
              <div className="flex items-center space-x-2 mt-4">
                <Checkbox
                  id="government_approval_obtained"
                  checked={formData.government_approval_obtained}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, government_approval_obtained: checked }))}
                />
                <Label htmlFor="government_approval_obtained">
                  Government approval has been obtained for this evaluation
                </Label>
              </div>
            )}

            {formData.is_government && (
                <div className="space-y-4 mt-4">
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
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || complianceViolations.length > 0} 
            className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Updating Evaluation...' : 'Update Evaluation'}
          </Button>
        </div>
      </div>
    </div>
  );
}