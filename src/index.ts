import { IApi } from 'umi';
import { resolve } from 'path';

export default (api: IApi) => {
  api.describe({
    key: 'animationRoutes',
    config: {
      schema(joi) {
        return joi.object({
          kHistory: joi.boolean(),
        });
      },
    },
  });

  api.addHTMLScripts(() => {
    if (api.config?.animationRoutes?.kHistory) {
      return [{ content: 'window.__animation_routes_use_k_history = true' }];
    }
    return [];
  });

  api.modifyConfig((config) => {
    if (config.animationRoutes?.kHistory) {
      const kHistoryPath = resolve(api.paths.absNodeModulesPath!, 'k-history', 'lib');
      api.logger.warn(`You are using plugin-animation-routes with k-history, 'history-with-query' is mapping to [${kHistoryPath}]`);
      return {
        ...config,
        alias: { ...config.alias, 'history-with-query': kHistoryPath },
      };
    }
    return { ...config };
  });

  api.modifyRendererPath(() => {
    return resolve(__dirname, 'clientRender');
  });
  api.addUmiExports(() => ({
    source: resolve(__dirname, 'pluginPersist'),
    specifiers: ['Persist'],
  }));
};
