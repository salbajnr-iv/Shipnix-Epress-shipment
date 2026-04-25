'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search, Package, MapPin, Clock, CheckCircle, Truck, AlertCircle,
  PackageX, ArrowLeft,
} from 'lucide-react';
import { formatStatus } from '@/lib/utils';

interface TrackingResult {
  tracking_id: string;
  current_status: string;
  current_location?: string;
  estimated_delivery?: string;
  actual_delivery?: string;
  recipient_name: string;
  recipient_address: string;
  sender_name: string;
  package_description?: string;
  shipping_cost?: string;
  created_at: string;
  trackingEvents: Array<{
    id: number;
    status: string;
    location?: string;
    description?: string;
    timestamp: string;
  }>;
}

const STATUS_ICONS: Record<string, any> = {
  created: Package,
  picked_up: Package,
  in_transit: Truck,
  out_for_delivery: Truck,
  delivered: CheckCircle,
  failed_delivery: AlertCircle,
  returned: AlertCircle,
};

const STATUS_COLORS: Record<string, string> = {
  delivered: 'bg-green-100 text-green-800 border-green-200',
  in_transit: 'bg-blue-100 text-blue-800 border-blue-200',
  out_for_delivery: 'bg-purple-100 text-purple-800 border-purple-200',
  failed_delivery: 'bg-red-100 text-red-800 border-red-200',
  returned: 'bg-orange-100 text-orange-800 border-orange-200',
  picked_up: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  created: 'bg-gray-100 text-gray-800 border-gray-200',
};

// Tracking IDs follow the pattern ST-XXXXXXXXX (12 chars, uppercase alphanumeric).
const TRACKING_PATTERN = /^ST-[A-Z0-9]{6,12}$/;

type FetchState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'found'; result: TrackingResult }
  | { kind: 'not_found'; query: string }
  | { kind: 'error'; message: string };

export default function PublicTrackingClient({ initialId }: { initialId?: string }) {
  const [trackingId, setTrackingId] = useState(initialId ?? '');
  const [state, setState] = useState<FetchState>({ kind: 'idle' });
  const [validationError, setValidationError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (initialId) handleTrack(initialId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialId]);

  const handleTrack = async (id?: string) => {
    const searchId = (id ?? trackingId).trim().toUpperCase();
    setValidationError('');

    if (!searchId) {
      setValidationError('Please enter a tracking ID.');
      return;
    }
    if (!TRACKING_PATTERN.test(searchId)) {
      setValidationError('Tracking IDs look like ST-XXXXXXXXX (letters and digits only).');
      return;
    }

    setState({ kind: 'loading' });
    try {
      const res = await fetch(`/api/track/${searchId}`);
      if (res.status === 404) {
        setState({ kind: 'not_found', query: searchId });
        return;
      }
      if (!res.ok) {
        setState({ kind: 'error', message: `Lookup failed (status ${res.status}). Please try again.` });
        return;
      }
      const data = (await res.json()) as TrackingResult;
      setState({ kind: 'found', result: data });
    } catch {
      setState({ kind: 'error', message: 'Network error. Please check your connection and try again.' });
    }
  };

  const reset = () => {
    setState({ kind: 'idle' });
    setTrackingId('');
    setValidationError('');
    router.push('/track');
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
          Track Your Shipment
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          Enter your tracking ID to see real-time delivery updates
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              value={trackingId}
              onChange={e => setTrackingId(e.target.value.toUpperCase())}
              placeholder="Enter tracking ID (e.g. ST-ABC123456)"
              className="flex-1 font-mono"
              onKeyDown={e => e.key === 'Enter' && handleTrack()}
              data-testid="input-tracking-id"
              aria-invalid={!!validationError}
            />
            <Button
              onClick={() => handleTrack()}
              className="bg-blue-600 hover:bg-blue-700 px-6"
              disabled={state.kind === 'loading'}
              data-testid="button-track"
            >
              <Search className="w-4 h-4 mr-2" />
              {state.kind === 'loading' ? 'Searching...' : 'Track'}
            </Button>
          </div>
          {validationError && (
            <p className="text-red-600 text-sm mt-3" data-testid="text-validation-error">
              {validationError}
            </p>
          )}
        </CardContent>
      </Card>

      {state.kind === 'loading' && <TrackingSkeleton />}

      {state.kind === 'not_found' && (
        <Card data-testid="card-not-found">
          <CardContent className="text-center py-12 px-6">
            <PackageX className="w-14 h-14 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              We couldn’t find that shipment
            </h2>
            <p className="text-muted-foreground text-sm mb-1">
              No package matches <span className="font-mono font-semibold">{state.query}</span>.
            </p>
            <p className="text-muted-foreground text-sm mb-6">
              Double-check the tracking ID for any typos and try again.
            </p>
            <Button variant="outline" onClick={reset} data-testid="button-reset-tracking">
              <ArrowLeft className="w-4 h-4 mr-2" /> Try a different ID
            </Button>
          </CardContent>
        </Card>
      )}

      {state.kind === 'error' && (
        <Card className="border-red-200" data-testid="card-error">
          <CardContent className="text-center py-10 px-6">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Something went wrong
            </h2>
            <p className="text-muted-foreground text-sm mb-6">{state.message}</p>
            <Button onClick={() => handleTrack()} className="bg-blue-600 hover:bg-blue-700">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {state.kind === 'found' && <FoundResult result={state.result} />}
    </div>
  );
}

function FoundResult({ result }: { result: TrackingResult }) {
  return (
    <div className="space-y-6" data-testid="card-found">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Tracking ID</p>
              <p
                className="text-lg sm:text-xl font-bold font-mono text-blue-700 dark:text-blue-400"
                data-testid="text-tracking-id"
              >
                {result.tracking_id}
              </p>
            </div>
            <span
              className={`px-3 sm:px-4 py-2 rounded-full text-sm font-semibold border ${
                STATUS_COLORS[result.current_status] ?? 'bg-gray-100 text-gray-800'
              }`}
              data-testid="text-current-status"
            >
              {formatStatus(result.current_status)}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Sender</p>
              <p className="font-medium">{result.sender_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Recipient</p>
              <p className="font-medium">{result.recipient_name}</p>
              <p className="text-muted-foreground text-xs">{result.recipient_address}</p>
            </div>
            {result.current_location && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-muted-foreground mb-0.5">Current Location</p>
                  <p className="font-medium">{result.current_location}</p>
                </div>
              </div>
            )}
            {result.estimated_delivery && (
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-muted-foreground mb-0.5">Estimated Delivery</p>
                  <p className="font-medium">
                    {new Date(result.estimated_delivery).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tracking History</CardTitle>
        </CardHeader>
        <CardContent>
          {result.trackingEvents.length === 0 ? (
            <p className="text-muted-foreground text-sm">No tracking events yet</p>
          ) : (
            <div className="relative space-y-4" data-testid="list-tracking-events">
              {result.trackingEvents.map((event, i) => {
                const Icon = STATUS_ICONS[event.status] ?? Package;
                return (
                  <div key={event.id} className="flex gap-4" data-testid={`event-${event.id}`}>
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          i === 0
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      {i < result.trackingEvents.length - 1 && (
                        <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 mt-2" />
                      )}
                    </div>
                    <div className="pb-4 flex-1 min-w-0">
                      <p className="font-medium text-sm">{formatStatus(event.status)}</p>
                      {event.description && (
                        <p className="text-muted-foreground text-sm">{event.description}</p>
                      )}
                      {event.location && (
                        <p className="text-muted-foreground text-xs flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />{event.location}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TrackingSkeleton() {
  return (
    <div className="space-y-6" data-testid="card-loading">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <Skeleton className="h-3 w-24 mb-2" />
              <Skeleton className="h-6 w-48" />
            </div>
            <Skeleton className="h-9 w-28 rounded-full" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
