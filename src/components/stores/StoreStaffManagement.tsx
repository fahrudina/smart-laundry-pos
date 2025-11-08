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
        description: 'Gagal memuat anggota staf',
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
        createForm.phone,
        'staff',
        undefined,
        false // do not set session when creating staff
      );

  // Assign the new user to the store, passing the current owner user ID
  await authService.assignStaffToStore(newUser.id, store.store_id);

      toast({
        title: 'Berhasil',
        description: 'Anggota staf berhasil dibuat dan ditugaskan',
      });

      setCreateForm({ email: '', password: '', full_name: '', phone: '' });
  setCreateDialogOpen(false);
  await loadStaff();
  await loadUnassignedStaff();
    } catch (error) {
      console.error('Error creating staff:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal membuat anggota staf',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignStaff = async (staffId: string) => {
    try {
      setLoading(true);
      // Always use the current session owner user ID for assignment
      await authService.assignStaffToStore(staffId, store.store_id);

      toast({
        title: 'Berhasil',
        description: 'Anggota staf berhasil ditugaskan',
      });

      loadStaff();
      loadUnassignedStaff();
    } catch (error) {
      console.error('Error assigning staff:', error);
      toast({
        title: 'Error',
        description: 'Gagal menugaskan anggota staf',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const handleRemoveStaff = async (staffId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('users')
        .update({ store_id: null })
        .eq('id', staffId);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Anggota staf berhasil dihapus dari toko',
      });

      loadStaff();
      loadUnassignedStaff();
    } catch (error) {
      console.error('Error removing staff:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus anggota staf',
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
            Manajemen Staf - {store.store_name}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Tugaskan yang Ada
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Tugaskan Staf yang Ada</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {unassignedStaff.length === 0 ? (
                    <p className="text-muted-foreground">Tidak ada staf yang belum ditugaskan</p>
                  ) : (
                    <div className="space-y-2">
                      {unassignedStaff.map((staffMember) => (
                        <div
                          key={staffMember.id}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleAssignStaff(staffMember.id); } }}
                          onClick={() => handleAssignStaff(staffMember.id)}
                          className="cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg gap-3"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{staffMember.full_name || 'Tanpa nama'}</p>
                            <p className="text-sm text-muted-foreground">{staffMember.email}</p>
                          </div>
                          <div className="flex-shrink-0">
                            <Button
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleAssignStaff(staffMember.id); }}
                              disabled={loading}
                            >
                              Tugaskan
                            </Button>
                          </div>
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
                  Tambah Staf Baru
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Buat Anggota Staf Baru</DialogTitle>
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
                    <Label htmlFor="password">Kata Sandi</Label>
                    <Input
                      id="password"
                      type="password"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="full_name">Nama Lengkap</Label>
                    <Input
                      id="full_name"
                      type="text"
                      value={createForm.full_name}
                      onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telepon</Label>
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
                      Batal
                    </Button>
                    <Button type="submit" disabled={loading}>
                      Buat Staf
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
          <p className="text-muted-foreground">Memuat staf...</p>
        ) : (
          <div className="space-y-4">
            {staff.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Belum ada staf yang ditugaskan</h3>
                <p className="text-muted-foreground mb-4">
                  Tambahkan anggota staf untuk membantu mengelola toko ini.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {staff.map((staffMember) => (
                  <div
                    key={staffMember.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-start sm:items-center gap-3">
                        <div>
                          <h4 className="font-medium">{staffMember.full_name || 'Tanpa nama'}</h4>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm text-muted-foreground">
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
                    <div className="flex-shrink-0 flex items-center gap-2">
                      <Badge variant={staffMember.is_active ? 'default' : 'secondary'}>
                        {staffMember.is_active ? 'Aktif' : 'Tidak Aktif'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveStaff(staffMember.id)}
                        disabled={loading}
                      >
                        Hapus
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
