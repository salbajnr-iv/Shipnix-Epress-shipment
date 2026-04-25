import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getSiteConfig } from '@/lib/site-config.server';

// Admin: list all contact messages, newest first.
export async function GET() {
  const session = await requireAdmin();
  if (!session.ok) return session.response;

  const { data, error } = await session.supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// Public: anyone can submit a contact message.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json().catch(() => ({}));

  const config = await getSiteConfig();
  if (config.feature_flags.maintenance_mode) {
    return NextResponse.json(
      { message: config.feature_flags.maintenance_message || 'Service is temporarily unavailable.' },
      { status: 503 },
    );
  }
  if (!config.feature_flags.contact_enabled) {
    return NextResponse.json(
      { message: 'The contact form is currently disabled.' },
      { status: 403 },
    );
  }

  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim();
  const subject = String(body.subject ?? '').trim();
  const message = String(body.message ?? '').trim();

  if (!name || !email || !subject || !message) {
    return NextResponse.json(
      { message: 'All fields are required.' },
      { status: 400 },
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { message: 'Please enter a valid email address.' },
      { status: 400 },
    );
  }
  if (message.length > 5000) {
    return NextResponse.json(
      { message: 'Message is too long (max 5000 characters).' },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from('contact_messages')
    .insert({
      name: name.slice(0, 120),
      email: email.slice(0, 200),
      subject: subject.slice(0, 200),
      message,
      status: 'new',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data?.id });
}
