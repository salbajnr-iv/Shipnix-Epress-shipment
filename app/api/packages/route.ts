import { NextRequest, NextResponse } from 'next/server';
import { generateTrackingId } from '@/lib/utils';
import { requireAdmin } from '@/lib/auth';
import QRCode from 'qrcode';

export async function GET() {
  const session = await requireAdmin();
  if (!session.ok) return session.response;

  const { data, error } = await session.supabase
    .from('packages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session.ok) return session.response;

  const body = await req.json();
  const trackingId = generateTrackingId();
  const qrCode = await QRCode.toDataURL(trackingId, {
    width: 200, margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' },
  });

  const { data, error } = await session.supabase
    .from('packages')
    .insert({
      ...body,
      tracking_id: trackingId,
      qr_code: qrCode,
      current_status: body.current_status ?? 'created',
      created_by: session.userId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  await session.supabase.from('tracking_events').insert({
    package_id: data.id,
    status: 'created',
    location: 'Package created in system',
    description: 'Package has been registered for shipping',
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json(data);
}
