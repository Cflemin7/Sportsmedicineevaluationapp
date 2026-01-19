import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, Trash2, Search, Loader2, AlertTriangle, Info } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ProductsSection({ formData, setFormData, allProducts, isLoadingProducts }) {
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Calculate disposables per surgeon per anatomy per SKU
  const complianceCheck = useMemo(() => {
    const disposables = formData.products.filter(p => p.category === 'disposable');
    const anatomyCount = formData.surgeons?.reduce((sum, s) => sum + (s.anatomy_focuses?.length || 0), 0) || 0;
    
    const results = [];
    let hasViolations = false;

    // Check each SKU against the total anatomy count limit
    disposables.forEach(item => {
      const maxAllowed = anatomyCount * 10;
      const isOver = anatomyCount > 0 && item.quantity > maxAllowed;
      
      if (isOver) hasViolations = true;
      
      results.push({
        sku: item.sku_code,
        product_name: item.product_name,
        count: item.quantity,
        limit: maxAllowed,
        isOver
      });
    });

    return { results, hasViolations, totalDisposables: disposables.reduce((sum, item) => sum + (item.quantity || 0), 0) };
  }, [formData.products, formData.surgeons]);

  const addProduct = (product) => {
    const existingProduct = formData.products.find(p => p.sku_code === product.sku_code);
    
    // Check if adding this product would violate compliance (10 per SKU per surgeon per anatomy)
    if (product.category === 'disposable') {
      const newQty = existingProduct ? existingProduct.quantity + 1 : 1;
      const anatomyCount = formData.surgeons?.reduce((sum, s) => sum + (s.anatomy_focuses?.length || 0), 0) || 0;
      const maxAllowed = anatomyCount * 10;
      
      if (anatomyCount > 0 && newQty > maxAllowed) {
        alert(`⚠️ COMPLIANCE WARNING\n\nThis SKU would exceed the maximum allowed.\n\nSKU: ${product.sku_code}\nCurrent: ${existingProduct?.quantity || 0} units\nLimit: ${maxAllowed} units (${anatomyCount} anatomy areas × 10 units per area)`);
        return;
      }
    }
    
    if (existingProduct) {
      setFormData(prev => ({
        ...prev,
        products: prev.products.map(p => 
          p.sku_code === product.sku_code 
            ? { ...p, quantity: p.quantity + 1 }
            : p
        )
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        products: [...prev.products, {
          sku_code: product.sku_code,
          product_name: product.product_name,
          category: product.category,
          product_family: product.product_family,
          reprocessable: product.reprocessable,
          quantity: 1
        }]
      }));
    }
    setShowProductSearch(false);
    setSearchTerm('');
  };

  const removeProduct = (index) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  const updateQuantity = (index, quantity) => {
    const product = formData.products[index];
    const newQty = Math.max(1, parseInt(quantity) || 1);
    
    // Check compliance for disposables (10 per SKU per surgeon per anatomy)
    if (product.category === 'disposable') {
      const anatomyCount = formData.surgeons?.reduce((sum, s) => sum + (s.anatomy_focuses?.length || 0), 0) || 0;
      const maxAllowed = anatomyCount * 10;
      
      if (anatomyCount > 0 && newQty > maxAllowed) {
        alert(`⚠️ COMPLIANCE WARNING\n\nThis quantity exceeds the limit.\n\nSKU: ${product.sku_code}\nRequested: ${newQty} units\nLimit: ${maxAllowed} units (${anatomyCount} anatomy areas × 10 units per area)\n\nPlease adjust the quantity.`);
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      products: prev.products.map((p, i) => 
        i === index ? { ...p, quantity: newQty } : p
      )
    }));
  };

  const filteredProducts = allProducts.filter(product => {
    const matchesSearch = searchTerm === '' || 
      product.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku_code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const surgeonCount = formData.surgeons?.filter(s => s.name && s.anatomy_focuses?.length > 0).length || 0;
  const anatomyCount = formData.surgeons?.reduce((sum, s) => sum + (s.anatomy_focuses?.length || 0), 0) || 0;

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Product Selection
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* Compliance Alert */}
        {complianceCheck.totalDisposables > 0 && (
          <Alert className={complianceCheck.hasViolations ? "border-red-500 bg-red-50" : "border-blue-500 bg-blue-50"}>
            {complianceCheck.hasViolations ? (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            ) : (
              <Info className="h-4 w-4 text-blue-600" />
            )}
            <AlertDescription className={complianceCheck.hasViolations ? "text-red-800" : "text-blue-800"}>
              <div className="space-y-1">
                <p className="font-semibold">
                  {complianceCheck.hasViolations ? '⚠️ COMPLIANCE VIOLATION' : 'ℹ️ Disposables Compliance'}
                </p>
                <p className="text-sm">
                  Total Disposables: <strong>{complianceCheck.totalDisposables} units</strong>
                </p>
                <p className="text-xs">
                  <strong>Rule:</strong> Maximum 10 units per SKU per surgeon per anatomy
                </p>
                {anatomyCount === 0 && (
                  <p className="text-xs mt-1">
                    ⚠️ Please add surgeons and anatomy focuses first
                  </p>
                )}
                {complianceCheck.hasViolations && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-semibold">SKUs exceeding limit:</p>
                    {complianceCheck.results.filter(r => r.isOver).map((violation, idx) => (
                      <p key={idx} className="text-xs pl-2">
                        • {violation.product_name} ({violation.sku}): {violation.count} units (max 10)
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Selected Products */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Selected Products ({formData.products.length})</h3>
            <Button 
              type="button"
              onClick={() => setShowProductSearch(!showProductSearch)}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              {showProductSearch ? 'Hide Products' : 'Add Products'}
            </Button>
          </div>

          {formData.products.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No products selected yet</p>
              <p className="text-sm mt-1">Click "Add Products" to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {formData.products.map((product, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-white">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{product.product_name}</span>
                      <Badge variant={product.category === 'capital_equipment' ? 'default' : 'secondary'}>
                        {product.category === 'capital_equipment' ? 'Capital' : 'Disposable'}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600">SKU: {product.sku_code}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`qty-${index}`} className="text-xs">Qty:</Label>
                    <Input
                      id={`qty-${index}`}
                      type="number"
                      min="1"
                      value={product.quantity}
                      onChange={(e) => updateQuantity(index, e.target.value)}
                      className="w-16 h-8"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProduct(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Search */}
        {showProductSearch && (
          <div className="border-t pt-4 space-y-4">
            <h3 className="font-semibold">Available Products</h3>
            
            {isLoadingProducts ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="capital_equipment">Capital Equipment</SelectItem>
                      <SelectItem value="disposable">Disposables</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No products found
                    </div>
                  ) : (
                    filteredProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{product.product_name}</span>
                            <Badge variant={product.category === 'capital_equipment' ? 'default' : 'secondary'} className="text-xs">
                              {product.category === 'capital_equipment' ? 'Capital' : 'Disposable'}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-600">
                            SKU: {product.sku_code}
                            {product.product_family && ` • ${product.product_family}`}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addProduct(product)}
                        >
                          Add
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}