import {
  getClashWsUrl,
  onMount,
  preserveScrollForPage,
} from '../../../helpers';
import { prettyBytes } from '../../../helpers/prettyBytes';
import { showToast } from '../../../helpers/showToast';
import { CustomNetShiftMethods, NetShiftShellMethods } from '../../methods';
import { logger, socket, store, StoreType } from '../../services';
import { renderSections, renderWidget } from './partials';
import { fetchServicesInfo } from '../../fetchers';
import { getClashApiSecret } from '../../methods/custom/getClashApiSecret';
import { NetShift } from '../../types';

const activePingTags = new Set<string>();
const subscriptionUpdatingSections = new Set<string>();
const sectionPingProgress = new Map<string, { current: number; total: number }>();

// Fetchers

async function fetchDashboardSections() {
  const prev = store.get().sectionsWidget;

  store.set({
    sectionsWidget: {
      ...prev,
      failed: false,
    },
  });

  const { data, success } = await CustomNetShiftMethods.getDashboardSections();

  if (!success) {
    logger.error('[DASHBOARD]', 'fetchDashboardSections: failed to fetch');
  }

  store.set({
    sectionsWidget: {
      latencyFetching: false,
      loading: false,
      failed: !success,
      data,
    },
  });
}

async function connectToClashSockets() {
  const clashApiSecret = await getClashApiSecret();

  socket.subscribe(
    `${getClashWsUrl()}/traffic?token=${clashApiSecret}`,
    (msg: string) => {
      const data: NetShift.GetClashApiTraffic = JSON.parse(msg);
      store.set({
        bandwidthWidget: {
          loading: false,
          failed: false,
          data: {
            up: data.up || 0,
            down: data.down || 0,
          },
        },
      });
    },
    (_err) => {
      logger.error(
        '[DASHBOARD]',
        'connectToClashSockets - traffic: failed to connect to',
        getClashWsUrl(),
      );
      store.set({
        bandwidthWidget: {
          loading: false,
          failed: true,
          data: { up: 0, down: 0 },
        },
      });
    },
  );

  socket.subscribe(
    `${getClashWsUrl()}/connections?token=${clashApiSecret}`,
    (msg: string) => {
      const data: NetShift.GetClashApiConnections = JSON.parse(msg);
      store.set({
        trafficTotalWidget: {
          loading: false,
          failed: false,
          data: {
            uploadTotal: data.uploadTotal,
            downloadTotal: data.downloadTotal,
          },
        },
        systemInfoWidget: {
          loading: false,
          failed: false,
          data: {
            connections: data.connections.length,
            memory: data.memory,
          },
        },
      });
    },
    (_err) => {
      logger.error(
        '[DASHBOARD]',
        'connectToClashSockets - connections: failed to connect to',
        getClashWsUrl(),
      );
      store.set({
        trafficTotalWidget: {
          loading: false,
          failed: true,
          data: { downloadTotal: 0, uploadTotal: 0 },
        },
        systemInfoWidget: {
          loading: false,
          failed: true,
          data: {
            connections: 0,
            memory: 0,
          },
        },
      });
    },
  );
}

// Handlers

async function handleChooseOutbound(selector: string, tag: string) {
  await NetShiftShellMethods.setClashApiGroupProxy(selector, tag);
  await fetchDashboardSections();
}

async function handleTestSectionLatency(section: NetShift.OutboundGroup) {
  const sectionKey = section.sectionName || section.code;
  if (sectionPingProgress.has(sectionKey)) {
    return;
  }

  const outbounds = section.outbounds || [];
  if (outbounds.length === 0) {
    return;
  }

  const total = outbounds.length;
  let finished = 0;

  sectionPingProgress.set(sectionKey, { current: 0, total });
  await renderSectionsWidget();

  const concurrency = 4;
  for (let i = 0; i < outbounds.length; i += concurrency) {
    const batch = outbounds.slice(i, i + concurrency);
    await Promise.allSettled(
      batch.map(async (outbound) => {
        activePingTags.add(outbound.code);
        try {
          await NetShiftShellMethods.getClashApiProxyLatency(outbound.code);
        } catch (error) {
          logger.error(
            '[DASHBOARD]',
            'handleTestSectionLatency failed for',
            outbound.code,
            error,
          );
        } finally {
          activePingTags.delete(outbound.code);
          finished++;
          sectionPingProgress.set(sectionKey, { current: finished, total });
          await renderSectionsWidget();
        }
      }),
    );
  }

  await fetchDashboardSections();
  sectionPingProgress.delete(sectionKey);
  await renderSectionsWidget();
}

async function handleTestSingleProxyLatency(tag: string) {
  if (activePingTags.has(tag)) {
    return;
  }

  activePingTags.add(tag);
  await renderSectionsWidget();

  try {
    await NetShiftShellMethods.getClashApiProxyLatency(tag);
    await fetchDashboardSections();
  } catch (error) {
    logger.error('[DASHBOARD]', 'handleTestSingleProxyLatency: failed', error);
  } finally {
    activePingTags.delete(tag);
    await renderSectionsWidget();
  }
}

async function handleUpdateSubscription(section: NetShift.OutboundGroup) {
  const sectionKey = section.sectionName || section.code;
  if (subscriptionUpdatingSections.has(sectionKey)) {
    return;
  }

  subscriptionUpdatingSections.add(sectionKey);
  await renderSectionsWidget();

  try {
    const res = (await NetShiftShellMethods.subscriptionUpdate()) as {
      success?: boolean;
    } | null;
    await fetchDashboardSections();
    if (res && res.success === false) {
      showToast(_('Failed to update subscriptions'), 'error');
    } else {
      showToast(_('Subscription updated successfully'), 'success');
    }
  } catch (error) {
    logger.error('[DASHBOARD]', 'handleUpdateSubscription: failed', error);
    showToast(_('Failed to update subscriptions'), 'error');
  } finally {
    subscriptionUpdatingSections.delete(sectionKey);
    await renderSectionsWidget();
  }
}

// Renderer

async function renderSectionsWidget() {
  logger.debug('[DASHBOARD]', 'renderSectionsWidget');
  const sectionsWidget = store.get().sectionsWidget;
  const container = document.getElementById('dashboard-sections-grid');

  if (!container) {
    return;
  }

  if (sectionsWidget.loading || sectionsWidget.failed) {
    const renderedWidget = renderSections({
      loading: sectionsWidget.loading,
      failed: sectionsWidget.failed,
      section: {
        code: '',
        displayName: '',
        outbounds: [],
        withTagSelect: false,
      },
      onTestLatency: () => {},
      onChooseOutbound: () => {},
      latencyFetching: sectionsWidget.latencyFetching,
    });

    return preserveScrollForPage(() => {
      container.replaceChildren(renderedWidget);
    });
  }

  const renderedWidgets = sectionsWidget.data.map((section) => {
    const sectionKey = section.sectionName || section.code;
    return renderSections({
      loading: sectionsWidget.loading,
      failed: sectionsWidget.failed,
      section,
      latencyFetching: sectionsWidget.latencyFetching,
      activePingTags,
      subscriptionUpdating: subscriptionUpdatingSections.has(sectionKey),
      pingProgress: sectionPingProgress.get(sectionKey),
      onTestLatency: () => {
        return handleTestSectionLatency(section);
      },
      onTestSingleProxyLatency: (tag) => {
        return handleTestSingleProxyLatency(tag);
      },
      onUpdateSubscription: (targetSection) => {
        return handleUpdateSubscription(targetSection);
      },
      onChooseOutbound: (selector, tag) => {
        handleChooseOutbound(selector, tag);
      },
    });
  });

  return preserveScrollForPage(() => {
    container.replaceChildren(...renderedWidgets);
  });
}

async function renderBandwidthWidget() {
  logger.debug('[DASHBOARD]', 'renderBandwidthWidget');
  const traffic = store.get().bandwidthWidget;

  const container = document.getElementById('dashboard-widget-traffic');

  if (traffic.loading || traffic.failed) {
    const renderedWidget = renderWidget({
      loading: traffic.loading,
      failed: traffic.failed,
      title: '',
      items: [],
    });

    return container!.replaceChildren(renderedWidget);
  }

  const renderedWidget = renderWidget({
    loading: traffic.loading,
    failed: traffic.failed,
    title: _('Traffic'),
    items: [
      { key: _('Uplink'), value: `${prettyBytes(traffic.data.up)}/s` },
      { key: _('Downlink'), value: `${prettyBytes(traffic.data.down)}/s` },
    ],
  });

  container!.replaceChildren(renderedWidget);
}

async function renderTrafficTotalWidget() {
  logger.debug('[DASHBOARD]', 'renderTrafficTotalWidget');
  const trafficTotalWidget = store.get().trafficTotalWidget;

  const container = document.getElementById('dashboard-widget-traffic-total');

  if (trafficTotalWidget.loading || trafficTotalWidget.failed) {
    const renderedWidget = renderWidget({
      loading: trafficTotalWidget.loading,
      failed: trafficTotalWidget.failed,
      title: '',
      items: [],
    });

    return container!.replaceChildren(renderedWidget);
  }

  const renderedWidget = renderWidget({
    loading: trafficTotalWidget.loading,
    failed: trafficTotalWidget.failed,
    title: _('Traffic Total'),
    items: [
      {
        key: _('Uplink'),
        value: String(prettyBytes(trafficTotalWidget.data.uploadTotal)),
      },
      {
        key: _('Downlink'),
        value: String(prettyBytes(trafficTotalWidget.data.downloadTotal)),
      },
    ],
  });

  container!.replaceChildren(renderedWidget);
}

async function renderSystemInfoWidget() {
  logger.debug('[DASHBOARD]', 'renderSystemInfoWidget');
  const systemInfoWidget = store.get().systemInfoWidget;

  const container = document.getElementById('dashboard-widget-system-info');

  if (systemInfoWidget.loading || systemInfoWidget.failed) {
    const renderedWidget = renderWidget({
      loading: systemInfoWidget.loading,
      failed: systemInfoWidget.failed,
      title: '',
      items: [],
    });

    return container!.replaceChildren(renderedWidget);
  }

  const renderedWidget = renderWidget({
    loading: systemInfoWidget.loading,
    failed: systemInfoWidget.failed,
    title: _('System info'),
    items: [
      {
        key: _('Active Connections'),
        value: String(systemInfoWidget.data.connections),
      },
      {
        key: _('Memory Usage'),
        value: String(prettyBytes(systemInfoWidget.data.memory)),
      },
    ],
  });

  container!.replaceChildren(renderedWidget);
}

async function renderServicesInfoWidget() {
  logger.debug('[DASHBOARD]', 'renderServicesInfoWidget');
  const servicesInfoWidget = store.get().servicesInfoWidget;

  const container = document.getElementById('dashboard-widget-service-info');

  if (servicesInfoWidget.loading || servicesInfoWidget.failed) {
    const renderedWidget = renderWidget({
      loading: servicesInfoWidget.loading,
      failed: servicesInfoWidget.failed,
      title: '',
      items: [],
    });

    return container!.replaceChildren(renderedWidget);
  }

  const renderedWidget = renderWidget({
    loading: servicesInfoWidget.loading,
    failed: servicesInfoWidget.failed,
    title: _('Services info'),
    items: [
      {
        key: _('NetShift'),
        value: servicesInfoWidget.data.netshift
          ? _('✔ Enabled')
          : _('✘ Disabled'),
        attributes: {
          class: servicesInfoWidget.data.netshift
            ? 'pdk_dashboard-page__widgets-section__item__row--success'
            : 'pdk_dashboard-page__widgets-section__item__row--error',
        },
      },
      {
        key: _('Sing-box'),
        value: servicesInfoWidget.data.singbox
          ? _('✔ Running')
          : _('✘ Stopped'),
        attributes: {
          class: servicesInfoWidget.data.singbox
            ? 'pdk_dashboard-page__widgets-section__item__row--success'
            : 'pdk_dashboard-page__widgets-section__item__row--error',
        },
      },
    ],
  });

  container!.replaceChildren(renderedWidget);
}

async function onStoreUpdate(
  next: StoreType,
  prev: StoreType,
  diff: Partial<StoreType>,
) {
  if (diff.sectionsWidget) {
    renderSectionsWidget();
  }

  if (diff.bandwidthWidget) {
    renderBandwidthWidget();
  }

  if (diff.trafficTotalWidget) {
    renderTrafficTotalWidget();
  }

  if (diff.systemInfoWidget) {
    renderSystemInfoWidget();
  }

  if (diff.servicesInfoWidget) {
    renderServicesInfoWidget();
  }
}

async function onPageMount() {
  // Cleanup before mount
  onPageUnmount();

  // Add new listener
  store.subscribe(onStoreUpdate);

  // Initial sections fetch
  await fetchDashboardSections();
  await fetchServicesInfo();
  await connectToClashSockets();
}

function onPageUnmount() {
  activePingTags.clear();
  subscriptionUpdatingSections.clear();
  // Remove old listener
  store.unsubscribe(onStoreUpdate);
  // Clear store
  store.reset([
    'bandwidthWidget',
    'trafficTotalWidget',
    'systemInfoWidget',
    'servicesInfoWidget',
    'sectionsWidget',
  ]);
  socket.resetAll();
}

function registerLifecycleListeners() {
  store.subscribe((next, prev, diff) => {
    if (
      diff.tabService &&
      next.tabService.current !== prev.tabService.current
    ) {
      logger.debug(
        '[DASHBOARD]',
        'active tab diff event, active tab:',
        diff.tabService.current,
      );
      const isDashboardVisible = next.tabService.current === 'dashboard';

      if (isDashboardVisible) {
        logger.debug(
          '[DASHBOARD]',
          'registerLifecycleListeners',
          'onPageMount',
        );
        return onPageMount();
      }

      if (!isDashboardVisible) {
        logger.debug(
          '[DASHBOARD]',
          'registerLifecycleListeners',
          'onPageUnmount',
        );
        return onPageUnmount();
      }
    }
  });
}

export async function initController(): Promise<void> {
  onMount('dashboard-status').then(() => {
    logger.debug('[DASHBOARD]', 'initController', 'onMount');
    onPageMount();
    registerLifecycleListeners();
  });
}
