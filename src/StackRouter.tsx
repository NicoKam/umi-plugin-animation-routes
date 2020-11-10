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
    goStep: 0,
    lastHistoryKey: history.location.state?._historyKey ?? 0,
    lastLastHistoryKey: history.location.state?._historyKey ?? 0,
  }).current;

  useEffect(() => {
    injectHistory(history, (goStep) => {
      _this.goStep = goStep;
    });
    return history.listen((newLocation: any, _action: string) => {
      let action = _action;
      if (_this.goStep) {
        go(_this.goStep);
        _this.goStep = 0;
      } else {
        const curKey = newLocation.state?._historyKey ?? 0;

        /* fix: 浏览器前进后退时，action总是为'POP'， */
        if (_this.lastHistoryKey !== curKey && action === 'POP') {
          if (curKey > _this.lastHistoryKey) {
            /* 如果key增加了，说明时进行了前进操作 */
            action = 'PUSH';
          }
        }
        _this.lastHistoryKey = curKey;
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

  const classNames = `stack-routes-anim-${_this.lastLastHistoryKey - _this.lastHistoryKey < 0 ? 'push' : 'pop'}`;
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
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: _index }}>
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
