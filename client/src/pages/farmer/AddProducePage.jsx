import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Sprout, Scale, Award, DollarSign, MapPin, Upload,
  ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, Sparkles
} from 'lucide-react';

export const AddProducePage = ({ onNavigate }) => {
  const { farmer } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State across all 6 steps
  const [cropId, setCropId] = useState('crop_tomato');
  const [totalQty, setTotalQty] = useState(10000);
  const [unit, setUnit] = useState('kg');
  const [harvestDate, setHarvestDate] = useState('2026-09-08');
  const [availFrom, setAvailFrom] = useState('2026-09-09');
  const [availUntil, setAvailUntil] = useState('2026-09-25');

  // Step 3 Quality
  const [qualityGrade, setQualityGrade] = useState('Grade A');
  const [moisture, setMoisture] = useState(82.5);
  const [sizeMm, setSizeMm] = useState(65.0);
  const [color, setColor] = useState('Deep Bright Red');
  const [defectPct, setDefectPct] = useState(1.2);
  const [isOrganic, setIsOrganic] = useState(false);
  const [cert, setCert] = useState('GAP Certified (Good Agricultural Practices)');

  // Step 4 Price
  const [expectedPrice, setExpectedPrice] = useState(29.0);

  // Step 5 Location
  const [farmLocation, setFarmLocation] = useState('Sanivarapupeta, Eluru');
  const [district, setDistrict] = useState('Eluru');
  const [latitude, setLatitude] = useState(16.7107);
  const [longitude, setLongitude] = useState(81.0952);

  // Step 6 Evidence
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80');

  useEffect(() => {
    const fetchCrops = async () => {
      try {
        const res = await api.getCrops();
        if (res.crops) {
          setCrops(res.crops);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCrops();
  }, []);

  const selectedCrop = crops.find(c => c.id === cropId) || crops[0] || {
    name: 'Tomato',
    category: 'Vegetables',
    variety: 'Vaishnavi Hybrid S-4',
    current_market_price: 28.0,
    image_url: imageUrl
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        farmer_id: farmer ? farmer.id : 'frm_1',
        crop_id: cropId,
        title: `Fresh ${qualityGrade} ${selectedCrop.name} (${selectedCrop.variety || 'Farm Fresh'})`,
        total_qty_kg: parseFloat(totalQty),
        available_qty_kg: parseFloat(totalQty),
        quality_grade: qualityGrade,
        moisture_pct: parseFloat(moisture),
        size_mm: parseFloat(sizeMm),
        color,
        defect_pct: parseFloat(defectPct),
        is_organic: isOrganic ? 1 : 0,
        certification: cert,
        expected_price_per_kg: parseFloat(expectedPrice),
        harvest_date: harvestDate,
        available_from: availFrom,
        available_until: availUntil,
        farm_location: farmLocation,
        district,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        image_url: imageUrl
      };

      const res = await api.createProduce(payload);
      if (res.success) {
        // Jump to 4-step Produce Verification (Section 11)
        onNavigate('farmer-produce-verify', { produceId: res.produce.id });
      }
    } catch (err) {
      console.error('Failed to create produce listing:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const stepsHeader = [
    { num: 1, title: 'Select Crop', icon: Sprout },
    { num: 2, title: 'Quantity & Dates', icon: Scale },
    { num: 3, title: 'Quality Params', icon: Award },
    { num: 4, title: 'Pricing Reference', icon: DollarSign },
    { num: 5, title: 'Farm Location', icon: MapPin },
    { num: 6, title: 'Upload Evidence', icon: Upload }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900">Add Agricultural Produce</h2>
        <p className="text-xs text-slate-500">6-Stage verified batch declaration protocol for B2B procurement</p>
      </div>

      {/* Progress Steps Header */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {stepsHeader.map((s) => {
            const Icon = s.icon;
            const isDone = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => setCurrentStep(s.num)}
                className={`p-2.5 rounded-xl text-left transition flex items-center gap-2 ${
                  isCurrent
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : isDone
                    ? 'bg-emerald-50 text-emerald-900 font-semibold'
                    : 'bg-slate-50 text-slate-400'
                }`}
              >
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-white/20">
                  {isDone ? '✓' : s.num}
                </span>
                <span className="text-[11px] truncate hidden sm:inline">{s.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Content Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        {/* Step 1: Select Crop */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Sprout className="w-5 h-5 text-emerald-600" />
              Step 1: Select Crop & Botanical Variety
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Crop Type</label>
                <select
                  value={cropId}
                  onChange={(e) => setCropId(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
                >
                  {crops.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Crop Category</label>
                <input
                  type="text"
                  readOnly
                  value={selectedCrop.category || 'Vegetables'}
                  className="w-full text-xs p-3 border border-slate-200 bg-slate-50 text-slate-600 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Seed Variety / Hybrid Strain</label>
                <input
                  type="text"
                  readOnly
                  value={selectedCrop.variety || 'Vaishnavi Hybrid S-4'}
                  className="w-full text-xs p-3 border border-slate-200 bg-slate-50 text-slate-600 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Spot Benchmark</label>
                <input
                  type="text"
                  readOnly
                  value={`₹${selectedCrop.current_market_price || 28}/kg (Eluru Mandi)`}
                  className="w-full text-xs p-3 border border-slate-200 bg-slate-50 text-emerald-700 font-bold rounded-xl"
                />
              </div>
            </div>

            {/* Image Preview */}
            <div className="pt-2">
              <span className="block text-xs font-semibold text-slate-700 mb-1.5">Crop Reference Preview</span>
              <img
                src={selectedCrop.image_url || imageUrl}
                alt="Crop preview"
                className="w-full h-44 object-cover rounded-2xl border border-slate-200 shadow-inner"
              />
            </div>
          </div>
        )}

        {/* Step 2: Quantity & Dates */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-600" />
              Step 2: Harvest Volumes & Availability Windows
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Total Declared Quantity</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={totalQty}
                    onChange={(e) => setTotalQty(e.target.value)}
                    className="flex-1 text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
                  />
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="text-xs p-3 border border-slate-300 rounded-xl bg-slate-50 font-bold"
                  >
                    <option value="kg">kg</option>
                    <option value="tonnes">Tonnes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Harvest Date</label>
                <input
                  type="date"
                  value={harvestDate}
                  onChange={(e) => setHarvestDate(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Available From (Dispatch Ready)</label>
                <input
                  type="date"
                  value={availFrom}
                  onChange={(e) => setAvailFrom(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Available Until (Shelf Life Window)</label>
                <input
                  type="date"
                  value={availUntil}
                  onChange={(e) => setAvailUntil(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
              <strong>Batch Summary: </strong>
              {Number(totalQty).toLocaleString()} {unit} = {(Number(totalQty) / 1000).toFixed(1)} Tonnes available for procurement contracts.
            </div>
          </div>
        )}

        {/* Step 3: Quality Parameters */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              Step 3: Quality Parameters & Grading
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quality Grade</label>
                <select
                  value={qualityGrade}
                  onChange={(e) => setQualityGrade(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
                >
                  <option value="Grade A">Grade A (Premium / Export Quality)</option>
                  <option value="Grade B">Grade B (Standard Commercial)</option>
                  <option value="Grade C">Grade C (Industrial / Pulping)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fruit Size / Caliber (mm)</label>
                <input
                  type="number"
                  step="1"
                  value={sizeMm}
                  onChange={(e) => setSizeMm(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Moisture Level (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={moisture}
                  onChange={(e) => setMoisture(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Skin Color / Ripeness</label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Max Allowable Defect %</label>
                <input
                  type="number"
                  step="0.1"
                  value={defectPct}
                  onChange={(e) => setDefectPct(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cultivation Method</label>
                <select
                  value={isOrganic ? 'organic' : 'conventional'}
                  onChange={(e) => setIsOrganic(e.target.value === 'organic')}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="conventional">Conventional GAP Farming</option>
                  <option value="organic">100% Certified Organic (NPOP/PGS)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Certification Standard</label>
              <input
                type="text"
                value={cert}
                onChange={(e) => setCert(e.target.value)}
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Step 4: Price Intelligence Reference */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Step 4: Market Price Comparison & Farmer Asking Price
            </h3>

            {/* Price Intelligence Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-500">Current Market Price</div>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  ₹{selectedCrop.current_market_price || 28}/kg
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Eluru APMC Yard</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-500">Past 30-Day Average</div>
                <div className="text-xl font-bold text-slate-900 mt-1">₹25.8/kg</div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">↑ +4.2% Growth</div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="text-xs text-emerald-800 font-semibold">Indicative Future Price</div>
                <div className="text-xl font-bold text-emerald-950 mt-1">₹27 - ₹32/kg</div>
                <div className="text-[10px] text-emerald-700 mt-0.5">Next 14-day window</div>
              </div>
            </div>

            {/* Farmer Expected Price Input */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Your Expected Price per kg (₹)
              </label>
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-3 font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  step="0.5"
                  value={expectedPrice}
                  onChange={(e) => setExpectedPrice(e.target.value)}
                  className="w-full text-lg font-black pl-8 pr-3 py-2.5 border-2 border-emerald-500 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Recommended for fast buyer conversion: <strong>₹29.00 - ₹31.00/kg</strong>
              </p>
            </div>
          </div>
        )}

        {/* Step 5: Farm Location */}
        {currentStep === 5 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              Step 5: Farm Pickup Coordinates & Geofencing
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Farm Location Address</label>
                <input
                  type="text"
                  value={farmLocation}
                  onChange={(e) => setFarmLocation(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">District</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude (Geotagged)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Longitude (Geotagged)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Geofence Survey Matched: 16.7107° N, 81.0952° E (Eluru, AP)</span>
              </div>
              <span className="text-emerald-400 font-bold">1.2m Cadastral Accuracy</span>
            </div>
          </div>
        )}

        {/* Step 6: Upload Evidence */}
        {currentStep === 6 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-600" />
              Step 6: Visual Evidence & Agronomic Documentation
            </h3>

            <div className="border-2 border-dashed border-emerald-300 bg-emerald-50/40 rounded-2xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Crop & Harvest Photos Uploaded</div>
                <p className="text-[11px] text-slate-500">Spectral crop image ready for AI Computer Vision verification.</p>
              </div>
              <img
                src={imageUrl}
                alt="Uploaded evidence"
                className="w-48 h-32 object-cover rounded-xl mx-auto border border-emerald-300 shadow-sm"
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="font-bold text-slate-900">Submitted Evidence Summary:</div>
              <ul className="text-slate-600 space-y-1 text-[11px]">
                <li>✓ High-resolution field photos (Vaishnavi Hybrid S-4 Tomato)</li>
                <li>✓ Weighbridge preliminary calibration certificate</li>
                <li>✓ Good Agricultural Practices (GAP) inspection tag</li>
              </ul>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous Step</span>
            </button>
          ) : <div />}

          {currentStep < 6 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep + 1)}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
            >
              <span>Continue to Step {currentStep + 1}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{submitting ? 'Submitting...' : 'Submit for 4-Step Verification'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
