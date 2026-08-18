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
    min-width: 250px;
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
  }

  .pdk_connections-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    text-align: left;
  }

  .pdk_connections-table th {
    padding: 10px 12px;
    background: rgba(255, 255, 255, 0.03);
    color: var(--text-muted, #999);
    font-weight: 600;
    font-size: 11px;
    text-transform: uppercase;
    border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
    white-space: nowrap;
  }

  .pdk_connections-table td {
    padding: 8px 12px;
    border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.04));
    vertical-align: middle;
  }

  .pdk_connections-table tr:hover td {
    background: rgba(255, 255, 255, 0.03);
  }

  .pdk_badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
  }

  .pdk_badge-tcp {
    background: rgba(52, 152, 219, 0.2);
    color: #3498db;
    border: 1px solid rgba(52, 152, 219, 0.4);
  }

  .pdk_badge-udp {
    background: rgba(155, 89, 182, 0.2);
    color: #9b59b6;
    border: 1px solid rgba(155, 89, 182, 0.4);
  }

  .pdk_badge-rule {
    background: rgba(46, 204, 113, 0.15);
    color: #2ecc71;
    border: 1px solid rgba(46, 204, 113, 0.3);
  }

  .pdk_connections-close-btn {
    padding: 3px 8px;
    font-size: 11px;
    border-radius: 4px;
    background: rgba(231, 76, 60, 0.15);
    color: #e74c3c;
    border: 1px solid rgba(231, 76, 60, 0.3);
    cursor: pointer;
    transition: all 0.2s;
  }

  .pdk_connections-close-btn:hover {
    background: #e74c3c;
    color: #fff;
  }
`;
