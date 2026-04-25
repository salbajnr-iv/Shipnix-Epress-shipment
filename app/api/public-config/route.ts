import { NextResponse } from 'next/server';
import { publicConfig } from '@/lib/site-config';
import { getSiteConfig } from '@/lib/site-config.server';

export const dynamic = 'force-dynamic';

// Public read of site settings (enabled-only) used by the marketing site
// and any client component that needs to render dynamic content.
export async function GET() {
  const cfg = await getSiteConfig();
  return NextResponse.json(publicConfig(cfg));
}
