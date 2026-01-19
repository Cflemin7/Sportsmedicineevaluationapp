import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Package, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function SKUSearchModal({ open, onClose, skus, onSelectSKU }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [productFamilyFilter, setProductFamilyFilter] = useState('all');

  const filteredSKUs = skus.filter(sku => {
    const matchesSearch = searchTerm === '' || 
      sku.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sku.sku_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sku.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || sku.category === categoryFilter;
    
    const matchesFamily = productFamilyFilter === 'all' || sku.product_family === productFamilyFilter;
    
    return matchesSearch && matchesCategory && matchesFamily;
  });

  const productFamilies = [...new Set(skus.map(sku => sku.product_family).filter(Boolean))];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Product Catalog - 208+ SKUs Available
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by product name, SKU, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="capital_equipment">Capital Equipment</SelectItem>
                <SelectItem value="disposable">Disposables</SelectItem>
              </SelectContent>
            </Select>
            <Select value={productFamilyFilter} onValueChange={setProductFamilyFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Families" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Families</SelectItem>
                {productFamilies.map(family => (
                  <SelectItem key={family} value={family}>{family}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results */}
          <ScrollArea className="h-96 border rounded-md">
            <div className="p-4 space-y-3">
              {filteredSKUs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No products found matching your criteria</p>
                </div>
              ) : (
                filteredSKUs.map((sku) => (
                  <div key={sku.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{sku.product_name}</h4>
                        <Badge variant={sku.category === 'capital_equipment' ? 'default' : 'secondary'}>
                          {sku.category === 'capital_equipment' ? 'Capital' : 'Disposable'}
                        </Badge>
                        {!sku.reprocessable && (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            Non-reprocessed
                          </Badge>
                        )}
                        {sku.product_family && (
                          <Badge variant="outline">
                            {sku.product_family}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">SKU: {sku.sku_code}</p>
                      {sku.description && (
                        <p className="text-sm text-gray-500">{sku.description}</p>
                      )}
                      {sku.unit_price && (
                        <p className="text-sm font-medium text-green-600 mt-1">
                          ${sku.unit_price.toFixed(2)}
                        </p>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => onSelectSKU(sku)}
                      size="sm"
                      className="ml-4 bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}