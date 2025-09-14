import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';

export interface DynamicOrderItemData {
  id: string;
  itemName: string;
  duration: string;
  durationValue: number;
  durationUnit: 'hours' | 'days';
  price: number;
  quantity: number;
  totalPrice: number;
}

interface DynamicOrderItemProps {
  onItemUpdate: (item: DynamicOrderItemData | null) => void;
  onRemove: () => void;
  initialData?: Partial<DynamicOrderItemData>;
  disabled?: boolean;
}

export const DynamicOrderItem: React.FC<DynamicOrderItemProps> = ({
  onItemUpdate,
  onRemove,
  initialData,
  disabled = false,
}) => {
  const [itemName, setItemName] = useState(initialData?.itemName || '');
  const [durationValue, setDurationValue] = useState(initialData?.durationValue || 1);
  const [durationUnit, setDurationUnit] = useState<'hours' | 'days'>(initialData?.durationUnit || 'hours');
  const [price, setPrice] = useState(initialData?.price || 0);
  const [quantity, setQuantity] = useState(initialData?.quantity || 1);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Calculate total price
  const totalPrice = price * quantity;

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!itemName.trim()) {
      newErrors.itemName = 'Item name is required';
    }

    if (durationValue <= 0) {
      newErrors.durationValue = 'Duration must be greater than 0';
    }

    if (price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [itemName, durationValue, price, quantity]);

  // Update parent component when form data changes
  useEffect(() => {
    if (validateForm()) {
      const item: DynamicOrderItemData = {
        id: initialData?.id || `dynamic-${Date.now()}`,
        itemName: itemName.trim(),
        duration: `${durationValue} ${durationUnit}`,
        durationValue,
        durationUnit,
        price,
        quantity,
        totalPrice,
      };
      onItemUpdate(item);
    } else {
      onItemUpdate(null);
    }
  }, [itemName, durationValue, durationUnit, price, quantity, totalPrice, validateForm, onItemUpdate, initialData?.id]);

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Custom Item</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={disabled}
            className="h-8 w-8 p-0 hover:bg-red-100"
          >
            <X className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Item Name */}
        <div className="space-y-2">
          <Label htmlFor="itemName">Item Name *</Label>
          <Input
            id="itemName"
            placeholder="e.g., Special Dry Clean, Express Wash"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            disabled={disabled}
            className={errors.itemName ? 'border-red-500' : ''}
          />
          {errors.itemName && (
            <p className="text-sm text-red-500">{errors.itemName}</p>
          )}
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <Label>Service Duration *</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="1"
              value={durationValue}
              onChange={(e) => setDurationValue(Number(e.target.value))}
              disabled={disabled}
              className={`flex-1 ${errors.durationValue ? 'border-red-500' : ''}`}
              min="1"
            />
            <Select
              value={durationUnit}
              onValueChange={(value: 'hours' | 'days') => setDurationUnit(value)}
              disabled={disabled}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hours">Hours</SelectItem>
                <SelectItem value="days">Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {errors.durationValue && (
            <p className="text-sm text-red-500">{errors.durationValue}</p>
          )}
        </div>

        {/* Price */}
        <div className="space-y-2">
          <Label htmlFor="price">Price per Unit *</Label>
          <Input
            id="price"
            type="number"
            placeholder="0"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            disabled={disabled}
            className={errors.price ? 'border-red-500' : ''}
            min="0"
            step="0.01"
          />
          {errors.price && (
            <p className="text-sm text-red-500">{errors.price}</p>
          )}
        </div>

        {/* Quantity */}
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity *</Label>
          <Input
            id="quantity"
            type="number"
            placeholder="1"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            disabled={disabled}
            className={errors.quantity ? 'border-red-500' : ''}
            min="1"
          />
          {errors.quantity && (
            <p className="text-sm text-red-500">{errors.quantity}</p>
          )}
        </div>

        {/* Total Price Display */}
        <div className="flex justify-between items-center pt-2 border-t">
          <span className="font-medium">Total Price:</span>
          <Badge variant="secondary" className="text-lg">
            Rp {totalPrice.toLocaleString('id-ID')}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

interface DynamicOrderItemsManagerProps {
  items: DynamicOrderItemData[];
  onItemsChange: (items: DynamicOrderItemData[]) => void;
  disabled?: boolean;
}

export const DynamicOrderItemsManager: React.FC<DynamicOrderItemsManagerProps> = ({
  items,
  onItemsChange,
  disabled = false,
}) => {
  const addNewItem = () => {
    // Add a placeholder that will be updated when the form is filled
    const newId = `dynamic-${Date.now()}`;
    onItemsChange([...items, {
      id: newId,
      itemName: '',
      duration: '1 hours',
      durationValue: 1,
      durationUnit: 'hours',
      price: 0,
      quantity: 1,
      totalPrice: 0,
    }]);
  };

  const updateItem = (index: number, item: DynamicOrderItemData | null) => {
    const updatedItems = [...items];
    if (item) {
      updatedItems[index] = item;
    } else {
      // If item is null, it means validation failed - keep the current item
      // but don't include it in calculations
    }
    onItemsChange(updatedItems);
  };

  const removeItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    onItemsChange(updatedItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Custom Items</h3>
        <Button
          onClick={addNewItem}
          disabled={disabled}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Custom Item
        </Button>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No custom items added. Click "Add Custom Item" to create a custom service.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <DynamicOrderItem
              key={item.id}
              initialData={item}
              onItemUpdate={(updatedItem) => updateItem(index, updatedItem)}
              onRemove={() => removeItem(index)}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
};