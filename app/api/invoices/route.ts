import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

function generateInvoiceNumber() {
  return `INV-${Date.now().toString().slice(-8)}`;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session.ok) return session.response;

  const { data, error } = await session.supabase
    .from('invoices')
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
  const { data, error } = await session.supabase
    .from('invoices')
    .insert({
      ...body,
      invoice_number: generateInvoiceNumber(),
      created_by: session.userId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data);
}
