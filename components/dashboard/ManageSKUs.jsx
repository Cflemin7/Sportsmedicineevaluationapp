import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, Plus, Trash2, Edit, X, Search, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ManageSKUs() {
  const [skus, setSkus] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    sku_code: '',
    product_name: '',
    category: 'capital_equipment',
    subcategory: '',
    description: '',
    unit_price: 0,
    reprocessable: false,
    requires_training: false,
    availability_status: 'available',
    product_family: ''
  });

  useEffect(() => {
    loadSKUs();
  }, []);

  const loadSKUs = async () => {
    try {
      const dbProducts = await base44.entities.SKU.list('-created_date', 500);
      setSkus(dbProducts);
    } catch (error) {
      console.error('Error loading SKUs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      sku_code: '',
      product_name: '',
      category: 'capital_equipment',
      subcategory: '',
      description: '',
      unit_price: 0,
      reprocessable: false,
      requires_training: false,
      availability_status: 'available',
      product_family: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (sku) => {
    setFormData({
      sku_code: sku.sku_code || '',
      product_name: sku.product_name || '',
      category: sku.category || 'capital_equipment',
      subcategory: sku.subcategory || '',
      description: sku.description || '',
      unit_price: sku.unit_price || 0,
      reprocessable: sku.reprocessable || false,
      requires_training: sku.requires_training || false,
      availability_status: sku.availability_status || 'available',
      product_family: sku.product_family || ''
    });
    setEditingId(sku.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.sku_code || !formData.product_name || !formData.category) {
      alert('Please fill in SKU Code, Product Name, and Category');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await base44.entities.SKU.update(editingId, formData);
      } else {
        await base44.entities.SKU.create(formData);
      }
      await loadSKUs();
      resetForm();
    } catch (error) {
      console.error('Error saving SKU:', error);
      alert('Error saving SKU. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this SKU? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(id);
    try {
      await base44.entities.SKU.delete(id);
      await loadSKUs();
    } catch (error) {
      if (error.message && error.message.includes('not found')) {
        await loadSKUs();
      } else {
        console.error('Error deleting SKU:', error);
        alert('Error deleting SKU. Please try again.');
      }
    } finally {
      setIsDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    const selectedSkus = Array.from(selectedIds);
    
    if (selectedSkus.length === 0) {
      alert('Please select SKUs to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedSkus.length} SKU(s)? This action cannot be undone.`)) {
      return;
    }

    setIsBulkDeleting(true);
    try {
      await Promise.all(
        selectedSkus.map(id => 
          base44.entities.SKU.delete(id).catch(err => {
            if (!err.message?.includes('not found')) {
              console.error(`Error deleting SKU ${id}:`, err);
            }
          })
        )
      );
      
      setSelectedIds(new Set());
      await loadSKUs();
      alert(`Successfully deleted ${selectedSkus.length} SKU(s)`);
    } catch (error) {
      console.error('Error bulk deleting SKUs:', error);
      alert('Error deleting some SKUs. Please try again.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const selectableIds = filteredSKUs.map(sku => sku.id);
      setSelectedIds(new Set(selectableIds));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id, checked) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const filteredSKUs = skus.filter(sku => {
    const matchesSearch = searchTerm === '' || 
      sku.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sku.sku_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sku.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || sku.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const allSelected = filteredSKUs.length > 0 && selectedIds.size === filteredSKUs.length;

  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-32">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Manage Product SKUs
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Add, edit, or remove products from the catalog
              </p>
            </div>
            <Button onClick={() => setShowForm(!showForm)} className="w-full sm:w-auto">
              {showForm ? (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add New SKU
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {showForm && (
        <Card className="shadow-md border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? 'Edit SKU' : 'Add New SKU'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku_code">SKU Code *</Label>
                  <Input
                    id="sku_code"
                    value={formData.sku_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku_code: e.target.value }))}
                    placeholder="e.g., 225028"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product_name">Product Name *</Label>
                  <Input
                    id="product_name"
                    value={formData.product_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, product_name: e.target.value }))}
                    placeholder="Product display name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="capital_equipment">Capital Equipment</SelectItem>
                      <SelectItem value="disposable">Disposable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Input
                    id="subcategory"
                    value={formData.subcategory}
                    onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                    placeholder="e.g., electrodes, blades"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product_family">Product Family</Label>
                  <Input
                    id="product_family"
                    value={formData.product_family}
                    onChange={(e) => setFormData(prev => ({ ...prev, product_family: e.target.value }))}
                    placeholder="e.g., VAPR, FMS"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="availability_status">Availability Status</Label>
                  <Select
                    value={formData.availability_status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, availability_status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="limited">Limited</SelectItem>
                      <SelectItem value="discontinued">Discontinued</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit_price">Unit Price (USD)</Label>
                  <Input
                    id="unit_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unit_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed product description"
                    className="h-20"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reprocessable"
                    checked={formData.reprocessable}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, reprocessable: checked }))}
                  />
                  <Label htmlFor="reprocessable" className="cursor-pointer">Reprocessable</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requires_training"
                    checked={formData.requires_training}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_training: checked }))}
                  />
                  <Label htmlFor="requires_training" className="cursor-pointer">Requires Training</Label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingId ? 'Update SKU' : 'Create SKU'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-md">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search SKUs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="capital_equipment">Capital Equipment</SelectItem>
                <SelectItem value="disposable">Disposables</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm font-medium text-blue-900">
                {selectedIds.size} SKU(s) selected
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
              >
                {isBulkDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </>
                )}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {filteredSKUs.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No SKUs found</p>
              <p className="text-sm text-gray-500 mt-1">
                {searchTerm || categoryFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Add your first SKU to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={handleSelectAll}
                        disabled={filteredSKUs.length === 0}
                      />
                    </TableHead>
                    <TableHead>SKU Code</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Family</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSKUs.map((sku) => (
                    <TableRow key={sku.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(sku.id)}
                          onCheckedChange={(checked) => handleSelectOne(sku.id, checked)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {sku.sku_code}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{sku.product_name}</div>
                          {sku.description && (
                            <div className="text-sm text-gray-600 truncate max-w-xs">
                              {sku.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={sku.category === 'capital_equipment' ? 'default' : 'secondary'}>
                          {sku.category === 'capital_equipment' ? 'Capital' : 'Disposable'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sku.product_family && (
                          <Badge variant="outline">{sku.product_family}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          sku.availability_status === 'available' ? 'default' :
                          sku.availability_status === 'limited' ? 'secondary' : 'destructive'
                        }>
                          {sku.availability_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(sku)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(sku.id)}
                            className="text-red-600 hover:text-red-700"
                            disabled={isDeleting === sku.id}
                          >
                            {isDeleting === sku.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Note:</strong> Changes to the SKU catalog will automatically be reflected in the New Evaluation form and Product Catalog page.
        </AlertDescription>
      </Alert>
    </div>
  );
}