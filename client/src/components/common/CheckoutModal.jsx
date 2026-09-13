import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { RazorpayPaymentReceiptModal } from './RazorpayPaymentReceiptModal';
import {
  ShieldCheck, CreditCard, Banknote, CheckCircle2, AlertCircle,
  X, ArrowRight, Loader2
} from 'lucide-react';

export const CheckoutModal = ({ isOpen, onClose, request, order: existingOrder, onSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('ONLINE_RAZORPAY'); // 'COD' | 'ONLINE_RAZORPAY'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Razorpay public key comes only from the backend payment config.
  // There is intentionally no hardcoded fallback key.
  const [keyId, setKeyId] = useState(null);
  const [paymentStep, setPaymentStep] = useState('select'); // 'select' | 'verifying' | 'success' | 'failed'

  // Receipt Modal State
  const [receiptData, setReceiptData] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setPaymentStep('select');
      setReceiptData(null);
      setShowReceipt(false);
      api.getPaymentConfig()
        .then(cfg => {
          if (cfg && cfg.keyId) setKeyId(cfg.keyId);
        })
        .catch(err => console.warn('Could not fetch payment config:', err));
    }
  }, [isOpen]);

  if (!isOpen || (!request && !existingOrder)) return null;

  // Compute contract values
  const activeOrder = existingOrder || null;
  const agreedPrice = activeOrder
    ? activeOrder.agreed_price_per_kg
    : (request.counter_price_per_kg || request.offered_price_per_kg);
  const agreedQty = activeOrder
    ? activeOrder.agreed_qty_kg
    : request.requested_qty_kg;
  const totalValue = activeOrder
    ? parseFloat(activeOrder.total_value)
    : Math.round(agreedQty * agreedPrice);
  const cropName = activeOrder ? activeOrder.crop_name : request.crop_name;
  const farmerName = activeOrder ? activeOrder.farmer_name : request.farmer_name;

  // Dynamic Razorpay script loader
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckoutSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      let order = activeOrder;

      // If no existing order, confirm request first
      if (!order && request) {
        const orderRes = await api.buyerConfirmOrder(request.id, { payment_method: paymentMethod });
        if (!orderRes.success && !orderRes.order) {
          throw new Error(orderRes.error || 'Failed to create commercial order.');
        }
        order = orderRes.order;
      }

      // COD Flow
      if (paymentMethod === 'COD') {
        const codRes = await api.createPaymentOrder({
          orderId: order.id,
          payment_method: 'COD',
          idempotency_key: `idemp_${order.id}_COD`
        });

        setPaymentStep('success');
        const rcpt = await api.getPaymentReceipt(order.id).catch(() => null);
        setTimeout(() => {
          if (rcpt && rcpt.success) {
            setReceiptData(rcpt);
            setShowReceipt(true);
          } else {
            if (onSuccess) onSuccess(order);
            onClose();
          }
        }, 1200);
        return;
      }

      // Razorpay Online Flow: Generate Backend Order
      const paymentOrderRes = await api.createPaymentOrder({
        orderId: order.id,
        payment_method: 'ONLINE_RAZORPAY',
        idempotency_key: `idemp_${order.id}_ONLINE`
      });

      if (!paymentOrderRes.success) {
        throw new Error(paymentOrderRes.error || 'Failed to initiate online payment order.');
      }

      // Online payment requires a real backend-issued Razorpay key.
      // Never fall back to a hardcoded key or a simulated payment UI.
      const resolvedKey = paymentOrderRes.keyId || keyId;
      if (!resolvedKey) {
        throw new Error('Online payment is not configured. Please use Cash on Delivery or try again later.');
      }

      // Check for native window.Razorpay script
      const scriptLoaded = await loadRazorpayScript();

      if (scriptLoaded && window.Razorpay) {
        try {
          const buyerName = request?.buyer_company || activeOrder?.buyer_company || '';
          const options = {
            key: resolvedKey,
            amount: paymentOrderRes.amountPaise,
            currency: paymentOrderRes.currency || 'INR',
            name: 'AgriLink B2B Escrow',
            description: `Payment for Order ${paymentOrderRes.orderCode} (${cropName})`,
            order_id: paymentOrderRes.razorpayOrderId,
            handler: async function (response) {
              await handleVerifyServerPayment({
                orderId: order.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                createdOrder: order
              });
            },
            // Prefill only with real order data; never invent contact details.
            prefill: {
              ...(buyerName ? { name: buyerName } : {})
            },
            theme: { color: '#059669' },
            modal: {
              ondismiss: function () {
                setLoading(false);
              }
            }
          };

          const rzp = new window.Razorpay(options);
          rzp.on('payment.failed', function (resp) {
            setError(`Payment Failed: ${resp.error.description}`);
            setPaymentStep('failed');
            setLoading(false);
          });
          rzp.open();
          setLoading(false);
          return;
        } catch (rzpOpenErr) {
          console.warn('Native Razorpay dialog could not open:', rzpOpenErr);
          setError('Online payment could not be started. Please use Cash on Delivery or try again later.');
          setPaymentStep('select');
        }
      } else {
        setError('Online payment could not be started. Please use Cash on Delivery or try again later.');
        setPaymentStep('select');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'An error occurred during checkout.');
    } finally {
      setLoading(false);
    }
  };

  // Authoritatively verify signature and fetch official receipt
  const handleVerifyServerPayment = async ({ orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature, createdOrder }) => {
    setPaymentStep('verifying');
    setLoading(true);
    try {
      const verifyRes = await api.verifyPayment({
        orderId,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      });

      if (verifyRes.success) {
        setPaymentStep('success');
        // Fetch official tax invoice receipt
        const receipt = await api.getPaymentReceipt(orderId).catch(() => null);
        if (receipt && receipt.success) {
          setReceiptData(receipt);
          setShowReceipt(true);
        } else {
          setTimeout(() => {
            if (onSuccess) onSuccess(verifyRes.order || createdOrder);
            onClose();
          }, 1500);
        }
      } else {
        setPaymentStep('failed');
        setError(verifyRes.error || 'Payment signature verification failed.');
      }
    } catch (err) {
      setPaymentStep('failed');
      setError(err.message || 'Payment verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 1. Main Checkout Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 relative max-h-[92vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-emerald-600/20">
                ₹
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Commercial Escrow Checkout</h3>
                <p className="text-[11px] text-slate-500 font-medium">Payment is processed securely through Razorpay.</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error Notification */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Verification in Progress State */}
          {paymentStep === 'verifying' && (
            <div className="p-10 text-center space-y-3 bg-emerald-50/50 rounded-2xl border border-emerald-200">
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto" />
              <h4 className="font-bold text-sm text-slate-900">Verifying Razorpay Digital Signature...</h4>
                <p className="text-xs text-slate-500">
                  Payment is processed securely through Razorpay.
                </p>
            </div>
          )}

          {/* Success State */}
          {paymentStep === 'success' && !showReceipt && (
            <div className="p-8 bg-emerald-50 border border-emerald-300 rounded-2xl text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="font-black text-emerald-950 text-lg">Payment Verified & Escrow Locked!</h4>
              <p className="text-xs text-emerald-800">
                Razorpay transaction verified authoritatively. Generating official tax invoice...
              </p>
            </div>
          )}

          {/* Step 1: Method Selector and Locked Contract Summary */}
          {paymentStep === 'select' && (
            <>
              {/* Locked Order Details Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-800 pb-2 border-b border-slate-200">
                  <span>{cropName} ({request?.quality_grade || activeOrder?.quality_grade || 'Grade A'})</span>
                  <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                    Terms Locked ✓
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-slate-600">
                  <div>
                    <span className="text-slate-400 text-[10px]">Seller (Farmer)</span>
                    <div className="font-bold text-slate-900">{farmerName}</div>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px]">Agreed Quantity</span>
                    <div className="font-bold text-slate-900">{Number(agreedQty).toLocaleString()} kg</div>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px]">Agreed Rate</span>
                    <div className="font-extrabold text-emerald-800">₹{agreedPrice}/kg</div>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px]">Escrow Platform Fee</span>
                    <div className="font-bold text-slate-700">1.0%</div>
                  </div>
                </div>

                {/* Authoritative Total */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Locked Total Contract Value</span>
                    <p className="text-[9px] text-slate-400">Funds secured until delivery inspection</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-emerald-800">
                      ₹{totalValue.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">₹{(totalValue / 100000).toFixed(2)} Lakhs</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Select Settlement Method:</label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Razorpay Online */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('ONLINE_RAZORPAY')}
                    className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                      paymentMethod === 'ONLINE_RAZORPAY'
                        ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>Razorpay Online</span>
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                          RECOMMENDED
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">UPI, GPay, Cards & Netbanking</p>
                    </div>
                  </button>

                  {/* Cash on Delivery */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('COD')}
                    className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                      paymentMethod === 'COD'
                        ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-slate-700 text-white">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs">Cash on Delivery</div>
                      <p className="text-[10px] text-slate-500 mt-0.5">Physical collection at weighbridge</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Escrow Guarantee Disclaimer */}
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-[11px] text-emerald-950">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  Payment is processed securely through Razorpay. Payment is released according to the AgriLink order workflow.
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleCheckoutSubmit}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Initiating Razorpay Escrow...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Pay ₹{totalValue.toLocaleString()} via Razorpay</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          )}

        </div>
      </div>

      {/* 2. Official Tax Invoice & Escrow Receipt Modal */}
      {showReceipt && receiptData && (
        <RazorpayPaymentReceiptModal
          isOpen={showReceipt}
          receiptData={receiptData}
          onClose={() => {
            setShowReceipt(false);
            if (onSuccess) onSuccess(receiptData.order);
            onClose();
          }}
          onNavigateTracking={(orderCode) => {
            setShowReceipt(false);
            if (onSuccess) onSuccess(receiptData.order);
            onClose();
          }}
        />
      )}
    </>
  );
};
