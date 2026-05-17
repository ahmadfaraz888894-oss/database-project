/**
 * Property type definitions for Pakistani context.
 * Each type has its own fields, units, and display format.
 */

export const PROPERTY_TYPES = {
  land: {
    label: 'Land / Plot',
    icon: '🌾',
    color: '#6b7a5a',
    subtypes: ['Residential', 'Agricultural', 'Commercial', 'Industrial'],
    units: ['marla', 'kanal', 'acre', 'sq_ft', 'sq_yard'],
    defaultUnit: 'marla',
    hasArea: true,
  },
  house: {
    label: 'House / Building',
    icon: '🏠',
    color: '#b85c3a',
    subtypes: ['Single Story', 'Double Story', 'Apartment', 'Flat', 'Bungalow', 'Commercial Building'],
    units: ['marla', 'kanal', 'sq_ft', 'sq_yard'],
    defaultUnit: 'marla',
    hasArea: true,
  },
  gold: {
    label: 'Gold / Jewelry',
    icon: '✦',
    color: '#a8884b',
    subtypes: ['24 Karat', '22 Karat', '21 Karat', '18 Karat', 'Silver', 'Diamond Jewelry'],
    units: ['tola', 'gram', 'ounce'],
    defaultUnit: 'tola',
    hasWeight: true,
  },
  cash: {
    label: 'Cash / Bank Account',
    icon: '💰',
    color: '#2d3a2e',
    subtypes: ['Savings Account', 'Current Account', 'Fixed Deposit', 'Cash at Home', 'Foreign Currency'],
  },
  vehicle: {
    label: 'Vehicle',
    icon: '🚗',
    color: '#1a1614',
    subtypes: ['Car', 'Motorcycle', 'Truck', 'Tractor', 'Rickshaw', 'Bus'],
    hasVehicle: true,
  },
  business: {
    label: 'Business / Shop',
    icon: '🏢',
    color: '#6b7a5a',
    subtypes: ['Shop', 'Factory', 'Restaurant', 'Service Business', 'Partnership', 'Sole Proprietorship'],
    hasOwnership: true,
  },
  investment: {
    label: 'Investments',
    icon: '📈',
    color: '#a8884b',
    subtypes: ['Stocks / Shares', 'Mutual Funds', 'Sukuk (Islamic Bonds)', 'Prize Bonds', 'National Savings'],
    hasQuantity: true,
  },
  livestock: {
    label: 'Livestock',
    icon: '🐄',
    color: '#6b7a5a',
    subtypes: ['Cattle (cow/buffalo)', 'Goats / Sheep', 'Poultry', 'Other'],
    hasQuantity: true,
  },
  valuable: {
    label: 'Personal Valuables',
    icon: '🛋️',
    color: '#b85c3a',
    subtypes: ['Furniture', 'Antiques', 'Art / Paintings', 'Electronics', 'Carpets / Rugs', 'Other'],
  },
  receivable: {
    label: 'Money Owed to Deceased',
    icon: '💳',
    color: '#2d3a2e',
    subtypes: ['Personal Loan', 'Business Receivable', 'Rent Owed', 'Other'],
  },
  other: {
    label: 'Other',
    icon: '◇',
    color: '#1a1614',
    subtypes: [],
  },
};

export const AREA_UNITS = {
  marla: { label: 'Marla', toSqFt: 272.25 },
  kanal: { label: 'Kanal', toSqFt: 5445 },
  acre: { label: 'Acre', toSqFt: 43560 },
  sq_ft: { label: 'Sq Ft', toSqFt: 1 },
  sq_yard: { label: 'Sq Yard', toSqFt: 9 },
};

export const WEIGHT_UNITS = {
  tola: { label: 'Tola', toGram: 11.6638 },
  gram: { label: 'Gram', toGram: 1 },
  ounce: { label: 'Ounce', toGram: 28.3495 },
};

/**
 * Format property details into a human-readable summary
 */
export function formatPropertyDetails(prop) {
  const parts = [];
  if (prop.subtype) parts.push(prop.subtype);
  if (prop.areaValue && prop.areaUnit) {
    parts.push(`${prop.areaValue} ${AREA_UNITS[prop.areaUnit]?.label || prop.areaUnit}`);
  }
  if (prop.weightValue && prop.weightUnit) {
    parts.push(`${prop.weightValue} ${WEIGHT_UNITS[prop.weightUnit]?.label || prop.weightUnit}`);
  }
  if (prop.quantity) parts.push(`Qty: ${prop.quantity}`);
  if (prop.make || prop.model) {
    parts.push([prop.make, prop.model, prop.year].filter(Boolean).join(' '));
  }
  if (prop.regNumber) parts.push(`Reg# ${prop.regNumber}`);
  if (prop.ownership && prop.ownership < 100) parts.push(`${prop.ownership}% owned`);
  return parts.filter(Boolean).join(' · ');
}

export function getPropertyIcon(type) {
  return PROPERTY_TYPES[type]?.icon || '◇';
}

export function getPropertyLabel(type) {
  return PROPERTY_TYPES[type]?.label || 'Property';
}

export function getPropertyColor(type) {
  return PROPERTY_TYPES[type]?.color || '#1a1614';
}
