import { describe, expect, it } from 'vitest';
import { shouldToastActivityEvent, TOASTABLE_ACTIVITY_EVENTS } from './activityToast';

describe('activityToast', () => {
  it('only toasts high-signal activity events', () => {
    expect(shouldToastActivityEvent({ id: '1', event_type: 'analysis_complete' })).toBe(true);
    expect(shouldToastActivityEvent({ id: '2', event_type: 'asset_created' })).toBe(true);
    expect(shouldToastActivityEvent({ id: '3', event_type: 'photos_uploaded' })).toBe(false);
    expect(shouldToastActivityEvent({ id: null, event_type: 'analysis_complete' })).toBe(false);
    expect(TOASTABLE_ACTIVITY_EVENTS.has('photos_uploaded')).toBe(false);
  });
});
