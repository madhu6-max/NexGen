import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  RotateCcw, ShieldAlert, CheckCircle2, MessageSquare,
  FileText, Clock, ArrowRight, ExternalLink
} from 'lucide-react';

export const FarmerReturnsPage = () => {
  const { farmer } = useAuth();
  const [returnsList, setReturnsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responseText, setResponseText] = useState('');
  const [activeCaseId, setActiveCaseId] = useState(null);

  const fetchReturns = async () => {
    try {
      const farmerId = farmer ? farmer.id : 'frm_1';
      const res = await api.getReturns({ farmerId });
      if (res.returns) {
        setReturnsList(res.returns);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [farmer]);

  const handleSendResponse = async (e, caseId) => {
    e.preventDefault();
    try {
      await api.farmerResponseReturn(caseId, { farmer_response: responseText });
      setActiveCaseId(null);
      setResponseText('');
      fetchReturns();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900">Returns & Replacements (Section 29 & 30)</h2>
        <p className="text-xs text-slate-500">
          Escrow dispute resolution, photographic damage evidence, and impartial administrative settlements
        </p>
      </div>

      <div className="space-y-4">
        {returnsList.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-slate-400 text-xs">
            No return or replacement disputes recorded against your farm. 100% clean quality record!
          </div>
        ) : (
          returnsList.map((ret) => (
            <div
              key={ret.id}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-slate-900">{ret.return_code}</span>
                    <span className="text-xs text-slate-400 font-mono">Original Order: {ret.order_code}</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mt-1">{ret.buyer_company}</h4>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Admin Decision:</span>
                  <StatusBadge status={ret.admin_decision || 'Pending Review'} size="xs" />
                  <StatusBadge status={ret.resolution_status} size="xs" />
                </div>
              </div>

              {/* Issue Description Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-100">
                  <span className="text-rose-800 font-semibold text-[11px]">Reported Issue</span>
                  <div className="font-bold text-rose-950 mt-0.5">{ret.reason}</div>
                  <p className="text-[11px] text-rose-800/80 mt-1 leading-relaxed">{ret.description}</p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-slate-400 font-medium text-[11px]">Claimed Disputed Quantity</span>
                  <div className="font-bold text-slate-900 mt-0.5">{ret.requested_qty_kg} kg</div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Order total: {Number(ret.agreed_qty_kg).toLocaleString()} kg ({ret.crop_name})
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-emerald-800 font-semibold text-[11px]">Final Settlement Decision</span>
                  <div className="font-bold text-emerald-950 mt-0.5">{ret.admin_decision}</div>
                  <p className="text-[10px] text-emerald-700 mt-1">
                    Resolution Status: <strong>{ret.resolution_status}</strong>
                  </p>
                </div>
              </div>

              {/* Farmer Response Block */}
              {ret.farmer_response ? (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div className="font-semibold text-slate-700">Your Response to Buyer:</div>
                  <p className="text-slate-600 mt-0.5">{ret.farmer_response}</p>
                </div>
              ) : (
                <div className="pt-1">
                  {activeCaseId === ret.id ? (
                    <form onSubmit={(e) => handleSendResponse(e, ret.id)} className="flex gap-2">
                      <input
                        type="text"
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Type reply or propose resolution..."
                        className="flex-1 text-xs p-2.5 border border-slate-300 rounded-xl focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs"
                      >
                        Submit Reply
                      </button>
                    </form>
                  ) : (
                    <button
                      onClick={() => setActiveCaseId(ret.id)}
                      className="text-xs font-bold text-emerald-700 hover:underline"
                    >
                      + Respond to Return Notice
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
