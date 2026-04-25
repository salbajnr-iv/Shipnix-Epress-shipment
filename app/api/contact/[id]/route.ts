import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { CONTACT_MESSAGE_STATUSES } from '@/lib/types';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session.ok) return session.response;

  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ message: 'Invalid id' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.status !== undefined) {
    if (!CONTACT_MESSAGE_STATUSES.includes(body.status)) {
      return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
    }
    update.status = body.status;
  }
  if (body.admin_notes !== undefined) {
    update.admin_notes = body.admin_notes ? String(body.admin_notes).slice(0, 5000) : null;
  }

  const { data, error } = await session.supabase
    .from('contact_messages')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session.ok) return session.response;

  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ message: 'Invalid id' }, { status: 400 });
  }

  const { error } = await session.supabase
    .from('contact_messages')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
