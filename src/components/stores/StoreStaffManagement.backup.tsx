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

  const fetchStoreStaff = async () => {
    setLoading(true);
    try {
      // Get staff assigned to this store
      const { data: storeStaff, error } = await supabase
        .from('users')
        .select('*')
        .eq('store_id', store.store_id)
        .eq('role', 'staff');

      if (error) throw error;
      setStaff(storeStaff || []);

      // Get unassigned staff (for assignment)
      const { data: unassigned, error: unassignedError } = await supabase
        .from('users')
        .select('*')
        .is('store_id', null)
        .eq('role', 'staff');

      if (unassignedError) throw unassignedError;
      setUnassignedStaff(unassigned || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast({
        title: "Error",
        description: "Failed to load staff members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreStaff();
  }, [store.store_id]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create the user
      const { data: userId, error: createError } = await supabase.rpc('create_user', {
        user_email: createForm.email,
        user_password: createForm.password,
        user_full_name: createForm.full_name || null,
        user_phone: createForm.phone || null,
        user_role: 'staff'
      });

      if (createError) throw createError;

      // Assign to store
      await authService.assignStaffToStore(userId, store.store_id);

      toast({
        title: "Success",
        description: "Staff member created and assigned successfully!",
      });

      setCreateDialogOpen(false);
      setCreateForm({ email: '', password: '', full_name: '', phone: '' });
      fetchStoreStaff();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create staff member",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignStaff = async (staffId: string) => {
    setLoading(true);
    try {
      await authService.assignStaffToStore(staffId, store.store_id);
      
      toast({
        title: "Success",
        description: "Staff member assigned successfully!",
      });

      setAssignDialogOpen(false);
      fetchStoreStaff();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign staff member",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignStaff = async (staffId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ store_id: null })
        .eq('id', staffId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Staff member unassigned successfully!",
      });

      fetchStoreStaff();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to unassign staff member",
        variant: "destructive",
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
                  Assign Existing Staff
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
                      {unassignedStaff.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <p className="font-medium">{member.full_name || member.email}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAssignStaff(member.id)}
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
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={createForm.password}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={createForm.full_name}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, full_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={createForm.phone}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Creating...' : 'Create & Assign'}
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
          <div className="text-center py-8">Loading staff...</div>
        ) : staff.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No staff assigned to this store yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {staff.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <h4 className="font-medium">{member.full_name || 'No Name'}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </div>
                        {member.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {member.phone}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(member.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={member.is_active ? 'default' : 'secondary'}>
                    {member.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnassignStaff(member.id)}
                    disabled={loading}
                  >
                    Unassign
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
