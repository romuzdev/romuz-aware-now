/**
 * Performance: Error Boundary
 * 
 * Prevents entire app crashes and provides fallback UI
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Error Boundary]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-semibold mb-2">حدث خطأ غير متوقع</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            نعتذر عن الإزعاج. حدث خطأ أثناء عرض هذه الصفحة.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              إعادة تحميل الصفحة
            </button>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 border border-input rounded-md hover:bg-accent"
            >
              المحاولة مرة أخرى
            </button>
          </div>
          {import.meta.env.DEV && this.state.error && (
            <details className="mt-6 text-left max-w-2xl w-full">
              <summary className="cursor-pointer text-sm text-muted-foreground mb-2">
                عرض تفاصيل الخطأ
              </summary>
              <pre className="bg-muted p-4 rounded-md text-xs overflow-auto">
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
