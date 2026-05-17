'use client';
import { useState } from 'react';
import { PROPERTY_TYPES, AREA_UNITS, WEIGHT_UNITS } from '@/lib/propertyTypes';

export default function PropertyForm({ familyId, persons, onClose, onSaved }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('land');
  const [subtype, setSubtype] = useState('');
  const [value, setValue] = useState('');
  const [currency, setCurrency] = useState('PKR');
  const [ownerId, setOwnerId] = useState(persons[0]?.id || '');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  // Type-specific
  const [areaValue, setAreaValue] = useState('');
  const [areaUnit, setAreaUnit] = useState('marla');
  const [weightValue, setWeightValue] = useState('');
  const [weightUnit, setWeightUnit] = useState('tola');
  const [quantity, setQuantity] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [ownership, setOwnership] = useState('100');

  // Deductions
  const [debts, setDebts] = useState('0');
  const [funeralCost, setFuneralCost] = useState('0');
  const [bequest, setBequest] = useState('0');
  const [saving, setSaving] = useState(false);

  const typeConfig = PROPERTY_TYPES[type];

  // Reset subtype when type changes
  function handleTypeChange(newType) {
    setType(newType);
    setSubtype('');
    if (PROPERTY_TYPES[newType].hasArea) setAreaUnit(PROPERTY_TYPES[newType].defaultUnit || 'marla');
    if (PROPERTY_TYPES[newType].hasWeight) setWeightUnit(PROPERTY_TYPES[newType].defaultUnit || 'tola');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        familyId, ownerId, name, type, subtype, value, currency, location, description,
        areaValue: typeConfig.hasArea ? areaValue : null,
        areaUnit: typeConfig.hasArea ? areaUnit : null,
        weightValue: typeConfig.hasWeight ? weightValue : null,
        weightUnit: typeConfig.hasWeight ? weightUnit : null,
        quantity: typeConfig.hasQuantity ? quantity : null,
        make: typeConfig.hasVehicle ? make : null,
        model: typeConfig.hasVehicle ? model : null,
        year: typeConfig.hasVehicle ? year : null,
        regNumber: typeConfig.hasVehicle ? regNumber : null,
        ownership: typeConfig.hasOwnership ? ownership : null,
        debts, funeralCost, bequest,
      };
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        onSaved();
        onClose();
      } else {
        const err = await res.json();
        alert('Error: ' + (err.error || 'Failed to save'));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-cream w-full max-w-3xl my-8 max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <h3 className="display-font text-3xl mb-6">Add Property / Asset</h3>

          {/* Type selector grid */}
          <div className="mb-6">
            <label className="label">Property Type</label>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-2">
              {Object.entries(PROPERTY_TYPES).map(([k, t]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleTypeChange(k)}
                  className={`p-3 border text-left transition-all ${
                    type === k ? 'border-ink bg-ink text-cream' : 'border-black/15 hover:border-ink/40'
                  }`}
                >
                  <div className="text-xl mb-1">{t.icon}</div>
                  <div className="text-xs font-medium leading-tight">{t.label}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Basic info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Property Name</label>
                <input required type="text" className="input"
                       placeholder={
                         type === 'land' ? 'e.g., Plot in Bahria Town' :
                         type === 'gold' ? 'e.g., Wedding jewelry set' :
                         type === 'cash' ? 'e.g., HBL Savings Account' :
                         type === 'vehicle' ? 'e.g., White Corolla' :
                         'Property name'
                       }
                       value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className="label">Owner</label>
                <select required className="input" value={ownerId} onChange={e => setOwnerId(e.target.value)}>
                  <option value="">— Select owner —</option>
                  {persons.map(p => (
                    <option key={p.id} value={p.id}>{p.fullName}{!p.isAlive ? ' ✝' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subtype selector */}
            {typeConfig.subtypes && typeConfig.subtypes.length > 0 && (
              <div>
                <label className="label">Sub-type</label>
                <select className="input" value={subtype} onChange={e => setSubtype(e.target.value)}>
                  <option value="">— Select sub-type (optional) —</option>
                  {typeConfig.subtypes.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
            )}

            {/* Land/House: area */}
            {typeConfig.hasArea && (
              <div className="card p-4 bg-sage/5 border border-sage/20">
                <div className="text-xs tracking-wider uppercase text-sage font-semibold mb-3">📐 Area Details</div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="label">Area</label>
                    <input type="number" step="0.01" className="input" placeholder="e.g., 10"
                           value={areaValue} onChange={e => setAreaValue(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Unit</label>
                    <select className="input" value={areaUnit} onChange={e => setAreaUnit(e.target.value)}>
                      {typeConfig.units.map(u => (
                        <option key={u} value={u}>{AREA_UNITS[u]?.label || u}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Gold: weight + karat */}
            {typeConfig.hasWeight && (
              <div className="card p-4 bg-gold/10 border border-gold/30">
                <div className="text-xs tracking-wider uppercase text-gold font-semibold mb-3">⚖ Weight Details</div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="label">Weight</label>
                    <input type="number" step="0.001" className="input" placeholder="e.g., 5.5"
                           value={weightValue} onChange={e => setWeightValue(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Unit</label>
                    <select className="input" value={weightUnit} onChange={e => setWeightUnit(e.target.value)}>
                      {typeConfig.units.map(u => (
                        <option key={u} value={u}>{WEIGHT_UNITS[u]?.label || u}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Quantity (livestock, investments) */}
            {typeConfig.hasQuantity && (
              <div className="card p-4 bg-sage/5 border border-sage/20">
                <div className="text-xs tracking-wider uppercase text-sage font-semibold mb-3">🔢 Quantity</div>
                <div>
                  <label className="label">
                    {type === 'livestock' ? 'Number of animals' :
                     type === 'investment' ? 'Number of units / shares' :
                     'Quantity'}
                  </label>
                  <input type="number" step="0.01" className="input"
                         value={quantity} onChange={e => setQuantity(e.target.value)} />
                </div>
              </div>
            )}

            {/* Vehicle details */}
            {typeConfig.hasVehicle && (
              <div className="card p-4 bg-ink/5 border border-ink/15">
                <div className="text-xs tracking-wider uppercase font-semibold mb-3">🚗 Vehicle Details</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="label">Make</label>
                    <input type="text" className="input" placeholder="Toyota"
                           value={make} onChange={e => setMake(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Model</label>
                    <input type="text" className="input" placeholder="Corolla"
                           value={model} onChange={e => setModel(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Year</label>
                    <input type="number" className="input" placeholder="2018"
                           value={year} onChange={e => setYear(e.target.value)} />
                  </div>
                  <div className="col-span-2 md:col-span-3">
                    <label className="label">Registration Number</label>
                    <input type="text" className="input" placeholder="ABC-123"
                           value={regNumber} onChange={e => setRegNumber(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* Business ownership */}
            {typeConfig.hasOwnership && (
              <div className="card p-4 bg-terracotta/5 border border-terracotta/20">
                <div className="text-xs tracking-wider uppercase text-terracotta font-semibold mb-3">🏢 Business Details</div>
                <div>
                  <label className="label">Ownership Percentage (%)</label>
                  <input type="number" min="0" max="100" step="0.01" className="input"
                         value={ownership} onChange={e => setOwnership(e.target.value)} />
                </div>
              </div>
            )}

            {/* Value & currency - always */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="label">Total Monetary Value</label>
                <input required type="number" min="0" step="0.01" className="input"
                       placeholder="e.g., 5000000"
                       value={value} onChange={e => setValue(e.target.value)} />
              </div>
              <div>
                <label className="label">Currency</label>
                <select className="input" value={currency} onChange={e => setCurrency(e.target.value)}>
                  <option value="PKR">PKR (₨)</option>
                  <option value="USD">USD ($)</option>
                  <option value="SAR">SAR (﷼)</option>
                  <option value="AED">AED (د.إ)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            {/* Location & description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Location (optional)</label>
                <input type="text" className="input" placeholder="e.g., DHA Lahore"
                       value={location} onChange={e => setLocation(e.target.value)} />
              </div>
              <div>
                <label className="label">Description (optional)</label>
                <input type="text" className="input" placeholder="Brief description"
                       value={description} onChange={e => setDescription(e.target.value)} />
              </div>
            </div>

            {/* Deductions */}
            <details className="border border-black/10 p-4">
              <summary className="cursor-pointer text-xs tracking-wider uppercase opacity-70 font-semibold">
                ⚖ Deductions (debts, funeral, bequest) — optional
              </summary>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div>
                  <label className="label">Debts (₨)</label>
                  <input type="number" min="0" step="0.01" className="input"
                         value={debts} onChange={e => setDebts(e.target.value)} />
                </div>
                <div>
                  <label className="label">Funeral Cost (₨)</label>
                  <input type="number" min="0" step="0.01" className="input"
                         value={funeralCost} onChange={e => setFuneralCost(e.target.value)} />
                </div>
                <div>
                  <label className="label">Bequest (≤1/3)</label>
                  <input type="number" min="0" step="0.01" className="input"
                         value={bequest} onChange={e => setBequest(e.target.value)} />
                </div>
              </div>
              <div className="text-xs opacity-60 mt-3">
                Wasiyyah (bequest) is capped at 1/3 of the estate after debts/funeral, per Islamic law.
              </div>
            </details>

            <div className="flex gap-3 pt-4 border-t border-black/10">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving…' : 'Add Property'}
              </button>
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
