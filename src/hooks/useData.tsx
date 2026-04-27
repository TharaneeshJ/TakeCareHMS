import { useState, useEffect, useCallback } from 'react';

/**
 * Generic hook for fetching data from Supabase.
 * Handles loading, error, and refetch states.
 */
export function useData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch, setData };
}

/**
 * Inline loading spinner component
 */
export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 60, color: '#A3A3A3', fontSize: 14, gap: 12,
    }}>
      <div style={{
        width: 20, height: 20, border: '2.5px solid #E5E5E5',
        borderTopColor: '#16A34A', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      {message}
    </div>
  );
}

/**
 * Error display component
 */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 60, color: '#DC2626', fontSize: 14, gap: 12,
    }}>
      <div style={{ fontWeight: 500 }}>Something went wrong</div>
      <div style={{ color: '#A3A3A3', fontSize: 13 }}>{message}</div>
      {onRetry && (
        <button className="btn btn-secondary btn-sm" onClick={onRetry} style={{ marginTop: 8 }}>
          Try Again
        </button>
      )}
    </div>
  );
}

/**
 * Empty state component
 */
export function EmptyState({ icon, title, subtitle }: {
  icon?: React.ReactNode; title: string; subtitle?: string;
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 60, color: '#A3A3A3', textAlign: 'center',
    }}>
      {icon && <div style={{ marginBottom: 16, color: '#E5E5E5' }}>{icon}</div>}
      <div style={{ fontSize: 16, fontWeight: 500, color: '#0A0A0A', marginBottom: 4 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 14 }}>{subtitle}</div>}
    </div>
  );
}
