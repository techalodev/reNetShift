import { prettyBytes } from '../../../helpers/prettyBytes';
import { renderButton } from '../../../partials';
import { ConnectionsStoreState } from './connections.store';
import { NetShift } from '../../types';

interface IRenderConnectionsProps {
  state: ConnectionsStoreState;
  onSearchChange: (query: string) => void;
  onFilterNetworkChange: (network: string) => void;
  onTogglePause: () => void;
  onCloseConnection: (id: string) => void;
  onCloseAllConnections: () => void;
}

function formatDuration(startTime: string): string {
  if (!startTime) return '0s';
  const start = new Date(startTime).getTime();
  const diffSec = Math.max(0, Math.floor((Date.now() - start) / 1000));
  if (diffSec < 60) return `${diffSec}s`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ${diffSec % 60}s`;
  return `${Math.floor(diffSec / 3600)}h ${Math.floor((diffSec % 3600) / 60)}m`;
}

export function renderConnections({
  state,
  onSearchChange,
  onFilterNetworkChange,
  onTogglePause,
  onCloseConnection,
  onCloseAllConnections,
}: IRenderConnectionsProps): HTMLElement {
  const { connections, downloadTotal, uploadTotal, memory, hostnames, searchQuery, filterNetwork, isPaused, closingIds, closingAll, loading } = state;

  // Filter connections
  const q = searchQuery.toLowerCase().trim();
  const filtered = connections.filter((conn) => {
    if (filterNetwork !== 'all' && conn.metadata.network?.toLowerCase() !== filterNetwork) {
      return false;
    }
    if (!q) return true;
    const host = (conn.metadata.host || conn.metadata.destinationIP || '').toLowerCase();
    const src = (conn.metadata.sourceIP || '').toLowerCase();
    const rule = (conn.rule || '').toLowerCase();
    const chain = (conn.chains?.join(' ') || '').toLowerCase();
    const device = (hostnames[conn.metadata.sourceIP] || '').toLowerCase();
    return host.includes(q) || src.includes(q) || rule.includes(q) || chain.includes(q) || device.includes(q);
  });

  return E('div', { class: 'pdk_connections-page' }, [
    // Top Stats Grid
    E('div', { class: 'pdk_connections-stats' }, [
      E('div', { class: 'pdk_connections-stat-card' }, [
        E('span', { class: 'pdk_connections-stat-title' }, _('Active Connections')),
        E('span', { class: 'pdk_connections-stat-value' }, String(connections.length)),
      ]),
      E('div', { class: 'pdk_connections-stat-card' }, [
        E('span', { class: 'pdk_connections-stat-title' }, _('Memory Usage')),
        E('span', { class: 'pdk_connections-stat-value' }, prettyBytes(memory)),
      ]),
      E('div', { class: 'pdk_connections-stat-card' }, [
        E('span', { class: 'pdk_connections-stat-title' }, _('Total Upload')),
        E('span', { class: 'pdk_connections-stat-value' }, prettyBytes(uploadTotal)),
      ]),
      E('div', { class: 'pdk_connections-stat-card' }, [
        E('span', { class: 'pdk_connections-stat-title' }, _('Total Download')),
        E('span', { class: 'pdk_connections-stat-value' }, prettyBytes(downloadTotal)),
      ]),
    ]),

    // Controls: Search, Filter, Pause, Close All
    E('div', { class: 'pdk_connections-controls' }, [
      E('div', { class: 'pdk_connections-search-group' }, [
        E('input', {
          type: 'text',
          class: 'pdk_connections-search-input',
          placeholder: _('Search by host, IP, device, rule...'),
          value: searchQuery,
          oninput: (e: Event) => onSearchChange((e.target as HTMLInputElement).value),
        }),
        E('div', { class: 'pdk_connections-filter-pills' }, [
          E('button', {
            type: 'button',
            class: `pdk_connections-pill ${filterNetwork === 'all' ? 'active' : ''}`,
            onclick: () => onFilterNetworkChange('all'),
          }, _('All')),
          E('button', {
            type: 'button',
            class: `pdk_connections-pill ${filterNetwork === 'tcp' ? 'active' : ''}`,
            onclick: () => onFilterNetworkChange('tcp'),
          }, 'TCP'),
          E('button', {
            type: 'button',
            class: `pdk_connections-pill ${filterNetwork === 'udp' ? 'active' : ''}`,
            onclick: () => onFilterNetworkChange('udp'),
          }, 'UDP'),
        ]),
      ]),

      E('div', { style: 'display: flex; gap: 8px; align-items: center;' }, [
        renderButton({
          text: isPaused ? _('Resume Live Stream') : _('Pause Stream'),
          onClick: onTogglePause,
          classNames: [isPaused ? 'btn-success' : 'btn-secondary'],
        }),
        renderButton({
          text: closingAll ? _('Closing...') : _('Close All Connections'),
          onClick: onCloseAllConnections,
          disabled: closingAll || connections.length === 0,
          classNames: ['btn-danger'],
        }),
      ]),
    ]),

    // Table
    E('div', { class: 'pdk_connections-table-wrapper' }, [
      filtered.length === 0
        ? E('div', { style: 'padding: 32px; text-align: center; color: var(--text-muted, #888);' },
            loading ? _('Connecting to sing-box monitor...') : _('No active connections found')
          )
        : E('table', { class: 'pdk_connections-table' }, [
            E('thead', {}, [
              E('tr', {}, [
                E('th', {}, _('Host / Destination')),
                E('th', {}, _('Device / Client IP')),
                E('th', {}, _('Network')),
                E('th', {}, _('Route / Outbound')),
                E('th', {}, _('Upload')),
                E('th', {}, _('Download')),
                E('th', {}, _('Duration')),
                E('th', { style: 'text-align: center;' }, _('Action')),
              ]),
            ]),
            E('tbody', {},
              filtered.map((conn: NetShift.ClashConnectionItem) => {
                const isClosing = closingIds.has(conn.id);
                const hostDisplay = conn.metadata.host
                  ? `${conn.metadata.host}:${conn.metadata.destinationPort}`
                  : `${conn.metadata.destinationIP}:${conn.metadata.destinationPort}`;
                const netBadgeClass = conn.metadata.network?.toLowerCase() === 'udp' ? 'pdk_badge-udp' : 'pdk_badge-tcp';
                const chainDisplay = (conn.chains && conn.chains.length > 0) ? conn.chains[conn.chains.length - 1] : (conn.rule || 'DIRECT');
                const deviceName = hostnames[conn.metadata.sourceIP];
                const clientContent = deviceName
                  ? E('div', { style: 'display: flex; flex-direction: column; gap: 2px;' }, [
                      E('span', { style: 'font-weight: 600; color: var(--text-color-high, #fff); font-size: 13px;' }, deviceName),
                      E('span', { style: 'color: var(--text-muted, #888); font-size: 11px;' }, `${conn.metadata.sourceIP}:${conn.metadata.sourcePort}`),
                    ])
                  : E('span', { style: 'color: var(--text-muted, #aaa); white-space: nowrap;' }, `${conn.metadata.sourceIP}:${conn.metadata.sourcePort}`);

                return E('tr', {}, [
                  E('td', { style: 'max-width: 220px; word-break: break-all; font-weight: 500;' }, hostDisplay),
                  E('td', {}, [clientContent]),
                  E('td', {}, [
                    E('span', { class: `pdk_badge ${netBadgeClass}` }, conn.metadata.network?.toUpperCase() || 'TCP'),
                  ]),
                  E('td', {}, [
                    E('span', { class: 'pdk_badge pdk_badge-rule', title: `${conn.rule || ''}: ${conn.chains?.join(' -> ') || ''}` }, chainDisplay),
                  ]),
                  E('td', { style: 'white-space: nowrap;' }, prettyBytes(conn.upload)),
                  E('td', { style: 'white-space: nowrap;' }, prettyBytes(conn.download)),
                  E('td', { style: 'white-space: nowrap; color: var(--text-muted, #aaa);' }, formatDuration(conn.start)),
                  E('td', { style: 'text-align: center;' }, [
                    E('button', {
                      type: 'button',
                      class: 'pdk_connections-close-btn',
                      disabled: isClosing,
                      onclick: () => onCloseConnection(conn.id),
                    }, isClosing ? '...' : '✕'),
                  ]),
                ]);
              })
            ),
          ]),
    ]),
  ]);
}
