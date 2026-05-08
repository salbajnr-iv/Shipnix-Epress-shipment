import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getSiteConfig } from '@/lib/site-config.server';

function generateQuoteNumber() {
  return `QT-${Date.now().toString().slice(-8)}`;
}

// Admins can list all quotes
export async function GET() {
  const session = await requireAdmin();
  if (!session.ok) return session.response;

  const { data, error } = await session.supabase
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST is intentionally public — anyone can request a quote.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json().catch(() => ({}));

  // Honor maintenance + feature-flag toggles set in the admin Customization console.
  const config = await getSiteConfig();
  if (config.feature_flags.maintenance_mode) {
    return NextResponse.json(
      { message: config.feature_flags.maintenance_message || 'Service is temporarily unavailable.' },
      { status: 503 },
    );
  }
  if (!config.feature_flags.quote_enabled) {
    return NextResponse.json(
      { message: 'Quote requests are currently disabled.' },
      { status: 403 },
    );
  }

  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 30);

  // Pricing math comes straight from site_settings — admins can change it live.
  const { base_min, per_kg_rate } = config.pricing;
  const weight = parseFloat(body.weight || '0');
  const baseCost = Math.max(base_min, weight * per_kg_rate);

  // Look up the chosen slot's fee from the configured slot list (enabled-only).
  const slot = config.time_slots.find(
    (s) => s.enabled && s.value === body.delivery_time_slot,
  );
  const deliveryFee = slot?.fee ?? 0;

  const totalCost = baseCost + deliveryFee;

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('quotes')
    .insert({
      ...body,
      quote_number: generateQuoteNumber(),
      base_cost: baseCost.toFixed(2),
      delivery_fee: deliveryFee.toFixed(2),
      total_cost: totalCost.toFixed(2),
      valid_until: validUntil.toISOString(),
      status: 'pending',
      created_by: user?.id ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data);
}
