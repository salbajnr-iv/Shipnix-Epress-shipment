import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getSiteConfig } from '@/lib/site-config.server';

export const dynamic = 'force-dynamic';

// Admin-only — returns the FULL config including disabled items.
export async function GET() {
  const session = await requireAdmin();
  if (!session.ok) return session.response;

  const cfg = await getSiteConfig();
  return NextResponse.json(cfg);
}
