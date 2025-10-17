import React, { useState, useEffect } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { useToast } from '@/hooks/use-toast';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
  MessageSquare,
  Search,
  Send,
  Users,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  store_id: string;
  created_at: string;
}

interface BroadcastResult {
  customerId: string;
  customerName: string;
  phone: string;
  success: boolean;
  error?: string;
}

// Constants
const MESSAGE_DELAY_MS = 1000; // Delay between messages to avoid rate limiting
const MAX_RECIPIENTS_PREVIEW = 5; // Maximum number of recipients to show in preview

export const WhatsAppBroadcastPage: React.FC = () => {
  const { currentStore } = useStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { sendCustomMessage, isConfigured } = useWhatsApp();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<BroadcastResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Debounced search query
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const fetchCustomers = async (search: string = '') => {
    if (!currentStore) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('customers')
        .select('*')
        .eq('store_id', currentStore.store_id)
        .order('created_at', { ascending: false });

      if (search.trim()) {
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setCustomers(data || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch customers';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(debouncedSearchQuery);
  }, [currentStore, debouncedSearchQuery]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(customers.map(c => c.id));
      setSelectedCustomerIds(allIds);
    } else {
      setSelectedCustomerIds(new Set());
    }
  };

  const handleSelectCustomer = (customerId: string, checked: boolean) => {
    const newSelected = new Set(selectedCustomerIds);
    if (checked) {
      newSelected.add(customerId);
    } else {
      newSelected.delete(customerId);
    }
    setSelectedCustomerIds(newSelected);
  };

  const handleSendBroadcast = async () => {
    if (selectedCustomerIds.size === 0) {
      toast({
        title: "No Customers Selected",
        description: "Please select at least one customer to send messages to",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "No Message",
        description: "Please enter a message to send",
        variant: "destructive",
      });
      return;
    }

    if (!isConfigured) {
      toast({
        title: "WhatsApp Not Configured",
        description: "WhatsApp service is not properly configured. Please check your settings.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    const broadcastResults: BroadcastResult[] = [];

    try {
      const selectedCustomers = customers.filter(c => selectedCustomerIds.has(c.id));

      // Process messages sequentially to respect API rate limits and ensure delivery order
      // For large customer lists, consider implementing batch processing with configurable delays
      for (const customer of selectedCustomers) {
        try {
          const result = await sendCustomMessage(customer.phone, message);
          
          broadcastResults.push({
            customerId: customer.id,
            customerName: customer.name,
            phone: customer.phone,
            success: result.success,
            error: result.error,
          });

          // Small delay between messages to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, MESSAGE_DELAY_MS));
        } catch (error) {
          broadcastResults.push({
            customerId: customer.id,
            customerName: customer.name,
            phone: customer.phone,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      const successCount = broadcastResults.filter(r => r.success).length;
      const failureCount = broadcastResults.length - successCount;

      toast({
        title: "Broadcast Complete",
        description: `Successfully sent ${successCount} message(s). ${failureCount > 0 ? `${failureCount} failed.` : ''}`,
        variant: failureCount > 0 ? "destructive" : "default",
      });

      setResults(broadcastResults);
      setShowResults(true);
      
      // Clear message and selections on success
      if (failureCount === 0) {
        setMessage('');
        setSelectedCustomerIds(new Set());
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send broadcast messages",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (!currentStore) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please select a store to send broadcast messages</p>
      </div>
    );
  }

  const selectedCustomers = customers.filter(c => selectedCustomerIds.has(c.id));
  const allSelected = customers.length > 0 && selectedCustomerIds.size === customers.length;
  const someSelected = selectedCustomerIds.size > 0 && !allSelected;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
            <h1 className="text-2xl font-bold text-gray-900">WhatsApp Broadcast</h1>
            <p className="text-gray-600">Send messages to multiple customers at once</p>
          </div>
        </div>
      </div>

      {/* WhatsApp Configuration Warning */}
      {!isConfigured && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-900">WhatsApp Not Configured</h3>
                <p className="text-sm text-yellow-800 mt-1">
                  WhatsApp service is not properly configured. Messages will not be sent.
                  Please check your environment variables.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Selection Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Select Customers</CardTitle>
                  <CardDescription>
                    {selectedCustomerIds.size > 0
                      ? `${selectedCustomerIds.size} customer(s) selected`
                      : 'Choose customers to receive the message'}
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  <Users className="h-3 w-3 mr-1" />
                  {customers.length} Total
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search customers by name, phone, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Customer List */}
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
                    {searchQuery ? 'Try adjusting your search terms' : 'No customers available in this store'}
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={allSelected}
                            onCheckedChange={handleSelectAll}
                            aria-label="Select all customers"
                            className={someSelected ? "data-[state=checked]:bg-gray-500" : ""}
                          />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Email</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedCustomerIds.has(customer.id)}
                              onCheckedChange={(checked) =>
                                handleSelectCustomer(customer.id, checked as boolean)
                              }
                              aria-label={`Select ${customer.name}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>{customer.phone}</TableCell>
                          <TableCell className="text-gray-500">{customer.email || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Message Composer Panel */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Compose Message
              </CardTitle>
              <CardDescription>
                Write your broadcast message
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Textarea
                  placeholder="Type your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  {message.length} characters
                </p>
              </div>

              {selectedCustomerIds.size > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    Selected Recipients ({selectedCustomerIds.size})
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {selectedCustomers.slice(0, MAX_RECIPIENTS_PREVIEW).map((customer) => (
                      <p key={customer.id} className="text-xs text-blue-700">
                        • {customer.name}
                      </p>
                    ))}
                    {selectedCustomers.length > MAX_RECIPIENTS_PREVIEW && (
                      <p className="text-xs text-blue-600">
                        + {selectedCustomers.length - MAX_RECIPIENTS_PREVIEW} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              <Button
                onClick={handleSendBroadcast}
                disabled={sending || selectedCustomerIds.size === 0 || !message.trim()}
                className="w-full"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send to {selectedCustomerIds.size} Customer{selectedCustomerIds.size !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Results Panel */}
      {showResults && results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Broadcast Results</CardTitle>
            <CardDescription>
              Summary of sent messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.customerId}>
                    <TableCell className="font-medium">{result.customerName}</TableCell>
                    <TableCell>{result.phone}</TableCell>
                    <TableCell>
                      {result.success ? (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Sent
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Failed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {result.error || 'Message delivered successfully'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
