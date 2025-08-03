import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export type ServiceType = 'unit' | 'kilo' | 'combined';

interface ServiceTypeSelectorProps {
  value: ServiceType;
  onChange: (value: ServiceType) => void;
  disabled?: boolean;
}

export const ServiceTypeSelector: React.FC<ServiceTypeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Service Type</Label>
      <RadioGroup
        value={value}
        onValueChange={(value) => onChange(value as ServiceType)}
        disabled={disabled}
        className="grid grid-cols-1 gap-3"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="unit" id="unit" />
          <Label htmlFor="unit" className="text-sm">
            By Unit - Select specific items with quantities
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="kilo" id="kilo" />
          <Label htmlFor="kilo" className="text-sm">
            By Kilo - Specify weight in kilograms
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="combined" id="combined" />
          <Label htmlFor="combined" className="text-sm">
            Combined - Both weight and specific items
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};
