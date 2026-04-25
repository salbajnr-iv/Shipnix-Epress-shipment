import { NextResponse } from 'next/server';
import { getSessionWithRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSessionWithRole();
  if (!session.ok) {
    return NextResponse.json({ authenticated: false });
  }
  return NextResponse.json({
    authenticated: true,
    userId: session.userId,
    email: session.email,
    role: session.role,
  });
}
