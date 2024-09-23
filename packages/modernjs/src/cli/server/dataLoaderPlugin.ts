import type { ServerPlugin } from '@modern-js/server-core';
import { init } from '@module-federation/enhanced/runtime';
import { isBrowserEnv } from '@module-federation/sdk';
import {
  fetchRemoteFullRoutesMap,
  getSSRByRouteIds,
} from './fetchRemoteFullRoutesMap';
import {
  type LoaderBundlesRoutes,
  type NestedRoutes,
  injectRemoteRoutes,
} from '../../runtime/dataLoader/utils';

import {
  MF_ROUTES,
  DEFAULT_ENTRY,
  MODERN_JS_ROUTE_SERVER_LOADER,
} from '../../constant';

type MFRuntimeOptions = Parameters<typeof init>[0];

export type DataLoaderServerPluginOptions = {
  runtimeOptions: MFRuntimeOptions;
  dataLoaderRemotes: string[];
  ssrByRouteIdsMap: Record<string, string>;
};

export default ({
  runtimeOptions,
  dataLoaderRemotes,
  ssrByRouteIdsMap,
}: DataLoaderServerPluginOptions): ServerPlugin => ({
  name: 'MFDataLoaderServerPlugin',
  pre: ['@modern-js/plugin-inject-resource'],
  setup(api) {
    const { remotes, name } = runtimeOptions;
    let isHandled = false;
    return {
      prepare() {
        const { middlewares } = api.useAppContext();
        middlewares.push({
          name: 'a',
          handler: async (c, next) => {
            const serverManifest = c.get('serverManifest');
            const { loaderBundles, nestedRoutesJson } = serverManifest;
            console.log('server plugin ', isHandled, loaderBundles);
            if (isHandled && !globalThis.FORCE_MF_REFRESH) {
              await next();
            } else {
              const instance = init({
                name: name,
                remotes,
              });
              const remoteFullRoutesMap = await fetchRemoteFullRoutesMap({
                instance,
                remotePath: isBrowserEnv()
                  ? `${DEFAULT_ENTRY}/${MF_ROUTES}`
                  : `${DEFAULT_ENTRY}/${MODERN_JS_ROUTE_SERVER_LOADER}`,
                dataLoaderRemotes,
              });

              const originalSSRByRouteIds =
                api.useConfigContext().server?.ssrByRouteIds;
              if (originalSSRByRouteIds && dataLoaderRemotes.length) {
                const remoteSSRByRouteIds =
                  getSSRByRouteIds(dataLoaderRemotes, remoteFullRoutesMap) ||
                  [];
                const ssrByRouteIds = new Set([
                  ...originalSSRByRouteIds,
                  ...remoteSSRByRouteIds.map(
                    (id) => ssrByRouteIdsMap[id] || id,
                  ),
                ]);
                api.useConfigContext().server!.ssrByRouteIds =
                  Array.from(ssrByRouteIds);
              }

              injectRemoteRoutes(
                loaderBundles as unknown as LoaderBundlesRoutes,
                remoteFullRoutesMap,
              );
              injectRemoteRoutes(
                nestedRoutesJson as unknown as NestedRoutes,
                remoteFullRoutesMap,
              );
              isHandled = true;
              globalThis.FORCE_MF_REFRESH = false;
              await next();
            }
          },
          before: ['render'],
        });
      },
    };
  },
});
