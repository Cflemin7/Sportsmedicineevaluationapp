import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck } from "lucide-react";

export default function ShippingSection({ formData, setFormData }) {
  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <Truck className="w-5 h-5" />
          Shipping Information
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ship_to_name">Ship To Name</Label>
            <Input
              id="ship_to_name"
              value={formData.ship_to_name}
              onChange={(e) => setFormData(prev => ({ ...prev, ship_to_name: e.target.value }))}
              placeholder="Hospital or facility name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ship_to_attention">Attention</Label>
            <Input
              id="ship_to_attention"
              value={formData.ship_to_attention}
              onChange={(e) => setFormData(prev => ({ ...prev, ship_to_attention: e.target.value }))}
              placeholder="Department or contact person"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="ship_to_address">Street Address</Label>
            <Input
              id="ship_to_address"
              value={formData.ship_to_address}
              onChange={(e) => setFormData(prev => ({ ...prev, ship_to_address: e.target.value }))}
              placeholder="123 Main Street"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ship_to_city">City</Label>
            <Input
              id="ship_to_city"
              value={formData.ship_to_city}
              onChange={(e) => setFormData(prev => ({ ...prev, ship_to_city: e.target.value }))}
              placeholder="City"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ship_to_state">State</Label>
            <Input
              id="ship_to_state"
              value={formData.ship_to_state}
              onChange={(e) => setFormData(prev => ({ ...prev, ship_to_state: e.target.value }))}
              placeholder="State"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ship_to_zip">ZIP Code</Label>
            <Input
              id="ship_to_zip"
              value={formData.ship_to_zip}
              onChange={(e) => setFormData(prev => ({ ...prev, ship_to_zip: e.target.value }))}
              placeholder="12345"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ship_to_country">Country</Label>
            <Input
              id="ship_to_country"
              value={formData.ship_to_country}
              onChange={(e) => setFormData(prev => ({ ...prev, ship_to_country: e.target.value }))}
              placeholder="USA"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ship_to_phone">Phone</Label>
            <Input
              id="ship_to_phone"
              value={formData.ship_to_phone}
              onChange={(e) => setFormData(prev => ({ ...prev, ship_to_phone: e.target.value }))}
              placeholder="(555) 123-4567"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}