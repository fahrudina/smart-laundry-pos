import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowLeft,
  Eye
} from 'lucide-react';
import { AddCustomerDialog } from '@/components/pos/AddCustomerDialog';
import { EditCustomerDialog } from '@/components/pos/EditCustomerDialog';
import { useNavigate } from 'react-router-dom';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  store_id: string;
  created_at: string;
  updated_at: string;
  _count?: {
    orders: number;
  };
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
}

const ITEMS_PER_PAGE = 10;

export const CustomersPage: React.FC = () => {
  const { currentStore } = useStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: ITEMS_PER_PAGE
  });

  // Debounced search query
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);  // Memoized calculations for performance
  const activeCustomersCount = useMemo(() => {
    return customers.filter(c => c._count && c._count.orders > 0).length;
  }, [customers]);

  const newThisMonthCount = useMemo(() => {
    return customers.filter(c => {
      const customerDate = new Date(c.created_at);
      const now = new Date();
      return customerDate.getMonth() === now.getMonth() && 
             customerDate.getFullYear() === now.getFullYear();
    }).length;
  }, [customers]);

  const fetchCustomers = async (page: number = 1, search: string = '') => {
    if (!currentStore) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('customers')
        .select(`
          *,
          orders!left (
            id
          )
        `, { count: 'exact' })
        .eq('store_id', currentStore.store_id)
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1)
        .order('created_at', { ascending: false });

      if (search.trim()) {
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Transform data to include order count
      const customersWithCount = (data || []).map(customer => ({
        ...customer,
        _count: {
          orders: customer.orders?.length || 0
        }
      }));

      setCustomers(customersWithCount);
      setPagination(prev => ({
        ...prev,
        currentPage: page,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / ITEMS_PER_PAGE)
      }));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(pagination.currentPage, debouncedSearchQuery);
  }, [currentStore, pagination.currentPage, debouncedSearchQuery]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: page }));
    }
  };

  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDetails(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowEditDialog(true);
  };

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCustomer = async () => {
    if (!currentStore || !customerToDelete) return;

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerToDelete.id)
        .eq('store_id', currentStore.store_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });

      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
      
      // Refresh the current page
      fetchCustomers(pagination.currentPage, debouncedSearchQuery);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const locale = typeof navigator !== "undefined" && navigator.language ? navigator.language : 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Pagination component
  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    const { currentPage, totalPages } = pagination;
    const pages = [];

    // Always show first page
    pages.push(1);

    // Add ellipsis if needed
    if (currentPage > 3) {
      pages.push('...');
    }

    // Add pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
    }

    // Add ellipsis if needed
    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    // Always show last page
    if (totalPages > 1 && !pages.includes(totalPages)) {
      pages.push(totalPages);
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-500 text-center sm:text-left">
          Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{' '}
          {Math.min(currentPage * ITEMS_PER_PAGE, pagination.totalCount)} of{' '}
          {pagination.totalCount} customers
        </div>
        
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0 hidden sm:flex"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {pages.map((page, index) => (
            <Button
              key={index}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => typeof page === 'number' ? handlePageChange(page) : undefined}
              disabled={typeof page !== 'number'}
              className="h-8 min-w-[32px] px-2"
            >
              {page}
            </Button>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0 hidden sm:flex"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  if (!currentStore) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please select a store to view customers</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/home')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage your customer database</p>
          </div>
        </div>
        <AddCustomerDialog
          trigger={
            <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          }
          onCustomerAdded={() => fetchCustomers(pagination.currentPage, debouncedSearchQuery)}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.totalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCustomersCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newThisMonthCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
              <div className="relative flex-1 sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
              <p className="text-gray-600">
                {searchQuery ? 'Try adjusting your search terms' : 'Get started by adding your first customer'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Contact</TableHead>
                    <TableHead className="hidden sm:table-cell">Orders</TableHead>
                    <TableHead className="hidden lg:table-cell">Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow 
                      key={customer.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleCustomerClick(customer)}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-gray-500 md:hidden flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </div>
                          {customer.email && (
                            <div className="text-sm text-gray-500 hidden md:block">{customer.email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{customer.phone}</span>
                        </div>
                        {customer.address && (
                          <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-[200px]">{customer.address}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary">
                          {customer._count?.orders || 0} orders
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 hidden lg:table-cell">
                        {formatDate(customer.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCustomerClick(customer);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditCustomer(customer);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(customer);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-4 border-t pt-4">
                  {renderPagination()}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Customer Details Dialog */}
      <Dialog open={showCustomerDetails} onOpenChange={setShowCustomerDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>
              View and manage customer information
            </DialogDescription>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-lg">{selectedCustomer.name}</h3>
                <p className="text-sm text-gray-500">Customer since {formatDate(selectedCustomer.created_at)}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{selectedCustomer.phone}</span>
                </div>
                
                {selectedCustomer.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{selectedCustomer.email}</span>
                  </div>
                )}
                
                {selectedCustomer.address && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <span className="text-sm">{selectedCustomer.address}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {selectedCustomer._count?.orders || 0} total orders
                </Badge>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setShowCustomerDetails(false);
                    handleEditCustomer(selectedCustomer);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={() => {
                    setShowCustomerDetails(false);
                    handleDeleteClick(selectedCustomer);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <EditCustomerDialog
        customer={selectedCustomer}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onCustomerUpdated={() => fetchCustomers(pagination.currentPage, debouncedSearchQuery)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="w-[95vw] max-w-[425px] mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {customerToDelete?.name}'s information.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCustomer}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
