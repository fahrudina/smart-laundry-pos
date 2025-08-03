import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ServiceTypeSelector, ServiceType } from './ServiceTypeSelector';
import { WeightInput } from './WeightInput';
import { UnitItemSelector } from './UnitItemSelector';
import { UnitItem } from '@/hooks/useOrdersOptimized';

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: string;
  durationValue: number;
  durationUnit: 'hours' | 'days';
  category: 'wash' | 'dry' | 'special' | 'ironing' | 'folding';
  supportsKilo?: boolean; // Whether this service supports kilo pricing
  kiloPrice?: number; // Price per kg if supports kilo
}

export interface EnhancedOrderItem {
  service: Service;
  serviceType: ServiceType;
  quantity: number;
  weight?: number;
  unitItems?: UnitItem[];
  totalPrice: number;
}

interface EnhancedServiceSelectorProps {
  service: Service;
  onItemChange: (item: EnhancedOrderItem | null) => void;
  disabled?: boolean;
}

export const EnhancedServiceSelector: React.FC<EnhancedServiceSelectorProps> = ({
  service,
  onItemChange,
  disabled = false,
}) => {
  const [serviceType, setServiceType] = useState<ServiceType>('unit');
  const [quantity, setQuantity] = useState<number>(1);
  const [weight, setWeight] = useState<number>(0);
  const [unitItems, setUnitItems] = useState<UnitItem[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Calculate total price based on service type
  const calculateTotalPrice = (): number => {
    switch (serviceType) {
      case 'unit':
        return quantity * service.price;
      case 'kilo':
        return weight * (service.kiloPrice || service.price);
      case 'combined':
        const kiloTotal = weight * (service.kiloPrice || service.price);
        const unitTotal = unitItems.reduce((sum, item) => 
          sum + (item.quantity || 0) * (item.price_per_unit || 0), 0
        );
        return kiloTotal + unitTotal;
      default:
        return 0;
    }
  };

  // Validate current form state
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    switch (serviceType) {
      case 'unit':
        if (quantity <= 0) {
          newErrors.quantity = 'Quantity must be greater than 0';
        }
        break;
      case 'kilo':
        if (weight <= 0) {
          newErrors.weight = 'Weight must be greater than 0';
        }
        if (!service.supportsKilo) {
          newErrors.service = 'This service does not support kilo pricing';
        }
        break;
      case 'combined':
        if (weight <= 0) {
          newErrors.weight = 'Weight must be greater than 0 for combined service';
        }
        if (unitItems.length === 0) {
          newErrors.unitItems = 'At least one unit item is required for combined service';
        } else {
          const hasInvalidItems = unitItems.some(item => 
            !item.item_name.trim() || item.quantity <= 0 || item.price_per_unit <= 0
          );
          if (hasInvalidItems) {
            newErrors.unitItems = 'All unit items must have valid name, quantity, and price';
          }
        }
        if (!service.supportsKilo) {
          newErrors.service = 'This service does not support kilo pricing for combined orders';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Update parent when values change
  useEffect(() => {
    if (validateForm()) {
      const totalPrice = calculateTotalPrice();
      const item: EnhancedOrderItem = {
        service,
        serviceType,
        quantity: serviceType === 'unit' ? quantity : 1,
        weight: (serviceType === 'kilo' || serviceType === 'combined') ? weight : undefined,
        unitItems: serviceType === 'combined' ? unitItems : undefined,
        totalPrice,
      };
      onItemChange(item);
    } else {
      onItemChange(null);
    }
  }, [service, serviceType, quantity, weight, unitItems]);

  const totalPrice = calculateTotalPrice();

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{service.name}</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">{service.category}</Badge>
            {service.supportsKilo && (
              <Badge variant="outline">Kilo Available</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Duration: {service.duration}</span>
          <div className="text-right">
            <div>Unit: ${service.price.toFixed(2)}</div>
            {service.supportsKilo && service.kiloPrice && (
              <div>Kilo: ${service.kiloPrice.toFixed(2)}/kg</div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ServiceTypeSelector
          value={serviceType}
          onChange={setServiceType}
          disabled={disabled}
        />

        {errors.service && (
          <p className="text-sm text-red-500">{errors.service}</p>
        )}

        {serviceType === 'unit' && (
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium mb-2">
              Quantity
            </label>
            <input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.quantity && (
              <p className="text-sm text-red-500 mt-1">{errors.quantity}</p>
            )}
          </div>
        )}

        {serviceType === 'kilo' && (
          <WeightInput
            value={weight}
            onChange={setWeight}
            disabled={disabled}
            error={errors.weight}
          />
        )}

        {serviceType === 'combined' && (
          <div className="space-y-4">
            <WeightInput
              value={weight}
              onChange={setWeight}
              disabled={disabled}
              error={errors.weight}
            />
            <UnitItemSelector
              items={unitItems}
              onChange={setUnitItems}
              disabled={disabled}
            />
            {errors.unitItems && (
              <p className="text-sm text-red-500">{errors.unitItems}</p>
            )}
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t">
          <span className="font-medium">Total Price:</span>
          <span className="font-semibold text-lg text-blue-600">
            ${totalPrice.toFixed(2)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
