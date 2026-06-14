import { formatInr } from '../../v6/erpCatalog';

function Row({ label, value }) {
  if (value == null || value === '') return null;
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 py-2 text-sm last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium text-gray-900">{value}</span>
    </div>
  );
}

export function FarRegisterSummary({ asset }) {
  if (!asset) return null;

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
        Fixed Asset Register (FAR)
      </p>
      <p className="mt-1 text-xs text-slate-500">
        SLM depreciation as of {asset.far_as_of_date || '—'} · {asset.depreciation_method || 'SLM'}
      </p>
      <div className="mt-3 divide-y divide-gray-100 rounded-lg bg-white px-3">
        <Row label="Asset number" value={asset.asset_number || asset.asset_tag_number} />
        <Row label="Company / location code" value={`${asset.company_code || '—'} / ${asset.location_code || '—'}`} />
        <Row label="Cost center" value={asset.cost_center} />
        <Row label="GL asset / accum. dep." value={`${asset.gl_account_asset || '—'} / ${asset.gl_account_accum_dep || '—'}`} />
        <Row label="Capitalization date" value={asset.capitalization_date || asset.acquisition_date} />
        <Row label="Put in service" value={asset.put_in_service_date} />
        <Row label="Original cost" value={formatInr(asset.original_cost_inr)} />
        <Row label="Useful life" value={asset.useful_life_years != null ? `${asset.useful_life_years} years` : null} />
        <Row label="Annual depreciation" value={formatInr(asset.annual_depreciation_inr)} />
        <Row
          label="Accumulated depreciation"
          value={formatInr(asset.accumulated_depreciation_inr)}
        />
        <Row label="Residual (salvage)" value={formatInr(asset.residual_value_inr)} />
        <Row label="Book NBV today" value={formatInr(asset.book_nbv_inr)} />
        <Row
          label="Asset age"
          value={asset.asset_age_years != null ? `${asset.asset_age_years} years` : null}
        />
        <Row label="Status" value={asset.asset_status} />
      </div>
      {asset.far_price_basis && (
        <p className="mt-3 text-xs leading-relaxed text-slate-600">
          <span className="font-semibold text-slate-700">Price basis: </span>
          {asset.far_price_basis}
        </p>
      )}
    </div>
  );
}
