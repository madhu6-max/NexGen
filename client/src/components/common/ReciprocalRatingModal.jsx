import React, { useState } from 'react';
import { api } from '../../services/api';
import { Star, X, Check, Award } from 'lucide-react';

export const ReciprocalRatingModal = ({ order, isOpen, onClose, onSuccess, currentRole = 'buyer' }) => {
  const [q1, setQ1] = useState(5);
  const [q2, setQ2] = useState(5);
  const [q3, setQ3] = useState(5);
  const [q4, setQ4] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  const isBuyerRatingFarmer = currentRole === 'buyer';

  const labels = isBuyerRatingFarmer ? {
    title: `Rate Farmer (${order.farmer_name})`,
    subtitle: `Order ${order.order_code} completed. Share feedback to update supplier reliability.`,
    c1: 'Produce Quality',
    c2: 'Quantity Accuracy',
    c3: 'Delivery & Logistics',
    c4: 'Communication'
  } : {
    title: `Rate Buyer (${order.buyer_company})`,
    subtitle: `Order ${order.order_code} fulfilled. Rate commercial payment & professionalism.`,
    c1: 'Prompt Payment',
    c2: 'Communication',
    c3: 'Order Clarity & Accuracy',
    c4: 'Professionalism'
  };

  const renderStars = (value, setter) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setter(star)}
            className="p-1 hover:scale-110 transition focus:outline-none"
          >
            <Star
              className={`w-6 h-6 ${
                star <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
              }`}
            />
          </button>
        ))}
        <span className="text-xs font-bold text-slate-700 ml-2">{value}.0 / 5</span>
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        order_id: order.id,
        from_user_id: isBuyerRatingFarmer ? order.buyer_id : order.farmer_id,
        to_user_id: isBuyerRatingFarmer ? order.farmer_id : order.buyer_id,
        role: isBuyerRatingFarmer ? 'buyer_to_farmer' : 'farmer_to_buyer',
        quality_rating: q1,
        quantity_rating: q2,
        delivery_rating: q3,
        communication_rating: q4,
        comment: comment || 'Smooth commercial fulfillment with verified specifications.'
      };

      const res = await api.submitRating(payload);
      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Failed to submit rating:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{labels.title}</h3>
            <p className="text-xs text-slate-500">{labels.subtitle}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="p-3 bg-slate-50 rounded-xl space-y-3 border border-slate-200/70">
            <div>
              <div className="text-xs font-semibold text-slate-700 mb-1">{labels.c1}</div>
              {renderStars(q1, setQ1)}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-700 mb-1">{labels.c2}</div>
              {renderStars(q2, setQ2)}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-700 mb-1">{labels.c3}</div>
              {renderStars(q3, setQ3)}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-700 mb-1">{labels.c4}</div>
              {renderStars(q4, setQ4)}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Feedback & Comments
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe batch condition, logistics coordination, and professionalism..."
              rows={3}
              className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Rating & Close'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
