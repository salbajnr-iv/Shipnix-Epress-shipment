import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin();
  if (!session.ok) return session.response;

  const { data, error } = await session.supabase
    .from('packages')
    .select('*')
    .eq('id', parseInt(params.id))
    .single();

  if (error || !data) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin();
  if (!session.ok) return session.response;

  const body = await req.json();
  const { data, error } = await session.supabase
    .from('packages')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', parseInt(params.id))
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin();
  if (!session.ok) return session.response;

  const { error } = await session.supabase
    .from('packages')
    .delete()
    .eq('id', parseInt(params.id));

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
