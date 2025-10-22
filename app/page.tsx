'use client';

import { useEffect, useRef, useState } from 'react';
import Papa from 'papaparse';
import LeadTable, { Lead } from '@/components/LeadTable';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('leads');
    if (saved) setLeads(JSON.parse(saved));
  }, []);

  const handleCSV = (file: File) => {
    Papa.parse<Lead>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const rows = (res.data || []).map((r) => {
          const est = Number(r.est_value ?? 0);
          const basis = Number(r.offer_basis ?? 0.7);
          const rep = Number(r.repairs_est ?? 0);
          const offer = Math.max(Math.round((est * basis) - rep), 0);
          return { ...r, est_value: est, offer_basis: basis, repairs_est: rep, offer_price: offer };
        });
        setLeads(rows);
        localStorage.setItem('leads', JSON.stringify(rows));
      }
    });
  };

  const sendEmails = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads })
      });
      const j = await r.json();
      alert(`Emails queued: ${j.sent} | failed: ${j.failed}`);
    } catch (e:any) {
      alert('Send error: ' + e?.message);
    } finally {
      setLoading(false);
    }
  };

  // CLIENT-SIDE PDF GENERATION (no server route, no pdfkit)
  const downloadPDFs = async () => {
    if (leads.length === 0) return;
    setLoading(true);
    try {
      const zip = new JSZip();
      const today = new Date().toLocaleDateString('en-US');

      for (const lead of leads) {
        const owner = lead.owner_name || 'Owner';
        const addr = lead.mailing_address || '';
        const prop = lead.property_address || '';
        const offer = String(lead.offer_price ?? '');

        const letterText = [
          today,
          '',
          owner,
          addr,
          '',
          `Re: ${prop}`,
          '',
          `Hello ${owner},`,
          '',
          `After reviewing recent comparable sales and the property's condition, I can offer $${offer} for ${prop} in as-is condition.`,
          '',
          '• All cash or proof of funds',
          '• No realtor commissions',
          '• Flexible closing date—you pick the timeline',
          '• We can handle clean-out and basic repairs',
          '',
          'If this range works, reply to this letter or call me. I’m happy to walk through details or adjust terms to fit your needs.',
          '',
          'Sincerely,',
          (process.env.NEXT_PUBLIC_FROM_NAME || 'Offer Team'),
          (process.env.NEXT_PUBLIC_COMPANY_NAME || 'Your Company')
        ].join('\n');

        const doc = new jsPDF({ unit: 'pt', format: 'letter' });
        const left = 54;
        const top = 72;
        const maxWidth = 540; // letter page width minus margins
        doc.setFont('Times', 'Normal').setFontSize(12);
        const lines = doc.splitTextToSize(letterText, maxWidth);
        doc.text(lines, left, top);

        const pdfArrayBuffer = doc.output('arraybuffer');
        const safe = (prop || 'property').replace(/[^a-z0-9]+/gi, '_');
        zip.file(`${safe}.pdf`, new Blob([pdfArrayBuffer], { type: 'application/pdf' }));
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'offer_letters.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e:any) {
      alert('PDF error: ' + e?.message);
    } finally {
      setLoading(false);
    }
  };

  const clearLeads = () => {
    setLeads([]);
    localStorage.removeItem('leads');
  };

  return (
    <main>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Property Offer Outreach</h1>
      <p style={{ opacity: 0.8, marginBottom: 22 }}>Import leads (CSV), tweak pricing, and send offers by email or download letters as PDFs.</p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <input ref={fileRef} type="file" accept=".csv" onChange={(e) => e.target.files?.[0] && handleCSV(e.target.files[0])} />
        <button onClick={sendEmails} disabled={loading || leads.length === 0} style={btnStyle}>Send Emails</button>
        <button onClick={downloadPDFs} disabled={loading || leads.length === 0} style={btnStyle}>Download PDF Letters</button>
        <button onClick={clearLeads} style={{...btnStyle, background:'#5b2333'}}>Clear</button>
      </div>

      <LeadTable leads={leads} setLeads={setLeads} />
      <div style={{ marginTop: 12, opacity: 0.75, fontSize: 12 }}>
        Tip: Required columns — <code>owner_name</code>, <code>email</code>, <code>property_address</code>, <code>est_value</code>, <code>offer_basis</code>, <code>repairs_est</code>.
      </div>
    </main>
  );
}

const btnStyle: React.CSSProperties = {
  background: '#1f3f7a',
  color: 'white',
  border: '1px solid #2b4c8f',
  borderRadius: 10,
  padding: '10px 14px',
  cursor: 'pointer'
};
