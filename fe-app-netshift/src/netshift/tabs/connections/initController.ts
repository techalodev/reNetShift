import { socket } from '../../services';
import { getClashWsUrl } from '../../../helpers/getClashApiUrl';
import { getClashApiSecret } from '../../methods/custom/getClashApiSecret';
import { NetShiftShellMethods } from '../../methods/shell';
import { showToast } from '../../../helpers/showToast';
import { getDeviceHostnames } from '../../../helpers/getDeviceHostnames';
import { NetShift } from '../../types';
import { initialConnectionsStore, ConnectionsStoreState } from './connections.store';
import { renderConnections } from './renderConnections';

let state: ConnectionsStoreState = { ...initialConnectionsStore };
let pollInterval: number | null = null;
let hostnamesInterval: number | null = null;

function render() {
  const container = document.getElementById('connections-root-container');
  if (!container) return;

  const content = renderConnections({
    state,
    onSearchChange: (searchQuery: string) => {
      state.searchQuery = searchQuery;
      render();
    },
    onFilterNetworkChange: (filterNetwork: string) => {
      state.filterNetwork = filterNetwork;
      render();
    },
    onTogglePause: () => {
      state.isPaused = !state.isPaused;
      render();
    },
    onCloseConnection: async (id: string) => {
      state.closingIds.add(id);
      render();
      try {
        await NetShiftShellMethods.closeClashApiConnection(id);
        state.connections = state.connections.filter((c) => c.id !== id);
        showToast(_('Connection closed'), 'success');
      } catch {
        showToast(_('Failed to close connection'), 'error');
      } finally {
        state.closingIds.delete(id);
        render();
      }
    },
    onCloseAllConnections: async () => {
      state.closingAll = true;
      render();
      try {
        await NetShiftShellMethods.closeClashApiAllConnections();
        state.connections = [];
        showToast(_('All connections closed'), 'success');
      } catch {
        showToast(_('Failed to close all connections'), 'error');
      } finally {
        state.closingAll = false;
        render();
      }
    },
  });

  container.replaceChildren(content);
}

export function initController() {
  state = { ...initialConnectionsStore, closingIds: new Set<string>() };

  const updateHostnames = async () => {
    try {
      const names = await getDeviceHostnames();
      state.hostnames = { ...state.hostnames, ...names };
      render();
    } catch (_) {}
  };

  updateHostnames();
  if (hostnamesInterval) clearInterval(hostnamesInterval);
  hostnamesInterval = window.setInterval(updateHostnames, 15000);

  async function connectWs() {
    try {
      const secret = await getClashApiSecret();
      const wsUrl = `${getClashWsUrl()}/connections?token=${secret}`;

      socket.subscribe(
        wsUrl,
        (msg: string) => {
          if (state.isPaused) return;
          try {
            const data: NetShift.GetClashApiConnections = JSON.parse(msg);
            state.connections = data.connections || [];
            state.downloadTotal = data.downloadTotal || 0;
            state.uploadTotal = data.uploadTotal || 0;
            state.memory = data.memory || 0;
            state.loading = false;
            render();
          } catch (_err) {
            // Ignore parse errors on transient socket frames
          }
        },
        () => {
          // WS fallback polling
          startPolling();
        }
      );
    } catch (_err) {
      startPolling();
    }
  }

  function startPolling() {
    if (pollInterval) return;
    const fetchSnapshot = async () => {
      if (state.isPaused) return;
      try {
        const res = await NetShiftShellMethods.getClashApiConnections();
        if (res.success && res.data) {
          state.connections = res.data.connections || [];
          state.downloadTotal = res.data.downloadTotal || 0;
          state.uploadTotal = res.data.uploadTotal || 0;
          state.memory = res.data.memory || 0;
        }
        state.loading = false;
        render();
      } catch (_err) {
        // Polling error fallback
      }
    };

    fetchSnapshot();
    pollInterval = window.setInterval(fetchSnapshot, 3000);
  }

  connectWs();
}

export function renderConnectionsTab(): HTMLElement {
  return E('div', { id: 'connections-root-container' });
}
