import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import toast from 'react-hot-toast';
import MapView from '../components/MapView';
import { MapPin, Navigation, Package, Clock, Zap, CreditCard, Banknote, Wallet, ChevronRight } from 'lucide-react';
import AddressAutocomplete from "../components/AddressAutoComplete";

const VEHICLE_OPTIONS = [
  { type: 'BIKE', icon: '🏍️', label: 'Bike', capacity: 'Up to 5kg', features: ['Fastest', 'Small pkgs'] },
  { type: 'CAR', icon: '🚗', label: 'Car', capacity: 'Up to 20kg', features: ['Medium', 'Protected'] },
  { type: 'TRUCK', icon: '🚛', label: 'Truck', capacity: 'Heavy cargo', features: ['Large', 'Freight'] },
];

const PAYMENT_OPTIONS = [
  { method: 'CARD', icon: <CreditCard size={16} />, label: 'Card' },
  { method: 'CASH', icon: <Banknote size={16} />, label: 'Cash' },
  { method: 'WALLET', icon: <Wallet size={16} />, label: 'Wallet' },
];

const STEPS = ['Location', 'Vehicle', 'Details', 'Confirm'];

export default function BookPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropCoords, setDropCoords] = useState(null);
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  const [locationMode, setLocationMode] = useState('pickup'); // 'pickup' | 'drop'
  const [selectedVehicle, setSelectedVehicle] = useState('BIKE');
  const [estimates, setEstimates] = useState([]);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [packageWeight, setPackageWeight] = useState('');
  const [packageDesc, setPackageDesc] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [loading, setLoading] = useState(false);

  const handleMapClick = useCallback(({ lat, lng }) => {
    const coords = { lat, lng };
    const addr = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    if (locationMode === 'pickup') {
      setPickupCoords(coords);
      setPickupAddress(addr);
    } else {
      setDropCoords(coords);
      setDropAddress(addr);
    }
  }, [locationMode]);

  const fetchEstimates = async () => {
    if (!pickupCoords || !dropCoords) {
      toast.error('Please select both pickup and drop locations');
      return;
    }
    setLoadingEstimate(true);
    try {
      const { data } = await ordersAPI.estimateAll({
        pickupLat: pickupCoords.lat, pickupLng: pickupCoords.lng,
        dropLat: dropCoords.lat, dropLng: dropCoords.lng,
      });
      setEstimates(data);
      setStep(1);
    } catch (err) {
      toast.error('Could not fetch estimates');
    } finally {
      setLoadingEstimate(false);
    }
  };

  const getSelectedEstimate = () => estimates.find(e => e.vehicleType === selectedVehicle);

  const handleBook = async () => {
    setLoading(true);
    try {
      const { data } = await ordersAPI.create({
        pickupAddress, pickupLat: pickupCoords.lat, pickupLng: pickupCoords.lng,
        dropAddress, dropLat: dropCoords.lat, dropLng: dropCoords.lng,
        vehicleType: selectedVehicle, packageWeight, packageDesc, paymentMethod,
      });
      toast.success('🎉 Order placed! Finding your driver...');
      navigate(`/track/${data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const est = getSelectedEstimate();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', minHeight: '100vh' }}>
      {/* Left Panel */}
      <div style={{ padding: '32px 28px', background: 'var(--bg-card)', borderRight: '1px solid var(--bg-border)', overflowY: 'auto' }}>
        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', fontSize: 12, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: i < step ? 'var(--success)' : i === step ? 'var(--primary)' : 'var(--bg-border)',
                  color: i <= step ? 'white' : 'var(--text-muted)',
                }}>{i < step ? '✓' : i + 1}</div>
                <span style={{ fontSize: 12, color: i === step ? 'var(--text)' : 'var(--text-muted)', fontWeight: i === step ? 600 : 400 }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: i < step ? 'var(--success)' : 'var(--bg-border)', margin: '0 8px' }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 0: Location */}
        {step === 0 && (
          <div className="fade-in">
            <h2 style={{ fontSize: 22, fontFamily: 'Syne', fontWeight: 800, marginBottom: 6 }}>Where to?</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Click on the map or enter addresses below</p>

            {/* Mode toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {['pickup', 'drop'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setLocationMode(mode)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                    background: locationMode === mode ? (mode === 'pickup' ? 'rgba(0,229,153,0.15)' : 'var(--primary-glow)') : 'var(--bg-card2)',
                    color: locationMode === mode ? (mode === 'pickup' ? 'var(--success)' : 'var(--primary)') : 'var(--text-muted)',
                    border: `1px solid ${locationMode === mode ? (mode === 'pickup' ? 'rgba(0,229,153,0.3)' : 'rgba(255,77,0,0.3)') : 'var(--bg-border)'}`,
                    transition: 'all 0.2s',
                  }}
                >
                  {mode === 'pickup' ? '📦 Pickup' : '🎯 Drop-off'}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} /> Pickup Location
                </label>
                {/* <input
                  className="input"
                  value={pickupAddress}
                  onChange={e => setPickupAddress(e.target.value)}
                  placeholder="Click on map or type address..."
                  style={{ fontSize: 13 }}
                /> */}
                <AddressAutocomplete
                  value={pickupAddress}
                  placeholder="Search pickup location..."
                  onSelect={(place) => {
                    setPickupAddress(place.address);
                    setPickupCoords({ lat: place.lat, lng: place.lng });
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} /> Drop-off Location
                </label>
                {/* <input
                  className="input"
                  value={dropAddress}
                  onChange={e => setDropAddress(e.target.value)}
                  placeholder="Click on map or type address..."
                  style={{ fontSize: 13 }}
                /> */}
                <AddressAutocomplete
                  value={dropAddress}
                  placeholder="Search drop location..."
                  onSelect={(place) => {
                    setDropAddress(place.address);
                    setDropCoords({ lat: place.lat, lng: place.lng });
                  }}
                />
              </div>
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={fetchEstimates}
              disabled={!pickupCoords || !dropCoords || loadingEstimate}
            >
              {loadingEstimate ? <span className="spinner" /> : <><Zap size={16} /> Get Estimates</>}
            </button>

            {(!pickupCoords || !dropCoords) && (
              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
                📍 Click on the map to set {!pickupCoords ? 'pickup' : 'drop-off'} location
              </p>
            )}
          </div>
        )}

        {/* Step 1: Vehicle */}
        {step === 1 && (
          <div className="fade-in">
            <h2 style={{ fontSize: 22, fontFamily: 'Syne', fontWeight: 800, marginBottom: 6 }}>Choose Vehicle</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
              {estimates[0]?.distanceKm}km · Prices include current surges
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {VEHICLE_OPTIONS.map(v => {
                const e = estimates.find(est => est.vehicleType === v.type);
                const isSelected = selectedVehicle === v.type;
                return (
                  <button
                    key={v.type}
                    onClick={() => setSelectedVehicle(v.type)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '16px', borderRadius: 14, textAlign: 'left',
                      background: isSelected ? 'var(--primary-glow)' : 'var(--bg-card2)',
                      border: `1px solid ${isSelected ? 'rgba(255,77,0,0.4)' : 'var(--bg-border)'}`,
                      transition: 'all 0.2s', cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: 32 }}>{v.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: isSelected ? 'var(--primary)' : 'var(--text)', marginBottom: 2 }}>{v.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 8 }}>
                        {v.features.map(f => <span key={f}>{f}</span>)}
                        · {v.capacity}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: isSelected ? 'var(--primary)' : 'var(--text)' }}>
                        ₹{e?.totalCost || '--'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                        <Clock size={10} /> {e?.estimatedTime || '--'} min
                      </div>
                    </div>
                    {isSelected && <ChevronRight size={16} color="var(--primary)" />}
                  </button>
                );
              })}
            </div>

            {/* Surge info */}
            {est && (est.surgeMultiplier > 1 || est.seasonMultiplier > 1) && (
              <div style={{ background: 'rgba(255,77,0,0.08)', border: '1px solid rgba(255,77,0,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: 'var(--text-dim)' }}>
                <Zap size={12} style={{ display: 'inline', marginRight: 6, color: 'var(--primary)' }} />
                {est.surgeMultiplier > 1 && `${est.surgeMultiplier}x surge`}
                {est.surgeMultiplier > 1 && est.seasonMultiplier > 1 && ' · '}
                {est.seasonMultiplier > 1 && `${est.seasonMultiplier}x season`}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStep(0)}>Back</button>
              <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={() => setStep(2)}>
                Continue <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Package Details */}
        {step === 2 && (
          <div className="fade-in">
            <h2 style={{ fontSize: 22, fontFamily: 'Syne', fontWeight: 800, marginBottom: 6 }}>Package Details</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Tell us about your package</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 6, display: 'block', fontWeight: 500 }}>
                  <Package size={13} style={{ display: 'inline', marginRight: 6 }} />Weight (kg)
                </label>
                <input className="input" type="number" placeholder="e.g. 2.5" value={packageWeight} onChange={e => setPackageWeight(e.target.value)} min="0.1" step="0.1" />
              </div>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 6, display: 'block', fontWeight: 500 }}>
                  Description (optional)
                </label>
                <textarea
                  className="input"
                  placeholder="e.g. Electronics, fragile. Handle with care."
                  value={packageDesc}
                  onChange={e => setPackageDesc(e.target.value)}
                  style={{ height: 80, resize: 'vertical' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 8, display: 'block', fontWeight: 500 }}>Payment Method</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {PAYMENT_OPTIONS.map(p => (
                    <button
                      key={p.method}
                      onClick={() => setPaymentMethod(p.method)}
                      style={{
                        flex: 1, padding: '10px 8px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        background: paymentMethod === p.method ? 'var(--primary-glow)' : 'var(--bg-card2)',
                        color: paymentMethod === p.method ? 'var(--primary)' : 'var(--text-muted)',
                        border: `1px solid ${paymentMethod === p.method ? 'rgba(255,77,0,0.3)' : 'var(--bg-border)'}`,
                        transition: 'all 0.2s',
                      }}
                    >
                      {p.icon}
                      <span style={{ fontSize: 12 }}>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStep(1)}>Back</button>
              <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={() => setStep(3)}>
                Review Order <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && est && (
          <div className="fade-in">
            <h2 style={{ fontSize: 22, fontFamily: 'Syne', fontWeight: 800, marginBottom: 20 }}>Confirm Order</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {/* Route summary */}
              <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--bg-border)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Pickup</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{pickupAddress}</div>
                  </div>
                </div>
                <div style={{ width: 1, height: 16, background: 'var(--bg-border)', marginLeft: 3.5, marginBottom: 10 }} />
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Drop-off</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{dropAddress}</div>
                  </div>
                </div>
              </div>

              {/* Cost breakdown */}
              <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--bg-border)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Cost Breakdown</div>
                {[
                  ['Base Fare', `₹${est.baseCost}`],
                  est.surgeMultiplier > 1 && [`Surge (${est.surgeMultiplier}x)`, `+${Math.round((est.surgeMultiplier - 1) * 100)}%`],
                  est.seasonMultiplier > 1 && [`Season (${est.seasonMultiplier}x)`, `+${Math.round((est.seasonMultiplier - 1) * 100)}%`],
                ].filter(Boolean).map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                    <span style={{ color: 'var(--text-dim)' }}>{label}</span>
                    <span>{val}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid var(--bg-border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16 }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--primary)' }}>₹{est.totalCost}</span>
                </div>
              </div>

              {/* Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  ['🚗 Vehicle', VEHICLE_OPTIONS.find(v => v.type === selectedVehicle)?.label],
                  ['⏱️ ETA', `${est.estimatedTime} min`],
                  ['📏 Distance', `${est.distanceKm} km`],
                  ['💳 Payment', paymentMethod],
                ].map(([label, val]) => (
                  <div key={label} style={{ background: 'var(--bg-card2)', border: '1px solid var(--bg-border)', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStep(2)}>Back</button>
              <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={handleBook} disabled={loading}>
                {loading ? <span className="spinner" /> : <>🚀 Place Order · ₹{est.totalCost}</>}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Map Panel */}
      <div style={{ position: 'sticky', top: 0, height: '100vh' }}>
        <MapView
          pickupCoords={pickupCoords}
          dropCoords={dropCoords}
          center={
            locationMode === "pickup"
              ? pickupCoords
              : dropCoords
          }
          height="100%"
          onMapClick={step === 0 ? handleMapClick : undefined}
        />
        {step === 0 && (
          <div style={{
            position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--bg-card)', border: '1px solid var(--bg-border)',
            borderRadius: 100, padding: '8px 20px', fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 8, boxShadow: 'var(--shadow)',
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: locationMode === 'pickup' ? 'var(--success)' : 'var(--primary)', animation: 'pulse-ring 1.5s infinite' }} />
            Setting {locationMode === 'pickup' ? 'Pickup' : 'Drop-off'} — Click on map
          </div>
        )}
      </div>
    </div>
  );
}
