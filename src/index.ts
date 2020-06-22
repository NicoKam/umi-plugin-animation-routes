import { IApi } from 'umi';
import { resolve } from 'path';

export default (api: IApi) => {
  // const logger = {
  //   info(...args: any[]) {
  //     api.logger.info('[plugin-cordova]', ...args);
  //   },
  //   log(...args: any[]) {
  //     api.logger.log('[plugin-cordova]', ...args);
  //   },
  //   error(...args: any[]) {
  //     api.logger.error('[plugin-cordova]', ...args);
  //   },
  // };
  // api.describe({
  //   key: 'stackRoutes',
  //   config: {
  //     schema(joi) {
  //       return joi.object({});
  //     },
  //   },
  // });

  api.modifyRendererPath(() => {
    return resolve(__dirname, 'clientRender');
  });
  api.addUmiExports(() => ({
    source: resolve(__dirname, 'pluginPersist'),
    specifiers: ['Persist'],
  }));
};
