import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Package, AlertCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { usePageTitle } from '@/hooks/usePageTitle';
import { 
  useExpenses, 
  useCreateExpense, 
  useUpdateExpense, 
  useDeleteExpense, 
  ExpenseData,
  ExpenseFormData 
} from '@/hooks/useRevenue';
import { SectionLoading } from '@/components/ui/loading-spinner';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type DateRangePreset = 'today' | '7days' | '1month' | 'all';

const dateRangePresets = [
  { value: 'today' as DateRangePreset, label: 'Hari ini' },
  { value: '7days' as DateRangePreset, label: '7 hari' },
  { value: '1month' as DateRangePreset, label: '1 bulan' },
  { value: 'all' as DateRangePreset, label: 'Semua' },
];

const categoryLabels: Record<string, string> = {
  detergent: 'Deterjen',
  gas: 'Gas',
  electricity: 'Token Listrik',
  promo: 'Promo',
  maintenance: 'Perawatan',
  other: 'Lainnya',
};

const categoryColors: Record<string, string> = {
  detergent: 'bg-cyan-100 text-cyan-800',
  gas: 'bg-orange-100 text-orange-800',
  electricity: 'bg-yellow-100 text-yellow-800',
  promo: 'bg-purple-100 text-purple-800',
  maintenance: 'bg-blue-100 text-blue-800',
  other: 'bg-gray-100 text-gray-800',
};

const initialFormData: ExpenseFormData = {
  category: 'other',
  description: '',
  amount: 0,
  expense_date: new Date().toISOString().split('T')[0],
};

const getDateRange = (preset: DateRangePreset) => {
  const now = new Date();
  
  switch (preset) {
    case 'today':
      return {
        start: startOfDay(now).toISOString().split('T')[0],
        end: endOfDay(now).toISOString().split('T')[0],
      };
    case '7days':
      return {
        start: startOfDay(subDays(now, 6)).toISOString().split('T')[0],
        end: endOfDay(now).toISOString().split('T')[0],
      };
    case '1month':
      return {
        start: startOfDay(subDays(now, 29)).toISOString().split('T')[0],
        end: endOfDay(now).toISOString().split('T')[0],
      };
    case 'all':
      return {
        start: undefined,
        end: undefined,
      };
    default:
      return {
        start: undefined,
        end: undefined,
      };
  }
};

export const ExpensesPage = () => {
  usePageTitle('Pengeluaran');

  const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>('1month');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseData | null>(null);
  const [formData, setFormData] = useState<ExpenseFormData>(initialFormData);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { toast } = useToast();

  const dateRange = getDateRange(selectedPreset);
  const { data: expenses = [], isLoading: loading, error } = useExpenses(dateRange.start, dateRange.end);
  const createExpenseMutation = useCreateExpense();
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();

  const isProcessing = createExpenseMutation.isPending || updateExpenseMutation.isPending || deleteExpenseMutation.isPending;

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.amount <= 0) {
      toast({
        title: "Error",
        description: "Jumlah pengeluaran harus lebih dari 0",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingExpense) {
        // Update existing expense
        await updateExpenseMutation.mutateAsync({
          id: editingExpense.id,
          data: formData
        });
      } else {
        // Create new expense
        await createExpenseMutation.mutateAsync(formData);
      }

      setFormData(initialFormData);
      setEditingExpense(null);
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const handleEdit = (expense: ExpenseData) => {
    setFormData({
      category: expense.category,
      description: expense.description || '',
      amount: expense.amount,
      expense_date: expense.expense_date,
    });
    setEditingExpense(expense);
    setShowCreateDialog(true);
  };

  const handleDelete = async (expenseId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengeluaran ini?')) {
      return;
    }

    try {
      await deleteExpenseMutation.mutateAsync(expenseId);
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const openCreateDialog = () => {
    setFormData({
      ...initialFormData,
      expense_date: new Date().toISOString().split('T')[0],
    });
    setEditingExpense(null);
    setShowCreateDialog(true);
  };

  const handlePresetChange = (preset: DateRangePreset) => {
    setSelectedPreset(preset);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pengeluaran</h1>
          <p className="text-muted-foreground">Kelola pengeluaran operasional usaha Anda</p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="flex items-center space-x-2"
          disabled={isProcessing}
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Pengeluaran</span>
        </Button>
      </div>

      {/* Date Range Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {dateRangePresets.map((preset) => (
          <Button
            key={preset.value}
            variant={selectedPreset === preset.value ? 'default' : 'outline'}
            onClick={() => handlePresetChange(preset.value)}
            className={cn(
              'rounded-full',
              selectedPreset === preset.value
                ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-500'
                : 'bg-white hover:bg-gray-50'
            )}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Total Summary Card */}
      <Card className="bg-gradient-to-r from-rose-50 to-red-50 border-rose-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-rose-600 font-medium">Total Pengeluaran</p>
              <p className="text-3xl font-bold text-rose-700">{formatCurrency(totalExpenses)}</p>
              <p className="text-sm text-rose-500 mt-1">
                {expenses.length} transaksi
              </p>
            </div>
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center">
              <Package className="h-8 w-8 text-rose-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && <SectionLoading text="Memuat pengeluaran..." />}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-medium text-red-800">Error memuat pengeluaran</h3>
                <p className="text-sm text-red-600">
                  Silakan coba refresh halaman atau hubungi dukungan jika masalah berlanjut.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expenses List */}
      {!loading && !error && (
        <>
          {expenses.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Tidak ada pengeluaran</h3>
                <p className="text-muted-foreground mb-4">
                  Belum ada pengeluaran yang tercatat untuk periode ini.
                </p>
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Pengeluaran
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <Card key={expense.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={categoryColors[expense.category]}>
                            {categoryLabels[expense.category]}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(expense.expense_date), 'dd MMM yyyy', { locale: localeId })}
                          </span>
                        </div>
                        {expense.description && (
                          <p className="text-sm text-gray-600 truncate">{expense.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-semibold text-rose-600">
                          {formatCurrency(expense.amount)}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(expense)}
                            disabled={isProcessing}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(expense.id)}
                            disabled={isProcessing}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create/Edit Expense Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? 'Edit Pengeluaran' : 'Tambah Pengeluaran Baru'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category */}
            <div>
              <Label htmlFor="category">Kategori*</Label>
              <Select
                value={formData.category}
                onValueChange={(value: ExpenseFormData['category']) => 
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="detergent">Deterjen</SelectItem>
                  <SelectItem value="gas">Gas</SelectItem>
                  <SelectItem value="electricity">Token Listrik</SelectItem>
                  <SelectItem value="promo">Promo</SelectItem>
                  <SelectItem value="maintenance">Perawatan</SelectItem>
                  <SelectItem value="other">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div>
              <Label htmlFor="amount">Jumlah (Rp)*</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="100"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                required
              />
            </div>

            {/* Date */}
            <div>
              <Label>Tanggal*</Label>
              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.expense_date && 'text-muted-foreground'
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {formData.expense_date 
                      ? format(new Date(formData.expense_date), 'dd MMMM yyyy', { locale: localeId }) 
                      : 'Pilih tanggal'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={formData.expense_date ? new Date(formData.expense_date) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setFormData({ 
                          ...formData, 
                          expense_date: date.toISOString().split('T')[0] 
                        });
                      }
                      setShowDatePicker(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Keterangan</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Keterangan pengeluaran (opsional)"
                rows={3}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={isProcessing}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isProcessing}>
                {isProcessing ? 'Menyimpan...' : editingExpense ? 'Perbarui' : 'Simpan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpensesPage;
