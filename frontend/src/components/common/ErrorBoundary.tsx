import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  handleReload = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900 p-8 text-center shadow-lg">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              An unexpected error occurred
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-mono break-all">
              {this.state.message || 'Unknown error'}
            </p>
            <button
              onClick={this.handleReload}
              className="px-4 py-2 text-xs font-semibold bg-[#1e3a8a] text-white rounded-lg hover:bg-[#1e3a8a]/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
