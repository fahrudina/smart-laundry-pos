import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePageTitle } from '@/hooks/usePageTitle';
import { 
  useDurationTypes, 
  useCreateDurationType, 
  useUpdateDurationType, 
  useDeleteDurationType,
  DurationTypeFormData 
} from '@/hooks/useDurationTypes';
import { Edit2, Trash2, Plus, Clock, Zap, Calendar } from 'lucide-react';

const initialFormData: DurationTypeFormData = {
  name: '',
  description: '',
  duration_value: 1,
  duration_unit: 'days',
  price_multiplier: 1.0,
};

export const DurationTypeManagement: React.FC = () => {
  usePageTitle('Duration Type Management');
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingDurationType, setEditingDurationType] = useState<any>(null);
  const [formData, setFormData] = useState<DurationTypeFormData>(initialFormData);

  // Use hooks to fetch and manage duration types
  const { data: durationTypes = [], isLoading: loading, error } = useDurationTypes();
  const createDurationTypeMutation = useCreateDurationType();
  const updateDurationTypeMutation = useUpdateDurationType();
  const deleteDurationTypeMutation = useDeleteDurationType();

  const isProcessing = createDurationTypeMutation.isPending || 
                      updateDurationTypeMutation.isPending || 
                      deleteDurationTypeMutation.isPending;

  // Create initial duration types for stores that don't have any
  const createStandardDurationTypes = async () => {
    const standardTypes = [
      {
        name: 'Express',
        description: '6 jam - Layanan cepat',
        duration_value: 6,
        duration_unit: 'hours' as const,
        price_multiplier: 1.5,
      },
      {
        name: 'Standard',
        description: '2 hari - Layanan normal',
        duration_value: 2,
        duration_unit: 'days' as const,
        price_multiplier: 1.0,
      },
      {
        name: 'Economy',
        description: '3 hari - Layanan hemat',
        duration_value: 3,
        duration_unit: 'days' as const,
        price_multiplier: 0.8,
      },
    ];

    try {
      for (const durationType of standardTypes) {
        await createDurationTypeMutation.mutateAsync(durationType);
      }
    } catch (error) {
      console.error('Error creating standard duration types:', error);
    }
  };

  const getDurationIcon = (durationType: any) => {
    if (durationType.name === 'Express') return <Zap className="h-4 w-4 text-orange-500" />;
    if (durationType.name === 'Economy') return <Calendar className="h-4 w-4 text-green-500" />;
    return <Clock className="h-4 w-4 text-blue-500" />;
  };

  const getPriceMultiplierColor = (multiplier: number) => {
    if (multiplier > 1) return 'bg-orange-100 text-orange-800';
    if (multiplier < 1) return 'bg-green-100 text-green-800';
    return 'bg-blue-100 text-blue-800';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      return;
    }

    if (formData.duration_value <= 0) {
      return;
    }

    if (formData.price_multiplier <= 0) {
      return;
    }

    try {
      if (editingDurationType) {
        // Update existing duration type
        await updateDurationTypeMutation.mutateAsync({
          id: editingDurationType.id,
          ...formData,
        });
      } else {
        // Create new duration type
        await createDurationTypeMutation.mutateAsync(formData);
      }

      // Reset form and close dialog
      setFormData(initialFormData);
      setEditingDurationType(null);
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Error saving duration type:', error);
    }
  };

  const handleEdit = (durationType: any) => {
    setEditingDurationType(durationType);
    setFormData({
      name: durationType.name,
      description: durationType.description,
      duration_value: durationType.duration_value,
      duration_unit: durationType.duration_unit,
      price_multiplier: durationType.price_multiplier,
    });
    setShowCreateDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this duration type?')) {
      try {
        await deleteDurationTypeMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting duration type:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingDurationType(null);
    setShowCreateDialog(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Error loading duration types: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Duration Type Management</h1>
          <p className="text-muted-foreground">Manage service duration options and pricing multipliers</p>
        </div>
        <div className="space-x-2">
          {durationTypes.length === 0 && (
            <Button 
              variant="outline"
              onClick={createStandardDurationTypes}
              disabled={isProcessing}
            >
              Create Standard Types
            </Button>
          )}
          <Button onClick={() => setShowCreateDialog(true)} disabled={isProcessing}>
            <Plus className="h-4 w-4 mr-2" />
            Add Duration Type
          </Button>
        </div>
      </div>

      {/* Duration Types Grid */}
      {durationTypes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Clock className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Duration Types Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create duration types to offer different service speeds with flexible pricing
            </p>
            <Button onClick={createStandardDurationTypes} disabled={isProcessing}>
              Create Standard Duration Types
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {durationTypes.map((durationType) => (
            <Card key={durationType.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getDurationIcon(durationType)}
                    <CardTitle className="text-lg">{durationType.name}</CardTitle>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={getPriceMultiplierColor(durationType.price_multiplier)}
                  >
                    {durationType.price_multiplier > 1 ? '+' : ''}
                    {((durationType.price_multiplier - 1) * 100).toFixed(0)}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{durationType.description}</p>
                
                {/* Duration */}
                <div className="flex justify-between text-sm">
                  <span>Duration:</span>
                  <span className="font-semibold">
                    {durationType.duration_value} {durationType.duration_unit}
                  </span>
                </div>

                {/* Price Multiplier */}
                <div className="flex justify-between text-sm">
                  <span>Price Multiplier:</span>
                  <span className="font-semibold">{durationType.price_multiplier}x</span>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(durationType)}
                    className="flex-1"
                    disabled={isProcessing}
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(durationType.id)}
                    className="flex-1 text-red-600 hover:text-red-700"
                    disabled={isProcessing}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDurationType ? 'Edit Duration Type' : 'Create Duration Type'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Express, Standard, Economy"
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., 6 jam - Layanan cepat"
              />
            </div>

            {/* Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration_value">Duration</Label>
                <Input
                  id="duration_value"
                  type="number"
                  min="1"
                  value={formData.duration_value}
                  onChange={(e) => setFormData({ ...formData, duration_value: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="duration_unit">Unit</Label>
                <Select 
                  value={formData.duration_unit} 
                  onValueChange={(value: any) => setFormData({ ...formData, duration_unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price Multiplier */}
            <div>
              <Label htmlFor="price_multiplier">Price Multiplier</Label>
              <Input
                id="price_multiplier"
                type="number"
                step="0.1"
                min="0.1"
                max="5.0"
                value={formData.price_multiplier}
                onChange={(e) => setFormData({ ...formData, price_multiplier: parseFloat(e.target.value) || 1.0 })}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                1.0 = normal price, 1.5 = 50% more, 0.8 = 20% less
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={isProcessing} className="flex-1">
                {editingDurationType ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
