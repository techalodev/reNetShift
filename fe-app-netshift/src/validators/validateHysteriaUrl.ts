import { ValidationResult } from './types';
import { parseQueryString } from '../helpers/parseQueryString';

export function validateHysteria2Url(url: string): ValidationResult {
  try {
    const isHY2 = url.startsWith('hysteria2://');
    const isHY2Short = url.startsWith('hy2://');
    const isHY1 = url.startsWith('hysteria://');

    if (!isHY2 && !isHY2Short && !isHY1)
      return {
        valid: false,
        message: _('Invalid HY2 URL: must start with hysteria2://, hy2:// or hysteria://'),
      };

    if (/\s/.test(url))
      return {
        valid: false,
        message: _('Invalid HY2 URL: must not contain spaces'),
      };

    const prefix = isHY2 ? 'hysteria2://' : isHY2Short ? 'hy2://' : 'hysteria://';
    const body = url.slice(prefix.length);

    const [mainPart] = body.split('#');
    const [authHostPort, queryString] = mainPart.split('?');

    if (!authHostPort)
      return {
        valid: false,
        message: _('Invalid HY2 URL: missing credentials/server'),
      };

    const [passwordPart, hostPortPart] = authHostPort.split('@');

    if (!passwordPart)
      return { valid: false, message: _('Invalid HY2 URL: missing password') };

    if (!hostPortPart)
      return {
        valid: false,
        message: _('Invalid HY2 URL: missing host & port'),
      };

    const [host, rawPort] = hostPortPart.split(':');

    if (!host)
      return { valid: false, message: _('Invalid HY2 URL: missing host') };

    const params = queryString ? parseQueryString(queryString) : {};
    if (!rawPort && !params.mport)
      return { valid: false, message: _('Invalid HY2 URL: missing port') };

    const port = rawPort || params.mport;

    const cleanedPort = port.replace('/', '');
    const portEntries = cleanedPort.split(',');

    const isValidPortNumber = (value: string) => {
      if (!/^\d+$/.test(value)) return false;
      const num = Number(value);
      return num >= 1 && num <= 65535;
    };

    const isValidPortEntry = (entry: string) => {
      if (!entry) return false;
      if (!entry.includes('-')) return isValidPortNumber(entry);

      const rangeParts = entry.split('-');
      if (rangeParts.length !== 2) return false;

      const [start, end] = rangeParts;
      if (!isValidPortNumber(start) || !isValidPortNumber(end)) return false;

      return Number(start) <= Number(end);
    };

    if (!portEntries.every(isValidPortEntry))
      return {
        valid: false,
        message: _('Invalid HY2 URL: invalid port number'),
      };

    if (queryString) {
      const paramsKeys = Object.keys(params);

      if (
        paramsKeys.includes('insecure') &&
        !['0', '1', 'true', 'false', ''].includes(params.insecure.toLowerCase())
      )
        return {
          valid: false,
          message: _('Invalid HY2 URL: insecure must be 0 or 1'),
        };

      if (
        paramsKeys.includes('allowInsecure') &&
        !['0', '1', 'true', 'false', ''].includes(
          params.allowInsecure.toLowerCase(),
        )
      )
        return {
          valid: false,
          message: _('Invalid HY2 URL: allowInsecure must be 0 or 1'),
        };

      const validObfsTypes = ['none', 'salamander'];

      if (paramsKeys.includes('obfs') && !validObfsTypes.includes(params.obfs))
        return {
          valid: false,
          message: _('Invalid HY2 URL: unsupported obfs type'),
        };

      if (
        paramsKeys.includes('obfs') &&
        params.obfs !== 'none' &&
        !params['obfs-password'] &&
        !params['obfs_password']
      )
        return {
          valid: false,
          message: _(
            'Invalid HY2 URL: obfs-password required when obfs is set',
          ),
        };

      if (paramsKeys.includes('sni') && !params.sni)
        return {
          valid: false,
          message: _('Invalid HY2 URL: sni cannot be empty'),
        };
    }

    return { valid: true, message: _('Valid') };
  } catch (_e) {
    return { valid: false, message: _('Invalid HY2 URL: parsing failed') };
  }
}
