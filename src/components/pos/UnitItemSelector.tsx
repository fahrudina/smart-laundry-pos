import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { UnitItem } from '@/hooks/useOrdersOptimized';

interface UnitItemSelectorProps {
  items: UnitItem[];
  onChange: (items: UnitItem[]) => void;
  disabled?: boolean;
}

interface UnitItemRowProps {
  item: UnitItem;
  index: number;
  onUpdate: (index: number, item: UnitItem) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

const UnitItemRow: React.FC<UnitItemRowProps> = ({
  item,
  index,
  onUpdate,
  onRemove,
  disabled = false,
}) => {
  const handleChange = (field: keyof UnitItem, value: string | number) => {
    onUpdate(index, { ...item, [field]: value });
  };

  return (
    <Card className="p-3">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <Label htmlFor={`item-name-${index}`} className="text-xs">
              Item Name
            </Label>
            <Input
              id={`item-name-${index}`}
              value={item.item_name}
              onChange={(e) => handleChange('item_name', e.target.value)}
              disabled={disabled}
              placeholder="e.g., Shirt"
              className="text-sm"
            />
          </div>
          <div>
            <Label htmlFor={`quantity-${index}`} className="text-xs">
              Quantity
            </Label>
            <Input
              id={`quantity-${index}`}
              type="number"
              min="1"
              value={item.quantity || ''}
              onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 1)}
              disabled={disabled}
              placeholder="1"
              className="text-sm"
            />
          </div>
          <div>
            <Label htmlFor={`price-${index}`} className="text-xs">
              Price per Unit
            </Label>
            <Input
              id={`price-${index}`}
              type="number"
              min="0"
              step="0.01"
              value={item.price_per_unit || ''}
              onChange={(e) => handleChange('price_per_unit', parseFloat(e.target.value) || 0)}
              disabled={disabled}
              placeholder="0.00"
              className="text-sm"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              ${((item.quantity || 0) * (item.price_per_unit || 0)).toFixed(2)}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onRemove(index)}
              disabled={disabled}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const UnitItemSelector: React.FC<UnitItemSelectorProps> = ({
  items,
  onChange,
  disabled = false,
}) => {
  const [errors, setErrors] = useState<string[]>([]);

  const addItem = () => {
    const newItem: UnitItem = {
      item_name: '',
      quantity: 1,
      price_per_unit: 0,
    };
    onChange([...items, newItem]);
  };

  const updateItem = (index: number, item: UnitItem) => {
    const updatedItems = [...items];
    updatedItems[index] = item;
    onChange(updatedItems);
    
    // Clear any errors for this item
    if (errors[index]) {
      const newErrors = [...errors];
      newErrors[index] = '';
      setErrors(newErrors);
    }
  };

  const removeItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    onChange(updatedItems);
    
    // Remove corresponding error
    const newErrors = errors.filter((_, i) => i !== index);
    setErrors(newErrors);
  };

  const validateItems = () => {
    const newErrors: string[] = [];
    items.forEach((item, index) => {
      if (!item.item_name.trim()) {
        newErrors[index] = 'Item name is required';
      } else if (item.quantity <= 0) {
        newErrors[index] = 'Quantity must be greater than 0';
      } else if (item.price_per_unit <= 0) {
        newErrors[index] = 'Price must be greater than 0';
      } else {
        newErrors[index] = '';
      }
    });
    setErrors(newErrors);
    return newErrors.every(error => !error);
  };

  const totalAmount = items.reduce((sum, item) => 
    sum + (item.quantity || 0) * (item.price_per_unit || 0), 0
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Unit Items</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addItem}
          disabled={disabled}
          className="h-8"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Item
        </Button>
      </div>
      
      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No items added yet</p>
          <p className="text-xs">Click "Add Item" to start adding unit items</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index}>
              <UnitItemRow
                item={item}
                index={index}
                onUpdate={updateItem}
                onRemove={removeItem}
                disabled={disabled}
              />
              {errors[index] && (
                <p className="text-sm text-red-500 mt-1">{errors[index]}</p>
              )}
            </div>
          ))}
          
          <div className="flex justify-between items-center pt-3 border-t">
            <span className="font-medium">Total Unit Items:</span>
            <span className="font-semibold text-lg">${totalAmount.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
