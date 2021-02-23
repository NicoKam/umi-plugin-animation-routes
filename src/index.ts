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
    if (api.config?.animationRoutes?.kHistory) {
      return {
        ...config,
        alias: { ...config.alias, 'history-with-query': resolve(api.paths.absNodeModulesPath!, 'k-history', 'lib') },
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
