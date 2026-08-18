import { renderButton } from '../../../../partials';
import { NetShift } from '../../../types';
import { renderLoaderCircleIcon24 } from '../../../../icons';
import { prettyBytes } from '../../../../helpers/prettyBytes';

interface IRenderSectionsProps {
  loading: boolean;
  failed: boolean;
  section: NetShift.OutboundGroup;
  onTestLatency: (tag: string) => void;
  onTestSingleProxyLatency?: (tag: string) => void;
  onUpdateSubscription?: (section: NetShift.OutboundGroup) => void;
  onChooseOutbound: (selector: string, tag: string) => void;
  latencyFetching: boolean;
  activePingTags?: Set<string>;
  subscriptionUpdating?: boolean;
  pingProgress?: { current: number; total: number };
}

function renderFailedState() {
  return E(
    'div',
    {
      class: 'card pdk_dashboard-page__outbound-section centered',
      style: 'height: 127px',
    },
    E('span', {}, [E('span', {}, _('Dashboard currently unavailable'))]),
  );
}

function renderLoadingState() {
  return E('div', {
    id: 'dashboard-sections-grid-skeleton',
    class: 'card pdk_dashboard-page__outbound-section skeleton',
    style: 'height: 127px',
  });
}

export function renderDefaultState({
  section,
  onChooseOutbound,
  onTestLatency,
  onTestSingleProxyLatency,
  onUpdateSubscription,
  latencyFetching,
  activePingTags,
  subscriptionUpdating,
  pingProgress,
}: IRenderSectionsProps) {
  function testLatency() {
    if (section.withTagSelect) {
      return onTestLatency(section.code);
    }

    if (section.outbounds.length) {
      return onTestLatency(section.outbounds[0].code);
    }
  }

  function renderSubscriptionInfo() {
    const meta = section.subscriptionMetadata;
    if (!section.isSubscription || !meta) {
      return null;
    }

    const hasTraffic = Boolean(meta.total && meta.total > 0);
    const hasExpire = Boolean(meta.expire && meta.expire > 0);

    if (!hasTraffic && !hasExpire && !meta.title) {
      return null;
    }

    const elements = [];

    if (meta.title) {
      elements.push(
        E(
          'div',
          {
            class: 'pdk_subscription-info__title',
            style: 'font-size: 12px; opacity: 0.85; margin-bottom: 4px; font-weight: 500;',
          },
          meta.title,
        ),
      );
    }

    if (hasTraffic) {
      const used = (meta.upload || 0) + (meta.download || 0);
      const total = meta.total || 1;
      const percent = Math.min(100, Math.round((used / total) * 100));
      const barColor =
        percent > 90
          ? 'var(--color-danger, #e74c3c)'
          : percent > 75
            ? 'var(--color-warning, #f39c12)'
            : 'var(--color-success, #2ecc71)';

      elements.push(
        E(
          'div',
          {
            class: 'pdk_subscription-info__traffic',
            style: 'margin-top: 4px; font-size: 12px;',
          },
          [
            E(
              'div',
              {
                style:
                  'display: flex; justify-content: space-between; margin-bottom: 4px; color: var(--text-color, #ccc); font-size: 12px;',
              },
              [
                E(
                  'span',
                  {},
                  `${_('Traffic:')} ${prettyBytes(used)} / ${prettyBytes(total)} (${percent}%)`,
                ),
                hasExpire
                  ? (() => {
                      const days = Math.ceil(
                        ((meta.expire || 0) * 1000 - Date.now()) /
                          (1000 * 60 * 60 * 24),
                      );
                      const dateStr = new Date(
                        (meta.expire || 0) * 1000,
                      ).toLocaleDateString();
                      return E(
                        'span',
                        {
                          style:
                            days <= 3
                              ? 'color: var(--color-danger, #e74c3c); font-weight: bold;'
                              : '',
                        },
                        `${_('Expires:')} ${dateStr}${days > 0 ? ` (${days} ${_('days left')})` : ` (${_('Expired')})`}`,
                      );
                    })()
                  : E('span', {}, ''),
              ],
            ),
            E(
              'div',
              {
                style:
                  'height: 4px; background: rgba(255,255,255,0.12); border-radius: 2px; overflow: hidden;',
              },
              [
                E('div', {
                  style: `height: 100%; width: ${percent}%; background: ${barColor}; transition: width 0.3s;`,
                }),
              ],
            ),
          ],
        ),
      );
    } else if (hasExpire) {
      const days = Math.ceil(
        ((meta.expire || 0) * 1000 - Date.now()) / (1000 * 60 * 60 * 24),
      );
      const dateStr = new Date((meta.expire || 0) * 1000).toLocaleDateString();
      elements.push(
        E(
          'div',
          {
            class: 'pdk_subscription-info__expire',
            style:
              'font-size: 12px; margin-top: 4px; color: var(--text-color, #ccc);',
          },
          [
            E(
              'span',
              {
                style:
                  days <= 3
                    ? 'color: var(--color-danger, #e74c3c); font-weight: bold;'
                    : '',
              },
              `${_('Expires:')} ${dateStr}${days > 0 ? ` (${days} ${_('days left')})` : ` (${_('Expired')})`}`,
            ),
          ],
        ),
      );
    }

    return E(
      'div',
      {
        class: 'pdk_subscription-info-bar',
        style:
          'padding: 0 4px 8px 4px; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.06);',
      },
      elements,
    );
  }

  function renderOutbound(outbound: NetShift.Outbound) {
    const isPinging = Boolean(activePingTags?.has(outbound.code));

    function getLatencyClass() {
      if (isPinging) {
        return 'pdk_dashboard-page__outbound-grid__item__latency pdk_dashboard-page__outbound-grid__item__latency--loading';
      }

      if (!outbound.latency) {
        return 'pdk_dashboard-page__outbound-grid__item__latency pdk_dashboard-page__outbound-grid__item__latency--empty';
      }

      if (outbound.latency < 800) {
        return 'pdk_dashboard-page__outbound-grid__item__latency pdk_dashboard-page__outbound-grid__item__latency--green';
      }

      if (outbound.latency < 1500) {
        return 'pdk_dashboard-page__outbound-grid__item__latency pdk_dashboard-page__outbound-grid__item__latency--yellow';
      }

      return 'pdk_dashboard-page__outbound-grid__item__latency pdk_dashboard-page__outbound-grid__item__latency--red';
    }

    const latencyContent = isPinging
      ? E('span', { class: 'pdk_dashboard-page__outbound-grid__item__latency-loading' }, [
          renderLoaderCircleIcon24(),
        ])
      : outbound.latency
        ? `${outbound.latency}ms`
        : 'N/A';

    return E(
      'div',
      {
        class: `card pdk_dashboard-page__outbound-grid__item ${outbound.selected ? 'pdk_dashboard-page__outbound-grid__item--active' : ''} ${section.withTagSelect ? 'pdk_dashboard-page__outbound-grid__item--selectable' : ''}`,
        click: () =>
          section.withTagSelect &&
          onChooseOutbound(section.code, outbound.code),
      },
      [
        E('b', {}, outbound.displayName),
        E('div', { class: 'pdk_dashboard-page__outbound-grid__item__footer' }, [
          E(
            'div',
            { class: 'pdk_dashboard-page__outbound-grid__item__type' },
            outbound.type,
          ),
          E(
            'div',
            {
              class: getLatencyClass(),
              title: _('Test latency'),
              role: 'button',
              click: () => {
                if (!isPinging && onTestSingleProxyLatency) {
                  onTestSingleProxyLatency(outbound.code);
                }
              },
            },
            [latencyContent],
          ),
        ]),
      ],
    );
  }

  const actions = [];

  if (section.isSubscription && onUpdateSubscription) {
    actions.push(
      subscriptionUpdating
        ? E(
            'button',
            {
              type: 'button',
              class: 'btn dashboard-sections-grid-item-update-subscription',
              disabled: true,
            },
            [
              renderLoaderCircleIcon24(),
              E('span', { style: 'margin-left: 4px' }, _('Updating...')),
            ],
          )
        : renderButton({
            text: _('Update subscription'),
            onClick: () => onUpdateSubscription(section),
            classNames: ['dashboard-sections-grid-item-update-subscription'],
          }),
    );
  }

  const isPingingSection = Boolean(pingProgress);

  actions.push(
    isPingingSection
      ? E(
          'button',
          {
            type: 'button',
            class: 'btn dashboard-sections-grid-item-test-latency',
            disabled: true,
          },
          [
            renderLoaderCircleIcon24(),
            E(
              'span',
              { style: 'margin-left: 4px' },
              `${pingProgress?.current || 0}/${pingProgress?.total || 0}`,
            ),
          ],
        )
      : latencyFetching
        ? E('div', { class: 'skeleton', style: 'width: 99px; height: 28px' })
        : renderButton({
            text: _('Test latency'),
            onClick: () => testLatency(),
            classNames: ['dashboard-sections-grid-item-test-latency'],
          }),
  );

  const cardChildren: Array<HTMLElement | string> = [
    // Title with action buttons
    E('div', { class: 'pdk_dashboard-page__outbound-section__title-section' }, [
      E(
        'div',
        {
          class: 'pdk_dashboard-page__outbound-section__title-section__title',
        },
        section.displayName,
      ),
      E(
        'div',
        { class: 'pdk_dashboard-page__outbound-section__actions' },
        actions,
      ),
    ]),
  ];

  const subInfo = renderSubscriptionInfo();
  if (subInfo) {
    cardChildren.push(subInfo);
  }

  cardChildren.push(
    E(
      'div',
      { class: 'pdk_dashboard-page__outbound-grid' },
      section.outbounds.map((outbound) => renderOutbound(outbound)),
    ),
  );

  return E('div', { class: 'card pdk_dashboard-page__outbound-section' }, cardChildren);
}

export function renderSections(props: IRenderSectionsProps) {
  if (props.failed) {
    return renderFailedState();
  }

  if (props.loading) {
    return renderLoadingState();
  }

  return renderDefaultState(props);
}
