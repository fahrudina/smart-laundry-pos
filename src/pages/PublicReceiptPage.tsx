import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Receipt, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { WhatsAppDataHelper } from '@/integrations/whatsapp/data-helper';
import { StoreInfo } from '@/integrations/whatsapp/types';

interface OrderData {
  id: string;
  customer_name: string;
  customer_phone: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  execution_status: string;
  payment_status: string;
  payment_method: string;
  order_date: string;
  estimated_completion: string;
  created_at: string;
  updated_at: string;
  order_items: Array<{
    service_name: string;
    service_price: number;
    quantity: number;
    line_total: number;
    service_type: string;
    weight_kg?: number;
  }>;
}

export const PublicReceiptPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError('ID pesanan tidak ditemukan');
        setLoading(false);
        return;
      }

      try {
        console.log('🧾 Fetching receipt data for order:', orderId);
        
        // Use the public function to get receipt data
        const { data: receiptResponse, error: receiptError } = await supabase
          .rpc('get_receipt_data', { order_id_param: orderId });

        console.log('📋 Receipt response:', receiptResponse);
        console.log('❌ Receipt error:', receiptError);

        if (receiptError) {
          throw receiptError;
        }

        if (!receiptResponse || !receiptResponse.order) {
          setError('Pesanan tidak ditemukan');
          setLoading(false);
          return;
        }

        // Extract order data
        const orderData = {
          ...receiptResponse.order,
          order_items: receiptResponse.order_items || []
        };

        setOrder(orderData);
        
        // Set store information from the response
        if (receiptResponse.store) {
          setStoreInfo({
            name: receiptResponse.store.name || 'Smart Laundry POS',
            address: receiptResponse.store.address || 'Alamat belum diset',
            phone: receiptResponse.store.phone || 'Nomor telepon belum diset',
          });
          console.log('✅ Store info from receipt function:', receiptResponse.store);
        } else {
          // Fallback store info if no store data found
          setStoreInfo({
            name: 'Smart Laundry POS',
            address: 'Alamat belum diset',
            phone: 'Nomor telepon belum diset',
          });
          console.log('⚠️ No store data found, using fallback');
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Gagal memuat data pesanan');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const maskPhoneNumber = (phoneNumber: string) => {
    if (!phoneNumber || phoneNumber.length < 8) {
      return phoneNumber;
    }
    
    // Remove any non-digit characters for processing
    const digits = phoneNumber.replace(/\D/g, '');
    
    if (digits.length < 8) {
      return phoneNumber;
    }
    
    // Keep first 2-3 digits and last 2-3 digits, mask 4 digits in the middle
    const start = digits.slice(0, Math.ceil((digits.length - 4) / 2));
    const end = digits.slice(-(Math.floor((digits.length - 4) / 2)));
    const masked = start + '****' + end;
    
    return masked;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat nota digital...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-full max-w-md mx-4 bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-center">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Nota Tidak Ditemukan</h2>
            <p className="text-gray-600">{error || 'Pesanan dengan ID tersebut tidak ditemukan.'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-md mx-auto px-4">
        {/* Receipt Card */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          {/* Store Header */}
          <div className="bg-white p-4 text-center border-b border-gray-200">
            {/* Logo placeholder */}
            <div className="w-16 h-16 bg-emerald-100 rounded-full mx-auto mb-3 flex items-center justify-center">
              <Receipt className="h-8 w-8 text-emerald-600" />
            </div>
            
            {/* Store Information */}
            <h1 className="text-xl font-bold text-gray-800 mb-1">
              {storeInfo?.name || 'Smart Laundry POS'}
            </h1>
            <p className="text-sm text-gray-600 mb-1">
              {storeInfo?.address || 'Alamat belum diset'}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              No. HP {storeInfo?.phone || 'Nomor telepon belum diset'}
            </p>

            {/* QR Code for Payment */}
            <div className="mb-4">
              <img 
                src="/qrcode.png" 
                alt="Payment QR Code" 
                className="w-32 h-32 mx-auto border border-gray-200 rounded"
              />
              <p className="text-xs text-gray-500 mt-2">
                Scan QR Code untuk pembayaran digital
              </p>
            </div>

            {/* Order ID */}
            <div className="bg-gray-50 px-3 py-2 rounded text-center mb-2">
              <p className="text-sm font-medium text-gray-800">
                ID: {orderId}
              </p>
            </div>

            {/* Customer Information */}
            <div className="text-left space-y-1">
              <p className="text-sm">
                <span className="text-gray-600">Nama:</span>{' '}
                <span className="font-medium text-gray-800">{order.customer_name}</span>
              </p>
              <p className="text-sm">
                <span className="text-gray-600">No. HP:</span>{' '}
                <span className="font-medium text-gray-800">{maskPhoneNumber(order.customer_phone)}</span>
              </p>
            </div>

            {/* Service Type */}
            <div className="mt-4 text-center">
              <p className="text-lg font-bold text-gray-800 mb-1">
                {order.order_items[0]?.service_name || 'Layanan Kiloan'}
              </p>
              <p className="text-sm text-gray-500">
                ({order.order_items[0]?.service_name?.toUpperCase() || 'KILOAN REGULER'})
              </p>
            </div>
          </div>

          {/* Status Section */}
          <div className="bg-white p-4 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">STATUS LAYANAN</h2>
              <span className="bg-emerald-500 text-white px-3 py-1 rounded text-sm font-medium">
                {order.execution_status === 'completed' ? 'Sudah Diambil' : 
                 order.execution_status === 'ready_for_pickup' ? 'Siap Diambil' :
                 order.execution_status === 'in_progress' ? 'Sedang Dikerjakan' : 'Dalam Antrian'}
              </span>
            </div>
            
            {/* Status Timeline */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Order Diterima</span>
                <span className="text-gray-500">{formatDate(order.order_date)}, {formatTime(order.order_date)} WIB</span>
              </div>
              
              {order.updated_at && (
                <div className="flex justify-between items-center">
                  <span className="text-emerald-600 italic">Terakhir Diperbaharui</span>
                  <span className="text-emerald-600 italic">{formatDate(order.updated_at)}, {formatTime(order.updated_at)} WIB</span>
                </div>
              )}
              
              <div className="border-t border-dashed border-gray-300 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Laundry {order.execution_status === 'completed' ? 'Sudah Diambil' : 'Siap Diambil'}</span>
                  <span className="text-gray-500">
                    {order.execution_status === 'completed' ? 
                      `${formatDate(order.updated_at || order.order_date)}, ${formatTime(order.updated_at || order.order_date)} WIB` :
                      `${formatDate(order.estimated_completion || order.order_date)}, ${formatTime(order.estimated_completion || order.order_date)} WIB`
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Detail Transaksi */}
          <div className="p-4">
            <div 
              className="flex justify-between items-center cursor-pointer mb-4"
              onClick={() => setShowDetails(!showDetails)}
            >
              <h2 className="text-lg font-semibold text-gray-800">Detail Transaksi</h2>
              {showDetails ? (
                <ChevronUp className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-600" />
              )}
            </div>
            
            {/* Transaction Details */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="text-emerald-600 font-medium">
                  {order.payment_status === 'completed' ? 'LUNAS' : 'BELUM LUNAS'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Metode Pembayaran</span>
                <span className="text-emerald-600 font-medium">
                  {order.payment_method?.toUpperCase() || 'CASH'}
                </span>
              </div>
            </div>

            {/* Service Items - Expandable */}
            {showDetails && (
              <div className="mt-4 space-y-3 border-t border-gray-200 pt-4">
                <h3 className="font-medium text-gray-800 mb-3">Item Layanan:</h3>
                {order.order_items.map((item, index) => (
                  <div key={index} className="border-b border-gray-200 pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">
                          {item.weight_kg ? `${item.weight_kg}Kg` : `${item.quantity}x`} ({item.service_name})
                        </p>
                        <p className="text-emerald-600 text-sm">Rp. {item.service_price.toLocaleString('id-ID')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-800">
                          Rp. {item.line_total.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pricing Breakdown */}
            <div className="mt-4 space-y-2 text-sm border-t border-dashed border-gray-300 pt-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Harga /kg</span>
                <span className="text-gray-800">Rp. {Math.round(order.subtotal / order.order_items.reduce((total, item) => total + (item.weight_kg || item.quantity), 0)).toLocaleString('id-ID')}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-800">Rp. {order.subtotal.toLocaleString('id-ID')}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Diskon</span>
                <span className="text-gray-800">0</span>
              </div>
              
              <div className="border-t border-dashed border-gray-300 pt-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-800">Total Harga</span>
                  <span className="text-gray-800">Rp. {order.total_amount.toLocaleString('id-ID')}</span>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Bayar DP</span>
                <span className="text-gray-800">Rp. 0</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Sisa Bayar</span>
                <span className="text-gray-800">Rp. {order.total_amount.toLocaleString('id-ID')}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">DiBayar</span>
                <span className="text-gray-800">
                  Rp. {order.payment_status === 'completed' ? 
                    (50000).toLocaleString('id-ID') : 
                    '0'
                  }
                </span>
              </div>
              
              <div className="border-t border-dashed border-gray-300 pt-2">
                <div className="flex justify-between font-semibold text-lg">
                  <span className="text-gray-800">Kembalian</span>
                  <span className="text-emerald-600">
                    Rp. {order.payment_status === 'completed' ? 
                      (50000 - order.total_amount).toLocaleString('id-ID') : 
                      '0'
                    }
                  </span>
                </div>
              </div>
            </div>
            {/* Payment Info */}
            <div className="mt-4 pt-4 border-t border-dashed border-gray-300 text-sm text-gray-500 space-y-1">
              <div className="flex justify-between items-center">
               <span className="text-gray-600 italic">{order.payment_status === 'completed' ? 'Dilunasi ' : 'Belum Dilunasi'}</span>
                {order.payment_status === 'completed' && (
                   <span className="text-emerald-600 italic">
                    {formatDate(order.updated_at)}, {formatTime(order.updated_at)} WIB
                  </span>
                )}
              </div>
              <div className="italic">
                Ketuk/Sentuh "Detail Transaksi" untuk melihat item layanan
              </div>
            </div>
          </div>

          {/* Catatan Section */}
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Catatan</h3>
            <div className="text-xs text-gray-600 space-y-2">
              <p><strong>KETENTUAN :</strong></p>
              <p>1. Pakaian Luntur bukan menjadi tanggung jawab laundry.</p>
              <p>2. Komplain pakaian kami layani 1x24 jam, sejak pakaian diambil.</p>
              <p>3. Laundry yang tidak diambil jangka waktu 1 bulan, jika terjadi kerusakan menjadi tanggung jawab pemilik.</p>
              <p className="mt-3 text-center italic">Terimakasih atas kunjungan anda</p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 bg-gray-100 text-center">
            <p className="text-xs text-gray-500">Powered by  {storeInfo?.name || 'Smart Laundry POS'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
