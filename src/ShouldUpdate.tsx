import React from 'react';

interface ShouldUpdateProps {
  canUpdate: boolean;
}

class ShouldUpdate extends React.Component<ShouldUpdateProps> {
  static defaultProps = {
    canUpdate: true,
  };

  shouldComponentUpdate(nextProps: ShouldUpdateProps) {
    const { canUpdate } = nextProps;
    return canUpdate;
  }

  render() {
    const { children } = this.props;
    return children;
  }
}

export default ShouldUpdate;
