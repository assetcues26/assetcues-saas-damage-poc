import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, Upload, RefreshCw } from 'lucide-react';
import { CompactHeader } from '../../components/layout/AppHeader';
import { BackButton } from '../../components/ui/BackButton';
import { Button } from '@/components/ui/button';
import { Card } from '../../components/ui/Card';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { HeroSection } from '../../components/layout/HeroSection';
import { formatInr } from '../../v6/erpCatalog';
import { useErpCatalog } from '../../v6/useErpCatalog';
import { FarRegisterSummary } from '../../components/v6/FarRegisterSummary';
import { useV6 } from '../../hooks/useV6';
import { recomputeFar } from '../../v6/farCalculator';

/** Fields that, when changed, automatically re-derive all FAR figures. */
const FAR_DRIVERS = new Set(['acquisition_date', 'original_cost_inr', 'useful_life_years']);

const FIELDS = [
  { key: 'asset_name', label: 'Asset name', required: true },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'make', label: 'Make' },
  { key: 'model', label: 'Model' },
  { key: 'category', label: 'Category' },
  { key: 'subcategory', label: 'Subcategory' },
  { key: 'acquisition_date', label: 'Acquisition date', type: 'date', required: true },
  { key: 'original_cost_inr', label: 'Original cost (INR)', type: 'number', required: true },
  { key: 'useful_life_years', label: 'Useful life (years)', type: 'number' },
  { key: 'location', label: 'Location', required: true },
  { key: 'asset_tag_number', label: 'Asset tag number' },
];

export function V6AssetPage() {
  const { catalogId } = useParams();
  const navigate = useNavigate();
  const { editedContext, selectCatalogAsset, updateEditedContext } = useV6();
  const { getCatalogAsset, loading: catalogLoading } = useErpCatalog();
  const [error, setError] = useState(null);

  useEffect(() => {
    if (catalogLoading) return;
    const asset = getCatalogAsset(catalogId);
    if (!asset) {
      navigate('/v6', { replace: true });
      return;
    }
    selectCatalogAsset(asset);
  }, [catalogId, navigate, selectCatalogAsset, getCatalogAsset, catalogLoading]);

  /**
   * Handle field changes. When a FAR driver changes (date / cost / useful life),
   * recompute all SLM fields and merge them into the context so NBV, age,
   * annual depreciation, and accumulated depreciation update live.
   */
  const handleFieldChange = useCallback(
    (key, rawValue) => {
      const value = key === 'original_cost_inr' || key === 'useful_life_years'
        ? Number(rawValue)
        : rawValue;

      const next = { ...editedContext, [key]: value };

      if (FAR_DRIVERS.has(key)) {
        const far = recomputeFar(next);
        if (far) {
          updateEditedContext({ [key]: value, ...far });
          return;
        }
        updateEditedContext({
          [key]: value,
          book_nbv_inr: null,
          accumulated_depreciation_inr: null,
          annual_depreciation_inr: null,
          asset_age_years: null,
        });
        return;
      }
      updateEditedContext({ [key]: value });
    },
    [editedContext, updateEditedContext],
  );

  if (catalogLoading || !editedContext) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-gray-600">
        Loading asset…
      </div>
    );
  }

  const validate = () => {
    if (!editedContext.asset_name?.trim()) return 'Asset name is required';
    if (!editedContext.location?.trim()) return 'Location is required';
    if (!editedContext.acquisition_date) return 'Acquisition date is required';
    if (Number(editedContext.original_cost_inr) <= 0) return 'Original cost must be positive';
    return null;
  };

  const proceed = (path) => {
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    setError(null);
    navigate(path);
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-zinc-50">
      <div className="shrink-0">
        <CompactHeader
          title="ERP Asset"
          left={<BackButton label="Catalog" onClick={() => navigate('/v6')} />}
        />
      </div>

      <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        <HeroSection className="h-auto overflow-visible">
          <PageWrapper className="py-6 pb-8">
            <header className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">{editedContext.asset_name}</h1>
              <p className="mt-1 text-sm text-gray-600">
                Edit ERP payload sent with your photos. Book NBV {formatInr(editedContext.book_nbv_inr)} ·{' '}
                {editedContext.location}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Asset name and description on the report are generated from your images after analysis.
                Tag match compares the detected tag to the tag number you enter here.
              </p>
            </header>

            <Card className="p-5">
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                {FIELDS.map((field) => (
                  <label key={field.key} className="block">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                      {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                      {FAR_DRIVERS.has(field.key) && (
                        <span
                          title="Changing this recalculates NBV and all depreciation figures"
                          className="inline-flex items-center gap-0.5 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700"
                        >
                          <RefreshCw size={9} />
                          auto-recalc
                        </span>
                      )}
                    </span>
                    {field.type === 'textarea' ? (
                      <textarea
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                        rows={3}
                        value={editedContext[field.key] ?? ''}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      />
                    ) : (
                      <input
                        type={field.type || 'text'}
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                        value={editedContext[field.key] ?? ''}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      />
                    )}
                  </label>
                ))}
              </form>

              {/* Live computed NBV summary — updates as soon as any FAR driver changes */}
              <div className="mt-5 rounded-lg bg-violet-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
                  Computed from SLM formula
                </p>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  <span className="text-gray-500">Book NBV today</span>
                  <span className="text-right font-semibold text-violet-900">
                    {formatInr(editedContext.book_nbv_inr)}
                  </span>
                  <span className="text-gray-500">Asset age</span>
                  <span className="text-right font-medium text-gray-800">
                    {editedContext.asset_age_years != null
                      ? `${editedContext.asset_age_years} yrs`
                      : '—'}
                  </span>
                  <span className="text-gray-500">Annual depreciation</span>
                  <span className="text-right font-medium text-gray-800">
                    {formatInr(editedContext.annual_depreciation_inr)}
                  </span>
                  <span className="text-gray-500">Accumulated dep.</span>
                  <span className="text-right font-medium text-gray-800">
                    {formatInr(editedContext.accumulated_depreciation_inr)}
                  </span>
                </div>
              </div>

              {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
            </Card>

            <FarRegisterSummary asset={editedContext} />

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Card hover onClick={() => proceed('/v6/capture')} className="p-5">
                <div className="flex items-center gap-3">
                  <Camera className="text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Capture photos</h3>
                    <p className="text-sm text-gray-600">Use camera for this asset</p>
                  </div>
                </div>
              </Card>
              <Card hover onClick={() => proceed('/v6/upload')} className="p-5">
                <div className="flex items-center gap-3">
                  <Upload className="text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Upload photos</h3>
                    <p className="text-sm text-gray-600">Select files from device</p>
                  </div>
                </div>
              </Card>
            </div>
          </PageWrapper>
        </HeroSection>
      </main>

      <footer className="shrink-0 border-t border-gray-200 bg-white/95 p-4 pb-safe backdrop-blur-md">
        <Button className="w-full" onClick={() => proceed('/v6/upload')}>
          Continue to upload
        </Button>
      </footer>
    </div>
  );
}
