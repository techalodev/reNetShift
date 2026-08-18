export const CONNECTIONS_STYLES = `
  .pdk_connections-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-bottom: 24px;
  }

  .pdk_connections-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
  }

  .pdk_connections-stat-card {
    background: var(--card-background, #1e1e1e);
    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
    border-radius: 8px;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .pdk_connections-stat-title {
    font-size: 11px;
    color: var(--text-muted, #888);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .pdk_connections-stat-value {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-color, #eee);
  }

  .pdk_connections-controls {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-top: 4px;
  }

  .pdk_connections-search-group {
    display: flex;
    gap: 8px;
    align-items: center;
    flex: 1;
    min-width: 280px;
  }

  .pdk_connections-search-input {
    width: 100%;
    max-width: 380px;
    padding: 7px 12px;
    border-radius: 6px;
    background: var(--input-background, #252525);
    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.12));
    color: var(--text-color, #eee);
    font-size: 13px;
  }

  .pdk_connections-filter-pills {
    display: flex;
    gap: 6px;
  }

  .pdk_connections-pill {
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    background: var(--input-background, rgba(255,255,255,0.06));
    border: 1px solid transparent;
    color: var(--text-color, #ccc);
    transition: all 0.2s ease;
  }

  .pdk_connections-pill.active {
    background: var(--primary-color, #3498db);
    color: #fff;
    font-weight: 600;
  }

  .pdk_connections-table-wrapper {
    background: var(--card-background, #1e1e1e);
    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
    border-radius: 8px;
    overflow-x: auto;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .pdk_connections-table {
    width: 100%;
    min-width: 780px;
    border-collapse: collapse;
    font-size: 12px;
    text-align: left;
  }

  .pdk_connections-table th {
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-muted, #999);
    font-weight: 600;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
    white-space: nowrap;
  }

  .pdk_connections-table td {
    padding: 10px 14px;
    border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.04));
    vertical-align: middle;
  }

  .pdk_connections-table tr:hover td {
    background: rgba(255, 255, 255, 0.03);
  }

  .pdk_connections-host-cell {
    max-width: 240px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
  }

  .pdk_badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    line-height: 1.4;
    text-transform: uppercase;
  }

  .pdk_badge-tcp {
    background: rgba(52, 152, 219, 0.18);
    color: #5dade2;
    border: 1px solid rgba(52, 152, 219, 0.35);
  }

  .pdk_badge-udp {
    background: rgba(155, 89, 182, 0.18);
    color: #bb8fce;
    border: 1px solid rgba(155, 89, 182, 0.35);
  }

  .pdk_badge-rule {
    background: rgba(46, 204, 113, 0.14);
    color: #2ecc71;
    border: 1px solid rgba(46, 204, 113, 0.28);
    max-width: 170px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-transform: none;
    font-size: 11px;
  }

  .pdk_connections-close-btn {
    padding: 4px 8px;
    font-size: 12px;
    font-weight: bold;
    border-radius: 4px;
    background: rgba(231, 76, 60, 0.15);
    color: #e74c3c;
    border: 1px solid rgba(231, 76, 60, 0.3);
    cursor: pointer;
    transition: all 0.2s;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .pdk_connections-close-btn:hover:not(:disabled) {
    background: #e74c3c;
    color: #fff;
  }
`;
