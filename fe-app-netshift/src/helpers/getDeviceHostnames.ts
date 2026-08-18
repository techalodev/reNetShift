declare const fs: {
  read: (path: string) => Promise<string>;
};

export async function getDeviceHostnames(): Promise<Record<string, string>> {
  const ipMap: Record<string, string> = {};

  try {
    const leases =
      (await fs.read('/tmp/dhcp.leases').catch(() => '')) ||
      (await fs.read('/var/dhcp.leases').catch(() => ''));

    if (leases) {
      const lines = leases.split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 4) {
          const ip = parts[2];
          const hostname = parts[3];
          if (ip && hostname && hostname !== '*' && hostname !== '?') {
            ipMap[ip] = hostname;
          }
        }
      }
    }
  } catch (_) {}

  try {
    const hosts = await fs.read('/etc/hosts').catch(() => '');
    if (hosts) {
      const lines = hosts.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 2) {
          const ip = parts[0];
          const hostname = parts[1];
          if (ip && hostname && !ipMap[ip] && ip !== '127.0.0.1' && ip !== '::1') {
            ipMap[ip] = hostname;
          }
        }
      }
    }
  } catch (_) {}

  return ipMap;
}
