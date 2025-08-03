import React, { useState } from 'react';
import { Plus, Edit2, Trash2, DollarSign, Settings, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useServices, useCreateService, useUpdateService, useDeleteService, ServiceFormData as ServiceFormType } from '@/hooks/useServices';

interface ServiceFormData {
  name: string;
  description: string;
  category: 'wash' | 'dry' | 'special' | 'ironing' | 'folding';
  unit_price: number;
  kilo_price: number;
  supports_unit: boolean;
  supports_kilo: boolean;
  duration_value: number;
  duration_unit: 'hours' | 'days';
}

const initialFormData: ServiceFormData = {
  name: '',
  description: '',
  category: 'wash',
  unit_price: 0,
  kilo_price: 0,
  supports_unit: true,
  supports_kilo: false,
  duration_value: 1,
  duration_unit: 'days',
};

const ServiceManagement = () => {
  usePageTitle('Service Management');
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [formData, setFormData] = useState<ServiceFormData>(initialFormData);
  const { toast } = useToast();

  // Use hooks to fetch and manage services
  const { data: services = [], isLoading: loading, error } = useServices();
  const createServiceMutation = useCreateService();
  const updateServiceMutation = useUpdateService();
  const deleteServiceMutation = useDeleteService();

  const isProcessing = createServiceMutation.isPending || updateServiceMutation.isPending || deleteServiceMutation.isPending;

  // Function to seed initial services
  const seedInitialServices = async () => {
    const initialServices = [
      {
        name: 'Cuci Setrika Regular',
        description: 'Cuci - Pengeringan - Setrika - Packing',
        category: 'wash' as const,
        unit_price: 18000,
        kilo_price: 6000,
        supports_unit: true,
        supports_kilo: true,
        duration_value: 2,
        duration_unit: 'days' as const,
      },
      {
        name: 'Express Wash',
        description: 'Pencucian cepat dalam 24 jam',
        category: 'wash' as const,
        unit_price: 25000,
        kilo_price: 8000,
        supports_unit: true,
        supports_kilo: true,
        duration_value: 1,
        duration_unit: 'days' as const,
      },
      {
        name: 'Setrika Saja',
        description: 'Layanan setrika dan pressing saja',
        category: 'ironing' as const,
        unit_price: 5000,
        kilo_price: 3000,
        supports_unit: true,
        supports_kilo: true,
        duration_value: 4,
        duration_unit: 'hours' as const,
      },
    ];

    try {
      for (const service of initialServices) {
        await createServiceMutation.mutateAsync(service);
      }
      toast({
        title: "Success",
        description: "Initial services created successfully",
      });
    } catch (error) {
      console.error('Error seeding services:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'wash': return 'bg-blue-100 text-blue-800';
      case 'dry': return 'bg-green-100 text-green-800';
      case 'special': return 'bg-purple-100 text-purple-800';
      case 'ironing': return 'bg-orange-100 text-orange-800';
      case 'folding': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Service name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.supports_unit && !formData.supports_kilo) {
      toast({
        title: "Error",
        description: "Service must support at least one pricing method",
        variant: "destructive",
      });
      return;
    }

    if (formData.supports_unit && formData.unit_price <= 0) {
      toast({
        title: "Error",
        description: "Unit price must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (formData.supports_kilo && formData.kilo_price <= 0) {
      toast({
        title: "Error",
        description: "Kilo price must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingService) {
        // Update existing service
        await updateServiceMutation.mutateAsync({
          id: editingService.id,
          data: formData
        });
      } else {
        // Create new service
        await createServiceMutation.mutateAsync(formData);
      }

      setFormData(initialFormData);
      setEditingService(null);
      setShowCreateDialog(false);
    } catch (error) {
      // Error handling is done in the mutation hooks
      console.error('Error saving service:', error);
    }
  };

  const handleEdit = (service: any) => {
    setFormData({
      name: service.name,
      description: service.description || '',
      category: service.category,
      unit_price: service.unit_price || 0,
      kilo_price: service.kilo_price || 0,
      supports_unit: service.supports_unit,
      supports_kilo: service.supports_kilo,
      duration_value: service.duration_value,
      duration_unit: service.duration_unit,
    });
    setEditingService(service);
    setShowCreateDialog(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) {
      return;
    }

    try {
      await deleteServiceMutation.mutateAsync(serviceId);
    } catch (error) {
      // Error handling is done in the mutation hook
      console.error('Error deleting service:', error);
    }
  };

  const openCreateDialog = () => {
    setFormData(initialFormData);
    setEditingService(null);
    setShowCreateDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Service Management</h1>
          <p className="text-muted-foreground">Manage your laundry services and pricing</p>
        </div>
        <Button 
          onClick={openCreateDialog} 
          className="flex items-center space-x-2"
          disabled={isProcessing}
        >
          <Plus className="h-4 w-4" />
          <span>Add Service</span>
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Loading services...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-medium text-red-800">Error loading services</h3>
                <p className="text-sm text-red-600">
                  Please try refreshing the page or contact support if the problem persists.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services Grid */}
      {!loading && !error && (
        <>
          {services.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No services found</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by creating your first laundry service or load some sample services.
                </p>
                <div className="flex justify-center gap-2">
                  <Button onClick={openCreateDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Service
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={seedInitialServices}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Loading...' : 'Load Sample Services'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card key={service.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{service.name}</CardTitle>
                <Badge className={getCategoryColor(service.category)}>
                  {service.category}
                </Badge>
              </div>
              {service.description && (
                <p className="text-sm text-muted-foreground">{service.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pricing Information */}
              <div className="space-y-2">
                <h4 className="font-medium flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Pricing Options
                </h4>
                {service.supports_unit && (
                  <div className="flex justify-between text-sm">
                    <span>Per Unit:</span>
                    <span className="font-semibold">Rp{service.unit_price?.toLocaleString('id-ID') || '0'}</span>
                  </div>
                )}
                {service.supports_kilo && (
                  <div className="flex justify-between text-sm">
                    <span>Per Kg:</span>
                    <span className="font-semibold">Rp{service.kilo_price?.toLocaleString('id-ID') || '0'}</span>
                  </div>
                )}
              </div>

              {/* Duration */}
              <div className="flex justify-between text-sm">
                <span>Duration:</span>
                <span>{service.duration_value} {service.duration_unit}</span>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(service)}
                  className="flex-1"
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(service.id)}
                  className="flex-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {services.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No services yet</h3>
            <p className="text-muted-foreground mb-4">Create your first service to get started</p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </div>
        )}
            </div>
          )}
        </>
      )}

      {/* Create/Edit Service Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingService ? 'Edit Service' : 'Create New Service'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Service Name*</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Regular Wash"
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Category*</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wash">Wash</SelectItem>
                    <SelectItem value="dry">Dry Clean</SelectItem>
                    <SelectItem value="ironing">Ironing</SelectItem>
                    <SelectItem value="folding">Folding</SelectItem>
                    <SelectItem value="special">Special</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the service"
                rows={3}
              />
            </div>

            {/* Pricing Options */}
            <div className="space-y-4">
              <h3 className="font-medium">Pricing Options</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="supports_unit"
                    checked={formData.supports_unit}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, supports_unit: checked as boolean })
                    }
                  />
                  <Label htmlFor="supports_unit">Support unit-based pricing</Label>
                </div>
                
                {formData.supports_unit && (
                  <div>
                    <Label htmlFor="unit_price">Price per unit ($)</Label>
                    <Input
                      id="unit_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.unit_price || ''}
                      onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="supports_kilo"
                    checked={formData.supports_kilo}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, supports_kilo: checked as boolean })
                    }
                  />
                  <Label htmlFor="supports_kilo">Support weight-based pricing</Label>
                </div>
                
                {formData.supports_kilo && (
                  <div>
                    <Label htmlFor="kilo_price">Price per kilogram ($)</Label>
                    <Input
                      id="kilo_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.kilo_price || ''}
                      onChange={(e) => setFormData({ ...formData, kilo_price: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                )}
              </div>
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

            {/* Form Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowCreateDialog(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : editingService ? 'Update Service' : 'Create Service'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceManagement;
