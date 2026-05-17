/**
 * PROPERTY-LEVEL DISTRIBUTION
 *
 * The base calculator returns each heir's share as a fraction & rupee amount.
 * This module takes those shares and computes per-property breakdowns:
 *
 * e.g. if Father has:
 *   - 10 kanal of land worth ₨5M
 *   - 50 tola of gold worth ₨2M
 *   - ₨3M cash
 *
 * And Son inherits 7/12 of the estate, then Son gets:
 *   - 5.833 kanal of land (7/12 of 10 kanal)
 *   - 29.167 tola of gold
 *   - ₨1,750,000 cash
 *
 * This is the way real Pakistani families want to see inheritance.
 */

import { AREA_UNITS, WEIGHT_UNITS, PROPERTY_TYPES } from '../propertyTypes.js';

/**
 * For each property, compute each heir's portion in:
 *  - native unit (kanal, tola, etc.)
 *  - monetary value
 *  - count (for indivisible items like vehicles, businesses, livestock)
 *
 * @param {Array} properties - All properties of the deceased
 * @param {Array} heirShares - Shares from the calculator (with fractionDecimal)
 * @returns {Array} per-property breakdown
 */
export function distributeProperties(properties, heirShares) {
  if (!properties || properties.length === 0) return [];
  if (!heirShares || heirShares.length === 0) return [];

  const breakdown = [];

  for (const prop of properties) {
    const propConfig = PROPERTY_TYPES[prop.type] || PROPERTY_TYPES.other;
    const allocations = [];

    for (const share of heirShares) {
      const fraction = share.fractionDecimal || 0;
      if (fraction <= 0) continue;

      const allocation = {
        heirId: share.personId,
        heirName: share.name,
        relationship: share.relationship,
        fraction,
        percentage: (fraction * 100).toFixed(4),
        monetaryAmount: prop.value * fraction,
      };

      // Land/house — split in native area unit
      if (propConfig.hasArea && prop.areaValue && prop.areaUnit) {
        allocation.areaValue = prop.areaValue * fraction;
        allocation.areaUnit = prop.areaUnit;
        allocation.areaUnitLabel = AREA_UNITS[prop.areaUnit]?.label || prop.areaUnit;
      }

      // Gold/jewelry — split in native weight unit
      if (propConfig.hasWeight && prop.weightValue && prop.weightUnit) {
        allocation.weightValue = prop.weightValue * fraction;
        allocation.weightUnit = prop.weightUnit;
        allocation.weightUnitLabel = WEIGHT_UNITS[prop.weightUnit]?.label || prop.weightUnit;
      }

      // Livestock/investments — split quantity
      if (propConfig.hasQuantity && prop.quantity) {
        allocation.quantity = prop.quantity * fraction;
      }

      // Vehicle/business — indivisible (typically); flag for special handling
      if (propConfig.hasVehicle || prop.type === 'vehicle') {
        allocation.indivisible = true;
        allocation.note = `Indivisible asset — typically sold and proceeds split, or one heir takes it and compensates others (₨${Math.round(allocation.monetaryAmount).toLocaleString()})`;
      }

      // Business with ownership %
      if (propConfig.hasOwnership && prop.ownership) {
        allocation.ownershipPercent = prop.ownership * fraction;
        allocation.ownershipNote = `${allocation.ownershipPercent.toFixed(2)}% of the business`;
      }

      allocations.push(allocation);
    }

    breakdown.push({
      property: {
        id: prop.id,
        name: prop.name,
        type: prop.type,
        subtype: prop.subtype,
        value: prop.value,
        currency: prop.currency || 'PKR',
        location: prop.location,
        // Original totals (for display)
        totalArea: prop.areaValue ? { value: prop.areaValue, unit: prop.areaUnit } : null,
        totalWeight: prop.weightValue ? { value: prop.weightValue, unit: prop.weightUnit } : null,
        totalQuantity: prop.quantity || null,
        ownership: prop.ownership || null,
        make: prop.make, model: prop.model, year: prop.year, regNumber: prop.regNumber,
      },
      allocations,
    });
  }

  return breakdown;
}

/**
 * Format an allocation into a human-readable summary
 * e.g. "5.83 Kanal · ₨5,833,333"
 */
export function formatAllocation(allocation) {
  const parts = [];
  if (allocation.areaValue) {
    parts.push(`${allocation.areaValue.toFixed(3)} ${allocation.areaUnitLabel}`);
  }
  if (allocation.weightValue) {
    parts.push(`${allocation.weightValue.toFixed(3)} ${allocation.weightUnitLabel}`);
  }
  if (allocation.quantity) {
    parts.push(`${allocation.quantity.toFixed(2)} units`);
  }
  if (allocation.ownershipPercent) {
    parts.push(`${allocation.ownershipPercent.toFixed(2)}% ownership`);
  }
  parts.push(`₨${Math.round(allocation.monetaryAmount).toLocaleString()}`);
  return parts.join(' · ');
}
