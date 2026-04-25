import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import {
  PACKAGE_STATUS_TRANSITIONS,
  PACKAGE_STATUSES,
  type PackageStatus,
} from '@/lib/types';

const STATUS_DESCRIPTIONS: Record<string, string> = {
  created: 'Package has been registered for shipping',
  picked_up: 'Package has been picked up by courier',
  in_transit: 'Package is on its way to destination',
  out_for_delivery: 'Package is out for delivery',
  delivered: 'Package has been successfully delivered',
  failed_delivery: 'Delivery attempt failed',
  returned: 'Package is being returned to sender',
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin();
  if (!session.ok) return session.response;

  const { status, location, description } = await req.json();

  if (!status || !Object.values(PACKAGE_STATUSES).includes(status)) {
    return NextResponse.json({ message: 'Invalid status value' }, { status: 400 });
  }

  // Load the existing package to validate the transition.
  const { data: existing } = await session.supabase
    .from('packages')
    .select('current_status')
    .eq('id', parseInt(params.id))
    .single();

  if (!existing) {
    return NextResponse.json({ message: 'Package not found' }, { status: 404 });
  }

  const current = existing.current_status as PackageStatus;
  const allowed = PACKAGE_STATUS_TRANSITIONS[current] ?? [];
  // Allow re-setting to the same status (e.g. add a note at same stage).
  if (status !== current && !allowed.includes(status as PackageStatus)) {
    return NextResponse.json({
      message: `Cannot transition from "${current}" to "${status}". Allowed: ${allowed.join(', ') || 'none'}.`,
    }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    current_status: status,
    updated_at: new Date().toISOString(),
  };
  if (location) updates.current_location = location;
  if (status === 'delivered') updates.actual_delivery = new Date().toISOString();

  const { data, error } = await session.supabase
    .from('packages')
    .update(updates)
    .eq('id', parseInt(params.id))
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  await session.supabase.from('tracking_events').insert({
    package_id: parseInt(params.id),
    status,
    location: location ?? '',
    description: description ?? STATUS_DESCRIPTIONS[status] ?? 'Status updated',
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json(data);
}
