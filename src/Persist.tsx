import React, { useRef, useEffect } from 'react';
import PersistContext from './PersistContext';

interface PersistProps {
  persist: boolean;
}

const Persist: React.FC<PersistProps> = (props) => {
  const { persist } = props;
  const ref = useRef<any>();
  useEffect(() => {
    ref.current.persist = persist;
  }, [persist]);
  return (
    <PersistContext.Consumer>
      {({ history }) => {
        ref.current = history;
        return null;
      }}
    </PersistContext.Consumer>
  );
};

Persist.defaultProps = {
  persist: true,
};

export default Persist;
