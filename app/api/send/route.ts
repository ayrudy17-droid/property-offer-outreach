
import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import fs from 'node:fs/promises';
import path from 'node:path';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

const emailTemplatePath = path.join(process.cwd(), 'templates', 'email.html');

export async function POST(req: NextRequest) {
  if (!process.env.SENDGRID_API_KEY) {
    return NextResponse.json({ error: 'Missing SENDGRID_API_KEY' }, { status: 400 });
  }
  const { leads } = await req.json();
  const tpl = await fs.readFile(emailTemplatePath, 'utf-8');

  let sent = 0, failed = 0;
  const fromEmail = process.env.FROM_EMAIL || 'offers@yourdomain.com';
  const fromName = process.env.FROM_NAME || 'Offer Team';
  const replyTo = process.env.REPLY_TO || fromEmail;

  for (const lead of leads || []) {
    if (!lead?.email) continue;

    const html = tpl
      .replaceAll('{{owner_name}}', lead.owner_name || 'there')
      .replaceAll('{{property_address}}', lead.property_address || 'your property')
      .replaceAll('{{offer_price}}', String(lead.offer_price ?? ''))
      .replaceAll('{{from_name}}', fromName)
      .replaceAll('{{company_name}}', process.env.COMPANY_NAME || 'Your Company')
      .replaceAll('{{company_address_line1}}', process.env.COMPANY_ADDRESS_LINE1 || 'Address')
      .replaceAll('{{company_city}}', process.env.COMPANY_CITY || 'City')
      .replaceAll('{{company_state}}', process.env.COMPANY_STATE || 'ST')
      .replaceAll('{{company_zip}}', process.env.COMPANY_ZIP || '00000');

    try {
      await sgMail.send({
        to: lead.email,
        from: { email: fromEmail, name: fromName },
        replyTo,
        subject: `Offer to Purchase: ${lead.property_address || ''}`.trim(),
        html
      });
      sent++;
    } catch (e) {
      console.error('SendGrid error:', e);
      failed++;
    }
  }
  return NextResponse.json({ sent, failed });
}
