
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { est_value, offer_basis = 0.7, repairs_est = 0 } = await req.json();
  const est = Number(est_value || 0);
  const basis = Number(offer_basis || 0.7);
  const rep = Number(repairs_est || 0);
  const offer = Math.max(Math.round((est * basis) - rep), 0);
  return NextResponse.json({ offer });
}
