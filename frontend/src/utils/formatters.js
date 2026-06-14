/**
 * Format decimal years as "X years Y months" (nearest month).
 * Passes through non-numeric strings unchanged.
 * @param {number | string | null | undefined} yearsFloat
 */
export function formatAgeYearsMonths(yearsFloat) {
  if (yearsFloat == null || yearsFloat === '') return '—';
  if (typeof yearsFloat === 'string') {
    const trimmed = yearsFloat.trim();
    if (!/^\d+(\.\d+)?$/.test(trimmed)) return trimmed;
    yearsFloat = Number(trimmed);
  }
  const num = Number(yearsFloat);
  if (Number.isNaN(num)) return String(yearsFloat);
  const totalMonths = Math.max(0, Math.round(num * 12));
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  if (y === 0) return `${m} month${m === 1 ? '' : 's'}`;
  if (m === 0) return `${y} year${y === 1 ? '' : 's'}`;
  return `${y} year${y === 1 ? '' : 's'} ${m} month${m === 1 ? '' : 's'}`;
}

export function formatProcessingTime(ms) {
  if (ms == null || Number.isNaN(Number(ms))) return '—';
  const seconds = Number(ms) / 1000;
  return `${seconds.toFixed(1)} seconds`;
}

export function formatConfidence(value) {
  if (value == null || Number.isNaN(Number(value))) return '0%';
  return `${Math.round(Number(value) * 100)}%`;
}

export function formatFileSize(bytes) {
  const n = Number(bytes);
  if (!bytes || n <= 0 || Number.isNaN(n)) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatRelativeTime(dateInput) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  if (weeks < 4) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function normalizeCondition(condition) {
  if (!condition) return null;
  const lower = String(condition).trim().toLowerCase();
  if (lower === 'excellent') return 'Excellent';
  if (lower === 'good') return 'Good';
  if (lower === 'fair' || lower === 'average' || lower === 'moderate') return 'Fair';
  if (lower === 'poor' || lower === 'bad' || lower === 'damaged' || lower === 'critical') return 'Poor';
  if (lower === 'unknown' || lower === 'n/a' || lower === 'na') return null;
  return null;
}

function scoreToHundred(score) {
  if (score == null || Number.isNaN(Number(score))) return null;
  let s = Math.round(Number(score));
  if (s >= 1 && s <= 10) s *= 10;
  return Math.max(0, Math.min(100, s));
}

/**
 * Client-safe condition label: normalized grade, raw grade, or score-derived fallback.
 * @param {string | null | undefined} grade
 * @param {number | null | undefined} overallScore
 */
export function resolveConditionLabel(grade, overallScore) {
  const normalized = normalizeCondition(grade);
  if (normalized) return normalized;

  const raw = grade && String(grade).trim();
  if (raw && !/^(unknown|n\/a|na)$/i.test(raw)) {
    return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  }

  const score = scoreToHundred(overallScore);
  if (score == null) return null;
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Poor';
}

import { getMarketConfig } from '../constants/markets';

const CURRENCY_META = {
  INR: { symbol: '₹', locale: 'en-IN' },
  USD: { symbol: '$', locale: 'en-US' },
  GBP: { symbol: '£', locale: 'en-GB' },
};

/** @param {string} [currency] */
export function getCurrencyMeta(currency = 'INR') {
  const key = (currency || 'INR').toUpperCase();
  return CURRENCY_META[key] || CURRENCY_META.INR;
}

/**
 * Read display range from valuation amount; falls back to legacy `inr` for old history.
 * @param {object | null | undefined} valuation
 * @param {'as_is' | 'nbv' | 'like_new_reference'} field
 * @returns {{ range: { min: number, max: number }, currency: string } | null}
 */
export function getValuationRange(valuation, field) {
  const amount = valuation?.[field];
  if (!amount) return null;
  if (amount.display?.min != null && amount.display?.max != null) {
    return { range: amount.display, currency: amount.display_currency || 'INR' };
  }
  if (amount.inr?.min != null && amount.inr?.max != null) {
    return { range: amount.inr, currency: 'INR' };
  }
  return null;
}

/**
 * @param {{ min?: number, max?: number } | null | undefined} range
 * @param {string} [symbol]
 * @param {string} [locale]
 */
export function formatMoneyRange(range, symbol = '₹', locale) {
  if (!range || range.min == null || range.max == null) return '—';
  const minNum = Number(range.min);
  const maxNum = Number(range.max);
  if (Number.isNaN(minNum) || Number.isNaN(maxNum)) return '—';
  const fmtLocale = locale ?? (symbol === '₹' ? 'en-IN' : undefined);
  const min = minNum.toLocaleString(fmtLocale, { maximumFractionDigits: 0 });
  const max = maxNum.toLocaleString(fmtLocale, { maximumFractionDigits: 0 });
  return `${symbol}${min} – ${symbol}${max}`;
}

/** Format a money range in the given display currency. */
export function formatDisplayMoneyRange(range, currency = 'INR') {
  const { symbol, locale } = getCurrencyMeta(currency);
  return formatMoneyRange(range, symbol, locale);
}

/** Format an INR money range for India client display. */
export function formatInrMoneyRange(range) {
  return formatDisplayMoneyRange(range, 'INR');
}

/**
 * Single INR amount (e.g. exact ERP book NBV).
 * @param {number | null | undefined} value
 */
export function formatInrAmount(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

/**
 * Book NBV display — exact ERP value when available, otherwise valuation range.
 * @param {object | null | undefined} valuation
 * @param {object | null | undefined} erpVerification
 * @param {object | null | undefined} erpContext
 */
export function formatBookNbvDisplay(valuation, erpVerification, erpContext, displayCurrency) {
  const currency = displayCurrency || valuation?.nbv?.display_currency || 'INR';
  const exact =
    erpVerification?.erp_book_nbv_inr ??
    erpContext?.book_nbv_inr ??
    (valuation?.nbv?.method === 'erp_book_nbv' &&
    valuation?.nbv?.inr?.min != null &&
    valuation.nbv.inr.min === valuation.nbv.inr.max
      ? valuation.nbv.inr.min
      : null);
  if (valuation?.nbv?.method === 'erp_book_nbv' && exact != null) {
    return formatInrAmount(exact);
  }
  const nbvRange = getValuationRange(valuation, 'nbv');
  return formatDisplayMoneyRange(nbvRange?.range, nbvRange?.currency || currency);
}

/** Resolve subtitle and icon currency from stored analysis policy or market region. */
export function getValuationDisplayMeta(analysisPolicy) {
  const region = analysisPolicy?.market_region;
  const currency = analysisPolicy?.display_currency;
  if (currency) {
    const meta = getCurrencyMeta(currency);
    const market = region ? getMarketConfig(region) : null;
    return {
      currency,
      symbol: meta.symbol,
      subtitle: market?.subtitle || `${currency} market estimates`,
    };
  }
  const market = getMarketConfig(region || 'IN');
  return { currency: market.currency, symbol: market.symbol, subtitle: market.subtitle };
}

/** @param {object | null | undefined} valuation */
export function bookNbvSublabel(valuation) {
  if (valuation?.nbv?.method === 'erp_book_nbv') {
    return 'Book NBV from ERP (on books)';
  }
  return 'Age depreciation only';
}

export function formatList(items) {
  if (!items?.length) return '—';
  return items.join(', ');
}

export function formatTokenCount(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return Number(value).toLocaleString();
}

/** Small USD amounts from API cost breakdown (e.g. 0.002). */
export function formatUsdCost(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const n = Number(value);
  if (n === 0) return '$0.00';
  if (n < 0.01) return `$${n.toFixed(4)}`;
  if (n < 1) return `$${n.toFixed(3)}`;
  return `$${n.toFixed(2)}`;
}

export function formatInrCost(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const n = Number(value);
  if (n < 1) return `₹${n.toFixed(2)}`;
  return `₹${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function formatDateTime(dateInput) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function truncateText(text, maxLength = 120) {
  if (!text || text.length <= maxLength) return text || '';
  return `${text.slice(0, maxLength).trimEnd()}…`;
}
