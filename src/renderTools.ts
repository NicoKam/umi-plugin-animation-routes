import { useRef, useCallback, useState } from 'react';

export function cloneHistory(history: any) {
  // const historyShadow = JSON.parse(JSON.stringify(history));
  const historyShadow = { ...history };
  return historyShadow;
}

export type noop = (...args: any[]) => any;

export function usePersistFn<T extends noop>(fn: T) {
  const ref = useRef<any>(() => {
    throw new Error('Cannot call function while rendering.');
  });

  ref.current = fn;

  const persistFn = useCallback(((...args) => ref.current(...args)) as T, [ref]);

  return persistFn;
}

export function useOState<T extends object>(initialObj: T = {} as T): [T, (o: Partial<T>) => void] {
  const [state, setState] = useState(initialObj);
  const setOState = usePersistFn((obj) => {
    setState({
      ...state,
      ...obj,
    });
  });
  return [state, setOState];
}

function repeat<T>(item: T, num: number = 1): T[] {
  const res: T[] = [] as T[];
  for (let i = 0; i < num; i += 1) {
    res.push(item);
  }
  return res;
}

export function useHistoryStack(
  history: any,
  initStack: any[] = [],
  initIndex: number = 0,
): [any[], number, { push: noop; pop: noop; replace: noop; go: noop }] {
  const [{ offset, index, historyStack }, setState] = useOState({
    offset: 0,
    index: initIndex,
    historyStack: initStack,
  });
  const currStack = historyStack.slice(0, index);
  const push = usePersistFn((num: number = 1) => {
    setState({
      historyStack: [...currStack, ...repeat(cloneHistory(history), num)],
      index: index + 1,
    });
  });
  const replace = usePersistFn(() => {
    if (currStack.length === 0) {
      console.error('history replace error: stack size(0)');
      return;
    }
    setState({
      historyStack: [...currStack.slice(0, currStack.length - 1), cloneHistory(history)],
    });
  });
  const pop = usePersistFn((num: number = 1) => {
    if (index > num) {
      setState({
        index: index - num,
      });
    } else {
      /* 特殊情况，在中间的位置刷新了，导致之前的栈丢失，这种情况就需要从history中填充数据 */
      setState({
        historyStack: [cloneHistory(history)],
        offset: offset + index - num - 1,
        index: 1,
      });
    }
  });

  const go = usePersistFn((num: number) => {
    if (num > 0) {
      push(num);
    } else if (num < 0) {
      pop(-num);
    } else {
      /* do nothing */
    }
  });

  return [
    currStack,
    offset,
    {
      push,
      replace,
      pop,
      go,
    },
  ];
}
