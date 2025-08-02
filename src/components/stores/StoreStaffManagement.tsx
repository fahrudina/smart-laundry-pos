import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { authService } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';
import { Users, UserPlus, Mail, Phone, Calendar } from 'lucide-react';
import { StoreWithOwnershipInfo } from '@/types/multi-tenant';

interface StoreStaffManagementProps {
  store: StoreWithOwnershipInfo;
}

interface StaffMember {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  store_id: string | null;
  is_active: boolean;
  created_at: string;
}

interface CreateStaffForm {
  email: string;
  password: string;
  full_name: string;
  phone: string;
}

export const StoreStaffManagement: React.FC<StoreStaffManagementProps> = ({ store }) => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [unassignedStaff, setUnassignedStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateStaffForm>({
    email: '',
    password: '',
    full_name: '',
    phone: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadStaff();
    loadUnassignedStaff();
  }, [store.store_id]);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('store_id', store.store_id)
        .eq('role', 'staff');

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error loading staff:', error);
      toast({
        title: 'Error',
        description: 'Failed to load staff members',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUnassignedStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'staff')
        .is('store_id', null);

      if (error) throw error;
      setUnassignedStaff(data || []);
    } catch (error) {
      console.error('Error loading unassigned staff:', error);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Use the signUp method to create a new staff user
      const newUser = await authService.signUp(
        createForm.email, 
        createForm.password, 
        createForm.full_name, 
        createForm.phone
      );

      // Assign the new user to the store
      await authService.assignStaffToStore(newUser.id, store.store_id);

      toast({
        title: 'Success',
        description: 'Staff member created and assigned successfully',
      });

      setCreateForm({ email: '', password: '', full_name: '', phone: '' });
      setCreateDialogOpen(false);
      loadStaff();
    } catch (error) {
      console.error('Error creating staff:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create staff member',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignStaff = async (staffId: string) => {
    try {
      setLoading(true);
      await authService.assignStaffToStore(staffId, store.store_id);

      toast({
        title: 'Success',
        description: 'Staff member assigned successfully',
      });

      loadStaff();
      loadUnassignedStaff();
    } catch (error) {
      console.error('Error assigning staff:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign staff member',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStaff = async (staffId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('users')
        .update({ store_id: null })
        .eq('id', staffId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Staff member removed from store',
      });

      loadStaff();
      loadUnassignedStaff();
    } catch (error) {
      console.error('Error removing staff:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove staff member',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Staff Management - {store.store_name}
          </div>
          <div className="flex gap-2">
            <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Assign Existing
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Existing Staff</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {unassignedStaff.length === 0 ? (
                    <p className="text-muted-foreground">No unassigned staff available</p>
                  ) : (
                    <div className="space-y-2">
                      {unassignedStaff.map((staffMember) => (
                        <div key={staffMember.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{staffMember.full_name || 'No name'}</p>
                            <p className="text-sm text-muted-foreground">{staffMember.email}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAssignStaff(staffMember.id)}
                            disabled={loading}
                          >
                            Assign
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add New Staff
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Staff Member</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateStaff} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      type="text"
                      value={createForm.full_name}
                      onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={createForm.phone}
                      onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      Create Staff
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && staff.length === 0 ? (
          <p className="text-muted-foreground">Loading staff...</p>
        ) : (
          <div className="space-y-4">
            {staff.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No staff assigned</h3>
                <p className="text-muted-foreground mb-4">
                  Add staff members to help manage this store.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {staff.map((staffMember) => (
                  <div key={staffMember.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <h4 className="font-medium">{staffMember.full_name || 'No name'}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {staffMember.email}
                            </div>
                            {staffMember.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {staffMember.phone}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(staffMember.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={staffMember.is_active ? 'default' : 'secondary'}>
                        {staffMember.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveStaff(staffMember.id)}
                        disabled={loading}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
