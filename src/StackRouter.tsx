import React, { useEffect, useRef, useContext } from 'react';
import { __RouterContext as RouterContext } from 'react-router';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import invariant from 'tiny-invariant';
import { useHistoryStack } from './hooks';
import { injectHistory } from './historyInject';
import PersistContext from './PersistContext';
import '../styles/StackRouter.less';
import ShouldUpdate from './ShouldUpdate';

interface StackRouterProps {
  routerContext: any;
}

const StackRouter: React.FC<StackRouterProps> = (props) => {
  const context = useContext(RouterContext);
  invariant(context, 'You should not use <StackRouter> outside a <Router>');
  const { history, staticContext, match } = context;
  const [historyStack, offsetIndex, { push, replace, pop, go }] = useHistoryStack(history);
  const _this = useRef({
    // 主动调用go方法时记录go的长度
    goStep: 0,
    // 是否使用动画(临时)
    useAnimation: true,
    lastHistoryKey: history.location.state?._historyKey ?? 0,
    lastLastHistoryKey: history.location.state?._historyKey ?? 0,
  }).current;

  useEffect(() => {
    injectHistory(history, {
      onGoStep: (goStep, options) => {
        const { animation } = options;
        if (animation === false) _this.useAnimation = false;
        _this.goStep = goStep;
      },
    });
    return history.listen((newLocation: any, _action: string) => {
      console.log('changed', newLocation);
      let action = _action;

      const curKey = newLocation.state?._historyKey ?? 0;

      // console.log(_this.lastHistoryKey, curKey);

      /* fix: 浏览器前进后退时，action总是为'POP'， */
      if (_this.lastHistoryKey !== curKey && action === 'POP') {
        if (curKey > _this.lastHistoryKey) {
          /* 如果key增加了，说明时进行了前进操作 */
          action = 'PUSH';
        }
      }
      if (curKey === _this.lastHistoryKey) {
        action = 'REPLACE';
      }
      _this.lastHistoryKey = curKey;
      if (_this.useAnimation === false) {
        _this.lastLastHistoryKey = _this.lastHistoryKey;
        _this.useAnimation = true;
      }

      if (_this.goStep) {
        /* 有明确的前进后退标识 */
        go(_this.goStep);
        _this.goStep = 0;
      } else {
        switch (action) {
          case 'PUSH':
            push();
            break;
          case 'POP':
            pop();
            break;
          case 'REPLACE':
            replace();
            break;
          default:
            push();
        }
      }
    });
  }, [history]);

  // console.log(_this.lastLastHistoryKey, _this.lastHistoryKey);

  const classNames = `stack-routes-anim-${(() => {
    const keyChanged = _this.lastLastHistoryKey - _this.lastHistoryKey;
    if (keyChanged < 0) return 'push';
    if (keyChanged > 0) return 'pop';
    return 'no-changed';
  })()}`;
  _this.lastLastHistoryKey = _this.lastHistoryKey;
  return (
    <TransitionGroup childFactory={child => React.cloneElement(child, { classNames })}>
      {historyStack.map((h, _index) => {
        const curHistory = _index === historyStack.length - 1 ? history : h;
        const curLocation = h.location;
        const isShow = _index === historyStack.length - 1;
        // const historyKey = h.location.state?._historyKey ?? 0;
        const key = offsetIndex + _index;
        if (!isShow && !h.persist) return null;
        return (
          <CSSTransition key={key} timeout={200}>
            {/* double transition support persist mode */}
            <CSSTransition in={isShow} timeout={200} classNames={classNames}>
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: _index }}>
                <PersistContext.Provider value={{ history: h, isShow }}>
                  <ShouldUpdate canUpdate={isShow}>
                    <RouterContext.Provider
                      value={{
                        history: curHistory,
                        location: curLocation,
                        match,
                        staticContext,
                      }}
                    >
                      {props.children}
                    </RouterContext.Provider>
                  </ShouldUpdate>
                </PersistContext.Provider>
              </div>
            </CSSTransition>
          </CSSTransition>
        );
      })}
    </TransitionGroup>
  );
};

export default StackRouter;
