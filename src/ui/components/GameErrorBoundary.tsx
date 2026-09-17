import { Component, type ReactNode } from 'react';
import { ErrorState } from './index';
/** Keep a failed content module inside the game frame. */
export class GameErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <ErrorState onRetry={() => this.setState({ failed: false })} />
    ) : (
      this.props.children
    );
  }
}
