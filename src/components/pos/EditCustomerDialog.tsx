import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  store_id: string;
  created_at: string;
  updated_at: string;
}

interface EditCustomerDialogProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerUpdated?: () => void;
}

export const EditCustomerDialog = ({ 
  customer, 
  open, 
  onOpenChange,
  onCustomerUpdated 
}: EditCustomerDialogProps) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { currentStore } = useStore();

  // Update form data when customer changes
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
      });
    }
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({
        title: "Error",
        description: "Name and phone number are required",
        variant: "destructive",
      });
      return;
    }

    if (!customer || !currentStore) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || null,
          address: formData.address.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customer.id)
        .eq('store_id', currentStore.store_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Customer updated successfully",
      });

      onOpenChange(false);
      onCustomerUpdated?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update customer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[425px] max-h-[90vh] overflow-y-auto mx-4 my-8">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Edit Customer</DialogTitle>
          <DialogDescription>
            Update customer information
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pb-2">
          <div className="space-y-2">
            <Label htmlFor="edit-name" className="text-sm font-medium">Name *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Customer name"
              required
              className="h-11 text-base"
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-phone" className="text-sm font-medium">Phone Number *</Label>
            <Input
              id="edit-phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="Phone number"
              required
              className="h-11 text-base"
              autoComplete="tel"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email" className="text-sm font-medium">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Email address"
              className="h-11 text-base"
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-address" className="text-sm font-medium">Address</Label>
            <Input
              id="edit-address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Customer address"
              className="h-11 text-base"
              autoComplete="address-line1"
            />
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-11 text-base"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.name.trim() || !formData.phone.trim()}
              className="flex-1 h-11 text-base"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
