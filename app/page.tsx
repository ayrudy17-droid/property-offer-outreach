
'use client';

import { useEffect, useRef, useState } from 'react';
import Papa from 'papaparse';
import LeadTable, { Lead } from '@/components/LeadTable';

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

  const downloadPDFs = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/pdfs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads })
      });
      if (!r.ok) throw new Error('PDF server error');
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
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
