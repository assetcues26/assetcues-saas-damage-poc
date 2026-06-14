import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ASSET_FORM_FIELDS,
  LOOKUP_FIELD_MAP,
  WIZARD_STEPS,
  validateWizardStep,
} from './assetFormConfig';
import { LookupSelect } from './LookupSelect';
import { AssetDatePicker } from './AssetDatePicker';

/**
 * @param {{
 *   values: Record<string, string>,
 *   onChange: (key: string, value: string) => void,
 *   step: number,
 *   onStepChange: (n: number) => void,
 *   photosSection?: React.ReactNode,
 *   reviewSection?: React.ReactNode,
 *   hideAssetId?: boolean,
 *   steps?: typeof WIZARD_STEPS,
 * }} props
 */
export function CreateAssetWizard({
  values,
  onChange,
  step,
  onStepChange,
  photosSection,
  reviewSection,
  hideAssetId = true,
  steps = WIZARD_STEPS,
}) {
  const [stepError, setStepError] = useState(null);
  const current = steps[step];

  useEffect(() => {
    setStepError(null);
  }, [step]);

  const handleLookup = (idKey, nameKey, id, label) => {
    onChange(idKey, id);
    onChange(nameKey, label);
    if (idKey === 'assetclassid') {
      onChange('categoryid', '');
      onChange('categoryname', '');
      onChange('subcategoryid', '');
      onChange('subcategoryname', '');
      onChange('makemodelid', '');
      onChange('makemodelname', '');
    } else if (idKey === 'categoryid') {
      onChange('subcategoryid', '');
      onChange('subcategoryname', '');
      onChange('makemodelid', '');
      onChange('makemodelname', '');
    } else if (idKey === 'subcategoryid') {
      onChange('makemodelid', '');
      onChange('makemodelname', '');
    }
  };

  const renderField = (key) => {
    if (hideAssetId && key === 'assetid') return null;
    const field = ASSET_FORM_FIELDS.find((f) => f.key === key);
    if (!field) return null;

    const lookup = LOOKUP_FIELD_MAP[key];
    if (lookup) {
      const parentId = lookup.parentKey ? values[lookup.parentKey] : undefined;
      return (
        <div key={key} className="space-y-1">
          <label className="text-xs font-medium text-gray-700">
            {ASSET_FORM_FIELDS.find((f) => f.key === lookup.nameKey)?.label || field.label}
            {ASSET_FORM_FIELDS.find((f) => f.key === lookup.nameKey)?.required && (
              <span className="text-red-500"> *</span>
            )}
          </label>
          <LookupSelect
            type={lookup.type}
            parentId={parentId}
            value={values[lookup.idKey]}
            label={values[lookup.nameKey]}
            onChange={(id, label) => handleLookup(lookup.idKey, lookup.nameKey, id, label)}
            placeholder={`Select ${ASSET_FORM_FIELDS.find((f) => f.key === lookup.nameKey)?.label?.toLowerCase() || field.label.toLowerCase()}`}
            required={Boolean(ASSET_FORM_FIELDS.find((f) => f.key === lookup.nameKey)?.required)}
            disabled={lookup.parentKey && !parentId}
          />
        </div>
      );
    }

    if (key === 'acquisitiondate') {
      return (
        <div key={key} className="space-y-1">
          <label className="text-xs font-medium text-gray-700">
            {field.label}
            {field.required && <span className="text-red-500"> *</span>}
          </label>
          <AssetDatePicker
            value={values.acquisitiondate}
            onChange={(v) => onChange('acquisitiondate', v)}
            required={field.required}
          />
        </div>
      );
    }

    const isTextarea = field.type === 'textarea';
    const Tag = isTextarea ? 'textarea' : 'input';
    return (
      <div key={key} className="space-y-1">
        <label className="text-xs font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500"> *</span>}
        </label>
        <Tag
          type={field.type === 'number' ? 'number' : 'text'}
          value={values[key] || ''}
          placeholder={field.placeholder || field.hint}
          rows={isTextarea ? 3 : undefined}
          onChange={(e) => onChange(key, e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        {field.hint && key === 'assetid' && (
          <p className="text-xs text-gray-500">{field.hint}</p>
        )}
      </div>
    );
  };

  const goNext = () => {
    const err = validateWizardStep(values, step);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError(null);
    onStepChange(Math.min(step + 1, steps.length - 1));
  };

  const goBack = () => {
    setStepError(null);
    onStepChange(Math.max(step - 1, 0));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => i < step && onStepChange(i)}
            className={`flex-1 rounded-full py-1.5 text-center text-xs font-medium transition-colors ${
              i === step
                ? 'bg-blue-600 text-white'
                : i < step
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-500'
            }`}
          >
            {i + 1}. {s.title}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 overflow-visible">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">{current.title}</h3>

        {current.id === 'photos' && photosSection}
        {current.id === 'review' && reviewSection}
        {current.fields.length > 0 && (
          <div className="grid gap-4 overflow-visible sm:grid-cols-2">
            {current.fields.map(renderField)}
          </div>
        )}

        {stepError && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {stepError}
          </p>
        )}
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" disabled={step === 0} onClick={goBack}>
          <ChevronLeft size={16} className="mr-1" />
          Back
        </Button>
        {step < steps.length - 1 && (
          <Button type="button" variant="primary" onClick={goNext}>
            Next
            <ChevronRight size={16} className="ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
