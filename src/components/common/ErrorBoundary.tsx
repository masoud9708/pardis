import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    // If it's a known extension error, don't show the error boundary UI
    const msg = String(error?.message || '');
    if (
      msg.includes('MetaMask') ||
      msg.includes('metamask') ||
      msg.includes('ethereum') ||
      msg.includes('message port closed')
    ) {
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const msg = String(error?.message || '');
    if (
      msg.includes('MetaMask') ||
      msg.includes('metamask') ||
      msg.includes('ethereum') ||
      msg.includes('message port closed')
    ) {
      return;
    }
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-right" dir="rtl">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-800 mb-2">خطایی در بارگذاری بخشی از سامانه رخ داد</h2>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              ارتباط با سرور یا افزونه مرورگر دچار اختلال موقت شده است. لطفاً صفحه را تازه‌سازی نمایید.
            </p>
            <button
              onClick={this.handleReload}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition shadow-sm cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>بارگذاری مجدد صفحه</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
