/** Recommended photo angles per ERP asset class (V6 capture guidance). */

const DEFAULT_ANGLES = [
  {
    id: 'front',
    label: 'Front / primary face',
    hint: 'Main identifying side of the asset',
  },
  {
    id: 'tag_closeup',
    label: 'Tag close-up',
    hint: 'Asset tag or barcode readable',
  },
  {
    id: 'damage_closeup',
    label: 'Damage close-up',
    hint: 'Worst visible defect, if any',
  },
  {
    id: 'context_wide',
    label: 'Context wide shot',
    hint: 'Asset in its environment or mounting',
  },
];

const CATEGORY_OVERRIDES = {
  hvac: [
    {
      id: 'front',
      label: 'Indoor unit or condenser face',
      hint: 'Nameplate or grille side',
    },
    {
      id: 'tag_closeup',
      label: 'Service label close-up',
      hint: 'Usually on indoor side panel or outdoor chassis',
    },
    {
      id: 'damage_closeup',
      label: 'Damage / rust close-up',
      hint: 'Fins, filters, or mounting rust',
    },
    {
      id: 'context_wide',
      label: 'Installation wide shot',
      hint: 'Indoor + outdoor or room context',
    },
  ],
  itequipment: [
    {
      id: 'front',
      label: 'Screen or control panel',
      hint: 'Lid, monitor face, or printer panel',
    },
    {
      id: 'tag_closeup',
      label: 'Asset sticker close-up',
      hint: 'Bottom chassis, rear label, or side barcode',
    },
    {
      id: 'damage_closeup',
      label: 'Damage close-up',
      hint: 'Screen crack, port damage, or wear',
    },
    {
      id: 'context_wide',
      label: 'Desk / rack context',
      hint: 'Asset in workspace',
    },
  ],
  furniture: [
    {
      id: 'front',
      label: 'Primary use face',
      hint: 'Seat, desk top, or cabinet front',
    },
    {
      id: 'tag_closeup',
      label: 'Underside / rear tag',
      hint: 'Frame or manufacturer sticker',
    },
    {
      id: 'damage_closeup',
      label: 'Wear or damage close-up',
      hint: 'Scratches, tears, or structural issues',
    },
    {
      id: 'context_wide',
      label: 'Room context',
      hint: 'Furniture in setting',
    },
  ],
  vehicle: [
    {
      id: 'front',
      label: 'Front 3/4 or plate area',
      hint: 'Identifying front angle',
    },
    {
      id: 'tag_closeup',
      label: 'Fleet / registration sticker',
      hint: 'Asset label or registration area',
    },
    {
      id: 'damage_closeup',
      label: 'Panel or underbody damage',
      hint: 'Dents, rust, or tire wear',
    },
    {
      id: 'context_wide',
      label: 'Parking / site context',
      hint: 'Vehicle in environment',
    },
  ],
  industrial: [
    {
      id: 'front',
      label: 'Control panel / nameplate',
      hint: 'Primary operational face',
    },
    {
      id: 'tag_closeup',
      label: 'Chassis serial plate',
      hint: 'Engraved or metal nameplate',
    },
    {
      id: 'damage_closeup',
      label: 'Leak / rust / guard damage',
      hint: 'Functional concerns',
    },
    {
      id: 'context_wide',
      label: 'Site installation',
      hint: 'Generator or machine in place',
    },
  ],
};

function normCategoryKey(category, subcategory) {
  const raw = `${category || ''} ${subcategory || ''}`.toLowerCase();
  if (/hvac|split ac|window ac|cooler|air condition/.test(raw)) return 'hvac';
  if (/laptop|desktop|printer|display|monitor|it equipment|it assets|computer|macbook/.test(raw)) {
    return 'itequipment';
  }
  if (/furniture|chair|desk|cabinet|godrej/.test(raw)) return 'furniture';
  if (/vehicle|car|nexon|fleet|automobile/.test(raw)) return 'vehicle';
  if (/industrial|generator|cummins|machine/.test(raw)) return 'industrial';
  return null;
}

/**
 * @param {{ category?: string, subcategory?: string }} ctx
 * @returns {{ id: string, label: string, hint: string }[]}
 */
export function getAngleChecklist(ctx) {
  const key = normCategoryKey(ctx?.category, ctx?.subcategory);
  return CATEGORY_OVERRIDES[key] || DEFAULT_ANGLES;
}
