import { NetShift } from '../../types';

export interface ConnectionsStoreState {
  connections: NetShift.ClashConnectionItem[];
  downloadTotal: number;
  uploadTotal: number;
  memory: number;
  searchQuery: string;
  filterNetwork: string; // 'all' | 'tcp' | 'udp'
  isPaused: boolean;
  closingIds: Set<string>;
  closingAll: boolean;
  loading: boolean;
}

export const initialConnectionsStore: ConnectionsStoreState = {
  connections: [],
  downloadTotal: 0,
  uploadTotal: 0,
  memory: 0,
  searchQuery: '',
  filterNetwork: 'all',
  isPaused: false,
  closingIds: new Set<string>(),
  closingAll: false,
  loading: true,
};
