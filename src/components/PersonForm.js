'use client';
import { useState } from 'react';

export default function PersonForm({ familyId, persons, onClose, onSaved, editPerson = null }) {
  const [fullName, setFullName] = useState(editPerson?.fullName || '');
  const [gender, setGender] = useState(editPerson?.gender || 'male');
  const [isAlive, setIsAlive] = useState(editPerson?.isAlive !== false);
  const [isMuslim, setIsMuslim] = useState(editPerson?.isMuslim !== false);
  const [birthDate, setBirthDate] = useState(editPerson?.birthDate ? editPerson.birthDate.slice(0, 10) : '');
  const [deathDate, setDeathDate] = useState(editPerson?.deathDate ? editPerson.deathDate.slice(0, 10) : '');
  const [fatherId, setFatherId] = useState(editPerson?.fatherId || '');
  const [motherId, setMotherId] = useState(editPerson?.motherId || '');
  const [spouseIds, setSpouseIds] = useState([]);
  const [saving, setSaving] = useState(false);

  const males = persons.filter(p => p.gender === 'male' && p.id !== editPerson?.id);
  const females = persons.filter(p => p.gender === 'female' && p.id !== editPerson?.id);
  const possibleSpouses = persons.filter(p => p.gender !== gender && p.id !== editPerson?.id);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        familyId, fullName, gender, isAlive, isMuslim,
        birthDate: birthDate || null,
        deathDate: deathDate || null,
        fatherId: fatherId || null,
        motherId: motherId || null,
        spouseIds,
      };
      const url = editPerson ? `/api/persons/${editPerson.id}` : '/api/persons';
      const method = editPerson ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        onSaved();
        onClose();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-cream w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <h3 className="display-font text-3xl mb-6">
            {editPerson ? 'Edit Person' : 'Add Person'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Full Name</label>
              <input required type="text" className="input" value={fullName} onChange={e => setFullName(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Gender</label>
                <select className="input" value={gender} onChange={e => setGender(e.target.value)}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="label">Status</label>
                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={isAlive} onChange={e => setIsAlive(e.target.checked)} />
                    Alive
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={isMuslim} onChange={e => setIsMuslim(e.target.checked)} />
                    Muslim
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Birth Date</label>
                <input type="date" className="input" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
              </div>
              <div>
                <label className="label">Date of Death</label>
                <input type="date" className="input" value={deathDate} onChange={e => setDeathDate(e.target.value)} disabled={isAlive} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Father</label>
                <select className="input" value={fatherId} onChange={e => setFatherId(e.target.value)}>
                  <option value="">— None —</option>
                  {males.map(p => (
                    <option key={p.id} value={p.id}>{p.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Mother</label>
                <select className="input" value={motherId} onChange={e => setMotherId(e.target.value)}>
                  <option value="">— None —</option>
                  {females.map(p => (
                    <option key={p.id} value={p.id}>{p.fullName}</option>
                  ))}
                </select>
              </div>
            </div>

            {!editPerson && possibleSpouses.length > 0 && (
              <div>
                <label className="label">Spouse(s) — hold Ctrl/Cmd to select multiple</label>
                <select
                  multiple
                  className="input min-h-[120px]"
                  value={spouseIds}
                  onChange={e => setSpouseIds(Array.from(e.target.selectedOptions, o => o.value))}
                >
                  {possibleSpouses.map(p => (
                    <option key={p.id} value={p.id}>{p.fullName}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving…' : editPerson ? 'Update' : 'Add Person'}
              </button>
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
