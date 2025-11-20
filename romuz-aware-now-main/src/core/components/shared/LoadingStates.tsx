/**
 * Unified Loading States
 * Gate-K: D1 Standard - Phase 6 Unification
 * 
 * Centralized loading skeletons and spinners for consistent UX
 */

import { Skeleton } from '@/core/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/core/components/ui/card';
import { Loader2 } from 'lucide-react';

/**
 * Full page loader
 */
export function PageLoader({ message }: { message?: string }) {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
    </div>
  );
}

/**
 * Inline loader
 */
export function InlineLoader({ message }: { message?: string }) {
  return (
    <div className="flex items-center gap-2 py-4">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      {message && <span className="text-sm text-muted-foreground">{message}</span>}
    </div>
  );
}

/**
 * Table skeleton
 */
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-10 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Card skeleton
 */
export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * List skeleton
 */
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Form skeleton
 */
export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

/**
 * Stats cards skeleton
 */
export function StatsCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="mt-2 h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Button loader (inline)
 */
export function ButtonLoader() {
  return <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
}
