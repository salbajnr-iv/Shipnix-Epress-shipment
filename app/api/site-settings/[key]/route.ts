import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { SETTING_KEYS, type SettingKey } from '@/lib/site-config';

const isValidKey = (k: string): k is SettingKey =>
  (SETTING_KEYS as readonly string[]).includes(k);

// Admin-only upsert of a single setting key.
export async function PUT(
  req: NextRequest,
  { params }: { params: { key: string } },
) {
  const session = await requireAdmin();
  if (!session.ok) return session.response;

  const { key } = params;
  if (!isValidKey(key)) {
    return NextResponse.json(
      { message: `Unknown setting key: ${key}` },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  if (body === null || body === undefined) {
    return NextResponse.json({ message: 'Missing value' }, { status: 400 });
  }

  const { error } = await session.supabase
    .from('site_settings')
    .upsert({ key, value: body, updated_by: session.userId }, { onConflict: 'key' });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
