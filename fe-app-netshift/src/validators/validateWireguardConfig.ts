import { ValidationResult } from './types';

const WG_KEY_LENGTH = 44;

function isValidBase64Key(value: string): boolean {
  if (value.length !== WG_KEY_LENGTH) {
    return false;
  }
  return /^[A-Za-z0-9+/]{43}=$/.test(value);
}

function isValidCidr(value: string): boolean {
  // IPv4 CIDR
  const ipv4CidrParts = value.split('/');
  if (ipv4CidrParts.length === 2) {
    const [ip, prefix] = ipv4CidrParts;
    const prefixNum = parseInt(prefix, 10);
    const ipv4Parts = ip.split('.');
    if (
      ipv4Parts.length === 4 &&
      ipv4Parts.every((p) => {
        const n = parseInt(p, 10);
        return !isNaN(n) && n >= 0 && n <= 255;
      }) &&
      !isNaN(prefixNum) &&
      prefixNum >= 0 &&
      prefixNum <= 32
    ) {
      return true;
    }
  }
  // IPv6 CIDR (basic check)
  if (value.includes(':') && value.includes('/')) {
    const slashIdx = value.lastIndexOf('/');
    const prefix = parseInt(value.slice(slashIdx + 1), 10);
    return !isNaN(prefix) && prefix >= 0 && prefix <= 128;
  }
  return false;
}

function isValidEndpoint(value: string): boolean {
  const lastColon = value.lastIndexOf(':');
  if (lastColon === -1) {
    return false;
  }
  const port = parseInt(value.slice(lastColon + 1), 10);
  return !isNaN(port) && port > 0 && port <= 65535;
}

function isValidReserved(value: string): boolean {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return false;
  }
  if (!Array.isArray(parsed) || parsed.length !== 3) {
    return false;
  }
  return parsed.every(
    (n) => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 255,
  );
}

export function validateWireguardPrivateKey(value: string): ValidationResult {
  if (!value || value.trim().length === 0) {
    return { valid: false, message: _('Private key is required') };
  }
  if (!isValidBase64Key(value.trim())) {
    return {
      valid: false,
      message: _(
        'Private key must be a valid 44-character base64 WireGuard key',
      ),
    };
  }
  return { valid: true, message: '' };
}

export function validateWireguardPublicKey(value: string): ValidationResult {
  if (!value || value.trim().length === 0) {
    return { valid: false, message: _('Public key is required') };
  }
  if (!isValidBase64Key(value.trim())) {
    return {
      valid: false,
      message: _(
        'Public key must be a valid 44-character base64 WireGuard key',
      ),
    };
  }
  return { valid: true, message: '' };
}

export function validateWireguardPsk(value: string): ValidationResult {
  if (!value || value.trim().length === 0) {
    return { valid: true, message: '' }; // optional
  }
  if (!isValidBase64Key(value.trim())) {
    return {
      valid: false,
      message: _(
        'Pre-shared key must be a valid 44-character base64 WireGuard key',
      ),
    };
  }
  return { valid: true, message: '' };
}

export function validateWireguardLocalAddress(value: string): ValidationResult {
  if (!value || value.trim().length === 0) {
    return { valid: false, message: _('Local address is required') };
  }
  if (!isValidCidr(value.trim())) {
    return {
      valid: false,
      message: _("Local address must be a valid CIDR (e.g. '10.0.0.2/32')"),
    };
  }
  return { valid: true, message: '' };
}

export function validateWireguardEndpoint(value: string): ValidationResult {
  if (!value || value.trim().length === 0) {
    return { valid: false, message: _('Peer endpoint is required') };
  }
  if (!isValidEndpoint(value.trim())) {
    return {
      valid: false,
      message: _("Peer endpoint must be in 'host:port' format"),
    };
  }
  return { valid: true, message: '' };
}

export function validateWireguardReserved(value: string): ValidationResult {
  if (!value || value.trim().length === 0) {
    return { valid: true, message: '' }; // optional
  }
  if (!isValidReserved(value.trim())) {
    return {
      valid: false,
      message: _(
        'Reserved must be a JSON array of exactly 3 integers (0-255), e.g. [0,0,0]',
      ),
    };
  }
  return { valid: true, message: '' };
}
