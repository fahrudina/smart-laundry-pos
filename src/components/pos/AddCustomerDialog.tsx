import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCustomers, type Customer } from '@/hooks/useCustomers';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface AddCustomerDialogProps {
  onCustomerAdded?: (customer: Customer) => void;
  trigger?: React.ReactNode;
}

export const AddCustomerDialog = ({ onCustomerAdded, trigger }: AddCustomerDialogProps) => {
  const isMobile = useIsMobile();
  const Root = isMobile ? Drawer : Dialog;
  const Trigger = isMobile ? DrawerTrigger : DialogTrigger;
  const Content = isMobile ? DrawerContent : DialogContent;
  const Header = isMobile ? DrawerHeader : DialogHeader;
  const Title = isMobile ? DrawerTitle : DialogTitle;

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const { addCustomer, loading } = useCustomers();
  const { toast } = useToast();

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

    try {
      const customer = await addCustomer({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
      });
      
      setFormData({ name: '', phone: '', email: '', address: '' });
      setOpen(false);
      onCustomerAdded?.(customer);
      
      toast({
        title: "Success",
        description: "Customer added successfully!",
      });
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Root open={open} onOpenChange={setOpen} {...(isMobile ? { shouldScaleBackground: false } : {})}>
      <Trigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Tambah Pelanggan Baru
          </Button>
        )}
      </Trigger>
      <Content className={isMobile ? 'flex max-h-[85vh] flex-col' : 'w-[95vw] max-w-[425px] max-h-[90vh] overflow-y-auto mx-4 my-8'}>
        <Header>
          <Title className="text-lg sm:text-xl">Tambah Pelanggan Baru</Title>
        </Header>
        <form
          onSubmit={handleSubmit}
          className={cn(
            'space-y-4 pb-2',
            isMobile && 'min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]'
          )}
        >
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Nama *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Nama pelanggan"
              required
              className="h-11 text-base"
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">Nomor Telepon *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="Nomor telepon"
              required
              className="h-11 text-base"
              autoComplete="tel"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Alamat email"
              className="h-11 text-base"
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium">Alamat</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Alamat pelanggan"
              className="h-11 text-base"
              autoComplete="address-line1"
            />
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 h-11 text-base"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.name.trim() || !formData.phone.trim()}
              className="flex-1 h-11 text-base"
            >
              {loading ? 'Menambahkan...' : 'Tambah Pelanggan'}
            </Button>
          </div>
        </form>
      </Content>
    </Root>
  );
};