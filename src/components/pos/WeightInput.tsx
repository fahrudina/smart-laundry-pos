import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface WeightInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  error?: string;
}

export const WeightInput: React.FC<WeightInputProps> = ({
  value,
  onChange,
  disabled = false,
  error,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseFloat(e.target.value) || 0;
    onChange(numValue);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="weight" className="text-sm font-medium">
        Weight (kg)
      </Label>
      <div className="relative">
        <Input
          id="weight"
          type="number"
          min="0"
          step="0.1"
          value={value || ''}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Enter weight in kg"
          className={error ? 'border-red-500' : ''}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <span className="text-gray-500 text-sm">kg</span>
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};
