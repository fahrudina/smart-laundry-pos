import { describe, it, expect } from 'vitest';
import { WhatsAppClient } from './client';

describe('WhatsAppClient.formatPhoneNumber', () => {
  it('leaves a number already in 62-prefixed format unchanged', () => {
    expect(WhatsAppClient.formatPhoneNumber('6281234567890')).toBe('6281234567890');
  });

  it('strips a leading + from an international format', () => {
    expect(WhatsAppClient.formatPhoneNumber('+6281234567890')).toBe('6281234567890');
  });

  it('replaces a leading 0 with the country code', () => {
    expect(WhatsAppClient.formatPhoneNumber('081234567890')).toBe('6281234567890');
  });

  it('prepends the country code when neither 0 nor 62 is present', () => {
    expect(WhatsAppClient.formatPhoneNumber('81234567890')).toBe('6281234567890');
  });

  it('strips spaces and dashes before normalizing', () => {
    expect(WhatsAppClient.formatPhoneNumber('0812-3456-7890')).toBe('6281234567890');
  });

  it('supports a non-default country code', () => {
    expect(WhatsAppClient.formatPhoneNumber('0123456789', '1')).toBe('1123456789');
  });
});
