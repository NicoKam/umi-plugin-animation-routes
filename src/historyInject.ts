export type noop = (...args: any[]) => any;

export type numHandle = (n: number) => void;

class RoutesBlocker {
  listeners: (string | noop)[] = [];

  block = (argv: string | noop) => {
    this.listeners.push(argv);
    return () => {
      const index = this.listeners.findIndex(v => v === argv);
      this.listeners.splice(index, 1);
    };
  };

  canLeave = async (...args: any[]): Promise<boolean> => {
    for (let i = 0; i < this.listeners.length; i += 1) {
      const listener = this.listeners[i];
      let res;
      if (typeof listener === 'string') {
        res = window.confirm(listener);
      } else {
        res = await listener(...args);
      }
      if (res === false) {
        return false;
      }
    }
    return true;
  };
}

const blocker = new RoutesBlocker();

function wrapBlocker(target: any, funcName: string): void {
  const originFunc = target[funcName].bind(target);
  target[funcName] = (...args: any[]): void => {
    blocker.canLeave(funcName, args).then((ok) => {
      if (ok) originFunc(...args);
    });
  };
}

/**
 * 为history对象拦截go方法
 * @param history created by createBrowserHistory()
 */
export function injectHistory(history: any, onGoStep: numHandle = () => undefined): void {
  console.warn('history has been injected by umi-plugin-animation-routes');
  const originGo = history.go.bind(history);
  history.go = (num: number) => {
    blocker.canLeave('go', [num]).then((ok) => {
      if (ok) {
        onGoStep(num);
        originGo(num);
      }
    });
  };

  const originPush = history.push;
  history.push = (v1: any, state: any) => {
    const argType = typeof v1 === 'string' ? 'url' : 'object';
    const curKey = history.location.state?._historyKey ?? 0;
    // console.debug('curKey', curKey);
    if (argType === 'url') {
      return originPush.call(history, v1, { ...state, _historyKey: curKey + 1 });
    }
    return originPush.call({
      ...v1,
      state: {
        ...v1,
        _historyKey: curKey + 1,
      },
    });
  };

  /* wrap all function */
  ['replace', 'goBack', 'goForward'].forEach((funcName) => {
    wrapBlocker(history, funcName);
  });

  /* change block function */
  history.originBlock = history.block;
  history.block = blocker.block;
}
