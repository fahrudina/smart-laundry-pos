import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type UnitType = 'unit' | 'kilo';

const STEP: Record<UnitType, number> = { unit: 1, kilo: 0.1 };
const FIRST_STEP: Record<UnitType, number> = { unit: 1, kilo: 1 };

const roundKilo = (value: number) => Math.round(value * 10) / 10;

export const getIncrementedValue = (value: number, unitType: UnitType) => {
  const next = value <= 0 ? FIRST_STEP[unitType] : value + STEP[unitType];
  return unitType === 'kilo' ? roundKilo(next) : next;
};

const getDecrementedValue = (value: number, unitType: UnitType) => {
  const next = Math.max(0, value - STEP[unitType]);
  return unitType === 'kilo' ? roundKilo(next) : next;
};

interface QuantityStepperProps {
  value: number;
  unitType: UnitType;
  disabled?: boolean;
  onChange: (newValue: number) => void;
  className?: string;
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  value,
  unitType,
  disabled = false,
  onChange,
  className = '',
}) => {
  const handleTyped = (raw: string) => {
    if (raw.trim() === '') {
      onChange(0);
      return;
    }
    const parsed = unitType === 'kilo' ? parseFloat(raw) : parseInt(raw, 10);
    if (isNaN(parsed)) return;
    const clamped = Math.max(0, parsed);
    onChange(unitType === 'kilo' ? roundKilo(clamped) : clamped);
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange(getDecrementedValue(value, unitType))}
        disabled={disabled || value <= 0}
        className="h-8 w-8 flex-shrink-0 p-0 sm:h-9 sm:w-9"
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <Input
        type="number"
        inputMode={unitType === 'kilo' ? 'decimal' : 'numeric'}
        step={unitType === 'kilo' ? '0.1' : '1'}
        min="0"
        placeholder="0"
        value={value === 0 ? '' : value}
        onChange={(e) => handleTyped(e.target.value)}
        disabled={disabled}
        className="h-8 w-12 flex-shrink-0 [appearance:textfield] text-center text-xs [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none sm:h-9 sm:w-14 sm:text-sm"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange(getIncrementedValue(value, unitType))}
        disabled={disabled || value <= 0}
        className="h-8 w-8 flex-shrink-0 p-0 sm:h-9 sm:w-9"
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

interface AddToCartButtonProps {
  value: number;
  unitType: UnitType;
  disabled?: boolean;
  onChange: (newValue: number) => void;
  className?: string;
}

export const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  value,
  unitType,
  disabled = false,
  onChange,
  className = '',
}) => (
  <Button
    type="button"
    variant="pos"
    size="sm"
    onClick={() => onChange(FIRST_STEP[unitType])}
    disabled={disabled || value > 0}
    className={`h-8 flex-shrink-0 gap-1 px-3 text-xs sm:h-9 sm:text-sm ${className}`}
  >
    <Plus className="h-3.5 w-3.5" />
    Tambah
  </Button>
);
