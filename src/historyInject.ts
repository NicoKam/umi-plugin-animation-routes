export type noop = (...args: any[]) => any;

export type NumHandle = (n: number, options: any) => void;

class RoutesBlocker {
  blocking = false;

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
        /* 如果当前正在blocking，则不允许再触发 */
        if (this.blocking) return false;
        this.blocking = true;
        try {
          res = await listener(...args);
        } catch (error) {
          return false;
        } finally {
          this.blocking = false;
        }
      }
      if (res === false) {
        return false;
      }
    }
    return true;
  };
}

const blocker = new RoutesBlocker();

export type InjectOptions = {
  onGoStep?: NumHandle;
  beforeHistoryChange?: Function;
};

/**
 * 为history对象拦截go方法
 * @param history created by createBrowserHistory()
 */
export function injectHistory(history: any, options: InjectOptions = {}): void {
  console.warn('history has been injected by umi-plugin-animation-routes');
  const { onGoStep = () => undefined } = options;

  /* 记录是否页面主动切换路由 */
  let initiative = false;

  function beforeHistoryChange() {
    initiative = true;
  }

  function wrapBlocker(target: any, funcName: string): void {
    const originFunc = target[funcName].bind(target);
    target[funcName] = (arg1: any, arg2: any, physical: boolean): void => {
      blocker.canLeave(funcName, [], physical).then((ok) => {
        if (ok) {
          beforeHistoryChange();
          originFunc();
        }
      });
    };
  }

  const originGo = history.go.bind(history);
  history.go = (num: number, args = {}) => {
    blocker.canLeave('go', [num]).then((ok) => {
      if (ok) {
        onGoStep(num, args);
        beforeHistoryChange();
        originGo(num);
      }
    });
  };

  const originPush = history.push;
  history.push = (v1: any, state: any, physical: boolean) => {
    const argType = typeof v1 === 'string' ? 'url' : 'object';
    const curKey = history.location.state?._historyKey ?? 0;

    blocker.canLeave('push', [v1, state], physical).then((ok) => {
      if (ok) {
        beforeHistoryChange();
        if (argType === 'url') {
          originPush.call(history, v1, { ...state, _historyKey: curKey + 1 });
        } else {
          originPush.call(history, {
            ...v1,
            state: {
              ...v1,
              _historyKey: curKey + 1,
            },
          });
        }
      }
    });
  };

  const originReplace = history.replace;
  history.replace = (v1: any, state: any) => {
    const argType = typeof v1 === 'string' ? 'url' : 'object';
    const curKey = history.location.state?._historyKey ?? 0;
    blocker.canLeave('replace', [v1, state]).then((ok) => {
      if (ok) {
        beforeHistoryChange();
        if (argType === 'url') {
          originReplace.call(history, v1, { ...state, _historyKey: curKey });
        } else {
          originReplace.call(history, {
            ...v1,
            state: {
              ...v1,
              _historyKey: curKey,
            },
          });
        }
      }
    });
  };

  /* wrap all function */
  ['goBack', 'goForward'].forEach((funcName) => {
    wrapBlocker(history, funcName);
  });

  /* change block function */
  history.originBlock = history.block;
  history.block = blocker.block;

  let lastKey = history.location.state?._historyKey ?? 0;

  history.listen((newLocation: any) => {
    const nextKey = newLocation.state?._historyKey ?? 0;
    lastKey = nextKey;
  });

  /* block origin block */
  history.originBlock((newLocation: any) => {
    // console.log(newLocation);
    if (initiative === false) {
      /* 非主动切换路由（浏览器前进后退） */
      const needBlock = blocker.listeners.length > 0;
      if (needBlock) {
        const nextKey = newLocation.state?._historyKey ?? 0;

        /* 判断当前点击的是前进/后退 */
        const isForward = nextKey > lastKey;
        if (isForward) {
          const { key: nouse, ...otherLocationProps } = newLocation;
          history.push(otherLocationProps, undefined, true);
        } else {
          history.goBack(undefined, undefined, true);
        }
        return false;
      }
    }
    initiative = false;
    return true;
  });
}
