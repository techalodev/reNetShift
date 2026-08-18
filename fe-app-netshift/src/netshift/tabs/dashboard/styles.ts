// language=CSS
export const styles = `
#cbi-netshift-dashboard-_mount_node > div {
    width: 100%;
}

#cbi-netshift-dashboard > h3 {
    display: none;
}
    
.pdk_dashboard-page {
    width: 100%;
    --dashboard-grid-columns: 4;
}

@media (max-width: 900px) {
    .pdk_dashboard-page {
        --dashboard-grid-columns: 2;
    }
}

.pdk_dashboard-page__widgets-section {
    margin-top: 10px;
    display: grid;
    grid-template-columns: repeat(var(--dashboard-grid-columns), 1fr);
    grid-gap: 10px;
}

.pdk_dashboard-page__widgets-section__item {
}

.pdk_dashboard-page__widgets-section__item__title {}

.pdk_dashboard-page__widgets-section__item__row {}

.pdk_dashboard-page__widgets-section__item__row--success .pdk_dashboard-page__widgets-section__item__row__value {
    color: var(--success-color-medium, green);
}

.pdk_dashboard-page__widgets-section__item__row--error .pdk_dashboard-page__widgets-section__item__row__value {
    color: var(--error-color-medium, red);
}

.pdk_dashboard-page__widgets-section__item__row__key {}

.pdk_dashboard-page__widgets-section__item__row__value {}

.pdk_dashboard-page__outbound-section {
    margin-top: 10px;
}

.pdk_dashboard-page__outbound-section__title-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.pdk_dashboard-page__outbound-section__title-section__title {
    color: var(--text-color-high);
    font-weight: 700;
}

.pdk_dashboard-page__outbound-section__actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.pdk_dashboard-page__outbound-section__action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.pdk_dashboard-page__outbound-grid {
    margin-top: 5px;
    display: grid;
    grid-template-columns: repeat(var(--dashboard-grid-columns), 1fr);
    grid-gap: 10px;
}

.pdk_dashboard-page__outbound-grid__item {
    transition: border 0.2s ease;
}

.pdk_dashboard-page__outbound-grid__item--selectable {
    cursor: pointer;
}

.pdk_dashboard-page__outbound-grid__item--selectable:hover {
    border-color: var(--primary-color-high, dodgerblue);
}

.pdk_dashboard-page__outbound-grid__item--active {
    border-color: var(--success-color-medium, green);
}

.pdk_dashboard-page__outbound-grid__item__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 10px;
}

.pdk_dashboard-page__outbound-grid__item__type {}

.pdk_dashboard-page__outbound-grid__item__latency {
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 4px;
    transition: background-color 0.15s ease, transform 0.15s ease, opacity 0.15s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    user-select: none;
}

.pdk_dashboard-page__outbound-grid__item__latency:hover {
    background-color: rgba(255, 255, 255, 0.1);
    transform: scale(1.06);
}

.pdk_dashboard-page__outbound-grid__item__latency--loading {
    opacity: 0.7;
    pointer-events: none;
}

.pdk_dashboard-page__outbound-grid__item__latency-loading svg {
    width: 14px;
    height: 14px;
    animation: pdk-spin 1s linear infinite;
}

@keyframes pdk-spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

.pdk_dashboard-page__outbound-grid__item__latency--empty {
    color: var(--primary-color-low, lightgray);
}

.pdk_dashboard-page__outbound-grid__item__latency--green {
    color: var(--success-color-medium, green);
}

.pdk_dashboard-page__outbound-grid__item__latency--yellow {
    color: var(--warn-color-medium, orange);
}

.pdk_dashboard-page__outbound-grid__item__latency--red {
    color: var(--error-color-medium, red);
}

`;
