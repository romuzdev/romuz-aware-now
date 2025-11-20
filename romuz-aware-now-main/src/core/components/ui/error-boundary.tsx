/**
 * Error Boundary Component
 * Catches and displays errors gracefully
 */

import { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent } from '@/core/components/ui/card';

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

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-destructive/10 p-4 mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">حدث خطأ غير متوقع</h3>
            <p className="text-sm text-muted-foreground text-center mb-2 max-w-sm">
              عذراً، حدث خطأ أثناء تحميل هذا المكون. يرجى المحاولة مرة أخرى.
            </p>
            {this.state.error && (
              <p className="text-xs text-muted-foreground text-center mb-6 font-mono max-w-md">
                {this.state.error.message}
              </p>
            )}
            <Button onClick={this.handleReset} variant="outline">
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
