import React, { Component } from 'react';
import { Button } from '../ui/Button.jsx';
import { AlertCircleIcon } from '../icons/index.jsx';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught error:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
          <div className="rounded-full bg-[#FEE2E2] p-4 text-[#991B1B] mb-4">
            <AlertCircleIcon className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-serif font-bold text-[#0F3336]">
            Application Error
          </h2>
          <p className="mt-2 max-w-md text-xs sm:text-sm text-[#4D6B6D] leading-relaxed">
            An unexpected error occurred while rendering this view. Your health records are safe.
          </p>
          <div className="mt-6">
            <Button onClick={this.handleReset} variant="primary">
              Reload Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
