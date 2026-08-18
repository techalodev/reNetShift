import { getConfigSections } from './getConfigSections';
import { NetShift } from '../../types';
import { getProxyUrlName, splitProxyString } from '../../../helpers';
import { NetShiftShellMethods } from '../shell';

interface IGetDashboardSectionsResponse {
  success: boolean;
  data: NetShift.OutboundGroup[];
}

function matchesProxyCode(proxyKey: string, targetCode: string): boolean {
  if (!proxyKey || !targetCode) return false;
  if (proxyKey === targetCode) return true;
  try {
    if (decodeURIComponent(proxyKey) === decodeURIComponent(targetCode)) return true;
  } catch (_) {}
  try {
    if (decodeURIComponent(proxyKey) === targetCode || proxyKey === decodeURIComponent(targetCode)) return true;
  } catch (_) {}
  return false;
}

function findProxy(
  proxies: Array<{ code: string; value: any }>,
  targetCode: string,
) {
  return proxies.find(
    (p) =>
      matchesProxyCode(p.code, targetCode) ||
      (p.value?.name && matchesProxyCode(p.value.name, targetCode)),
  );
}

export async function getDashboardSections(): Promise<IGetDashboardSectionsResponse> {
  const configSections = await getConfigSections();
  const clashProxies = await NetShiftShellMethods.getClashApiProxies();
  const metaRes = await NetShiftShellMethods.getSubscriptionMetadata().catch(
    () => null,
  );
  const allMeta =
    metaRes && metaRes.success ? (metaRes.data as Record<string, NetShift.SubscriptionMetadata>) : {};

  if (!clashProxies.success) {
    return {
      success: false,
      data: [],
    };
  }

  const proxies = Object.entries(clashProxies.data.proxies).map(
    ([key, value]) => ({
      code: key,
      value,
    }),
  );

  const data = configSections
    .filter(
      (section) =>
        section.connection_type !== 'block' &&
        section.connection_type !== 'exclusion' &&
        section['.type'] !== 'settings',
    )
    .map((section) => {
      const sectionName = section['.name'];

      if (section.connection_type === 'proxy') {
        if (section.proxy_config_type === 'url') {
          const outbound = findProxy(proxies, sectionName + '-out');
          const activeConfigs = splitProxyString(section.proxy_string);
          const proxyDisplayName =
            getProxyUrlName(activeConfigs?.[0]) || outbound?.value?.name || '';

          return {
            withTagSelect: false,
            code: outbound?.code || sectionName,
            displayName: sectionName,
            sectionName: sectionName,
            isSubscription: false,
            outbounds: [
              {
                code: outbound?.code || sectionName,
                displayName: proxyDisplayName,
                latency: outbound?.value?.history?.[0]?.delay || 0,
                type: outbound?.value?.type || '',
                selected: true,
              },
            ],
          };
        }

        if (section.proxy_config_type === 'outbound') {
          const outbound = findProxy(proxies, sectionName + '-out');
          const parsedOutbound = JSON.parse(section.outbound_json);
          const parsedTag = parsedOutbound?.tag
            ? decodeURIComponent(parsedOutbound?.tag)
            : undefined;
          const proxyDisplayName = parsedTag || outbound?.value?.name || '';

          return {
            withTagSelect: false,
            code: outbound?.code || sectionName,
            displayName: sectionName,
            sectionName: sectionName,
            isSubscription: false,
            outbounds: [
              {
                code: outbound?.code || sectionName,
                displayName: proxyDisplayName,
                latency: outbound?.value?.history?.[0]?.delay || 0,
                type: outbound?.value?.type || '',
                selected: true,
              },
            ],
          };
        }

        if (section.proxy_config_type === 'selector') {
          const selector = findProxy(proxies, sectionName + '-out');
          const links = section.selector_proxy_links ?? [];

          const outbounds = links
            .map((link, index) => ({
              link,
              outbound: findProxy(proxies, sectionName + '-' + (index + 1) + '-out'),
            }))
            .map((item) => ({
              code: item?.outbound?.code || '',
              displayName:
                getProxyUrlName(item.link) || item?.outbound?.value?.name || '',
              latency: item?.outbound?.value?.history?.[0]?.delay || 0,
              type: item?.outbound?.value?.type || '',
              selected: matchesProxyCode(selector?.value?.now || '', item?.outbound?.code || ''),
            }));

          return {
            withTagSelect: true,
            code: selector?.code || sectionName,
            displayName: sectionName,
            sectionName: sectionName,
            isSubscription: false,
            outbounds,
          };
        }

        if (section.proxy_config_type === 'urltest') {
          const selector = findProxy(proxies, sectionName + '-out');
          const outbound = findProxy(proxies, sectionName + '-urltest-out');

          const outbounds = (outbound?.value?.all ?? [])
            .map((code: string) => findProxy(proxies, code))
            .filter(Boolean)
            .map((item: any, index: number) => ({
              code: item?.code || '',
              displayName:
                getProxyUrlName(section.urltest_proxy_links?.[index]) ||
                item?.value?.name ||
                decodeURIComponent(item?.code || ''),
              latency: item?.value?.history?.[0]?.delay || 0,
              type: item?.value?.type || '',
              selected: matchesProxyCode(selector?.value?.now || '', item?.code || ''),
            }));

          return {
            withTagSelect: true,
            code: selector?.code || sectionName,
            displayName: sectionName,
            sectionName: sectionName,
            isSubscription: false,
            outbounds: [
              {
                code: outbound?.code || '',
                displayName: _('Fastest'),
                latency: outbound?.value?.history?.[0]?.delay || 0,
                type: outbound?.value?.type || '',
                selected: matchesProxyCode(selector?.value?.now || '', outbound?.code || ''),
              },
              ...outbounds,
            ],
          };
        }

        if (section.proxy_config_type === 'subscription') {
          const selector = findProxy(proxies, sectionName + '-out');
          const fallbackUrltest = findProxy(proxies, sectionName + '-urltest-out');

          const selectorOutbounds = (selector?.value?.all ?? []).flatMap(
            (code: string) => {
              const item = findProxy(proxies, code);
              if (!item) {
                return [];
              }

              const isLegacyFastest =
                matchesProxyCode(item.code, sectionName + '-urltest-out') ||
                item.value?.name?.toLowerCase() === 'urltest' ||
                item.value?.type?.toLowerCase() === 'urltest';

              return [
                {
                  code: item.code,
                  displayName: isLegacyFastest
                    ? _('Fastest')
                    : item?.value?.name || decodeURIComponent(item.code),
                  latency: item?.value?.history?.[0]?.delay || 0,
                  type: item?.value?.type || '',
                  selected: matchesProxyCode(selector?.value?.now || '', item.code),
                },
              ];
            },
          );

          const outbounds = [
            ...selectorOutbounds.filter(
              (item: any) => item.type?.toLowerCase() === 'urltest',
            ),
            ...selectorOutbounds.filter(
              (item: any) => item.type?.toLowerCase() !== 'urltest',
            ),
          ];

          if (outbounds.length === 0 && fallbackUrltest) {
            const fallbackOutbounds = (fallbackUrltest?.value?.all ?? [])
              .map((code: string) => findProxy(proxies, code))
              .filter(Boolean)
              .map((item: any) => ({
                code: item!.code,
                displayName: item!.value?.name || decodeURIComponent(item!.code),
                latency: item!.value?.history?.[0]?.delay || 0,
                type: item!.value?.type || '',
                selected: matchesProxyCode(selector?.value?.now || '', item!.code),
              }));

            outbounds.push(
              {
                code: fallbackUrltest.code,
                displayName: _('Fastest'),
                latency: fallbackUrltest.value?.history?.[0]?.delay || 0,
                type: fallbackUrltest.value?.type || '',
                selected: matchesProxyCode(selector?.value?.now || '', fallbackUrltest.code),
              },
              ...fallbackOutbounds,
            );
          }

          if (outbounds.length === 0) {
            const systemProxies = new Set([
              'DIRECT',
              'GLOBAL',
              'REJECT',
              'dns-out',
              'direct-out',
              'block-out',
              sectionName + '-out',
            ]);
            const discovered = proxies
              .filter(
                (p) => !systemProxies.has(p.code) && !p.code.endsWith('-urltest-out'),
              )
              .map((p) => ({
                code: p.code,
                displayName: p.value?.name || decodeURIComponent(p.code),
                latency: p.value?.history?.[0]?.delay || 0,
                type: p.value?.type || '',
                selected: matchesProxyCode(selector?.value?.now || '', p.code),
              }));
            outbounds.push(...discovered);
          }

          return {
            withTagSelect: true,
            code: selector?.code || (sectionName + '-out'),
            displayName: sectionName,
            sectionName: sectionName,
            isSubscription: true,
            subscriptionMetadata: allMeta[sectionName],
            outbounds,
          };
        }
      }

      if (section.connection_type === 'vpn') {
        const outbound = findProxy(proxies, sectionName + '-out');

        return {
          withTagSelect: false,
          code: outbound?.code || sectionName,
          displayName: sectionName,
          sectionName: sectionName,
          isSubscription: false,
          outbounds: [
            {
              code: outbound?.code || sectionName,
              displayName: section.interface || outbound?.value?.name || '',
              latency: outbound?.value?.history?.[0]?.delay || 0,
              type: outbound?.value?.type || '',
              selected: true,
            },
          ],
        };
      }

      return {
        withTagSelect: false,
        code: sectionName,
        displayName: sectionName,
        sectionName: sectionName,
        isSubscription: false,
        outbounds: [],
      };
    });

  return {
    success: true,
    data,
  };
}
