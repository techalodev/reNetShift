declare const fs: {
  read: (path: string) => Promise<string>;
  list?: (path: string) => Promise<Array<{ name: string; type: string }>>;
};

export async function getDeviceHostnames(): Promise<Record<string, string>> {
  const ipMap: Record<string, string> = {};

  const parseLeases = (content: string) => {
    if (!content) return;
    const lines = content.split('\n');
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
  };

  const parseHosts = (content: string) => {
    if (!content) return;
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 2) {
        const ip = parts[0];
        const hostname = parts[1];
        if (ip && hostname && !ipMap[ip] && ip !== '127.0.0.1' && ip !== '::1' && ip !== 'localhost') {
          ipMap[ip] = hostname;
        }
      }
    }
  };

  try {
    const l1 = await fs.read('/tmp/dhcp.leases').catch(() => '');
    parseLeases(l1);
    const l2 = await fs.read('/var/dhcp.leases').catch(() => '');
    parseLeases(l2);
  } catch (_) {}

  try {
    const h1 = await fs.read('/etc/hosts').catch(() => '');
    parseHosts(h1);
    const h2 = await fs.read('/tmp/hosts/odhcpd').catch(() => '');
    parseHosts(h2);
  } catch (_) {}

  try {
    if (fs.list) {
      const hostFiles = await fs.list('/tmp/hosts').catch(() => []);
      for (const file of hostFiles) {
        if (file && file.name && !file.name.startsWith('.')) {
          const content = await fs.read('/tmp/hosts/' + file.name).catch(() => '');
          parseHosts(content);
        }
      }
    }
  } catch (_) {}

  return ipMap;
}
