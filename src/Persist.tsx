import React, { useContext, useEffect } from 'react';
import PersistContext from './PersistContext';

interface PersistProps {
  persist: boolean;
  onShow: Function;
  onHide: Function;
}

const Persist: React.FC<PersistProps> = (props) => {
  const { persist, onShow, onHide } = props;
  const { history, isShow } = useContext(PersistContext);

  useEffect(() => {
    (history as any).persist = persist;
  }, [persist]);

  useEffect(() => {
    let fn: Function;
    if (isShow) fn = onShow();
    return () => {
      if (isShow) {
        if (typeof fn === 'function') {
          fn();
        }
        onHide();
      }
    };
  }, [isShow]);
  return null;
};

Persist.defaultProps = {
  persist: true,
  onShow: () => undefined,
  onHide: () => undefined,
};

export default Persist;
