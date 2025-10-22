
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import PDFDocument from 'pdfkit';
import JSZip from 'jszip';

export async function POST(req: NextRequest) {
  const { leads } = await req.json();
  const tpl = await fs.readFile(path.join(process.cwd(), 'templates', 'letter.txt'), 'utf-8');
  const zip = new JSZip();

  for (const lead of (leads || [])) {
    const now = new Date().toLocaleDateString('en-US');
    const letter = tpl
      .replaceAll('{{today}}', now)
      .replaceAll('{{owner_name}}', lead.owner_name || 'Owner')
      .replaceAll('{{mailing_address}}', lead.mailing_address || '')
      .replaceAll('{{property_address}}', lead.property_address || '')
      .replaceAll('{{offer_price}}', String(lead.offer_price ?? ''))
      .replaceAll('{{from_name}}', process.env.FROM_NAME || 'Offer Team')
      .replaceAll('{{company_name}}', process.env.COMPANY_NAME || 'Your Company')
      .replaceAll('{{company_phone}}', process.env.COMPANY_PHONE || '(000) 000-0000');

    // create PDF to buffer
    const doc = new PDFDocument({ margin: 54 });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c as Buffer));
    doc.on('end', () => {});

    doc.fontSize(12).text(letter, { align: 'left' });
    doc.end();
    await new Promise(resolve => doc.on('end', resolve));
    const pdfBuffer = Buffer.concat(chunks);

    const safeName = (lead.property_address || 'property').replace(/[^a-z0-9]+/gi,'_');
    zip.file(`${safeName}.pdf`, pdfBuffer);
  }

  const content = await zip.generateAsync({ type: 'nodebuffer' });
  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="offer_letters.zip"'
    }
  });
}
