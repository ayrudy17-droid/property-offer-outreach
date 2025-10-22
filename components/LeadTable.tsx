
'use client';

import { useMemo } from 'react';
import { computeOfferPrice } from '@/lib/calc';

export type Lead = {
  owner_name?: string;
  email?: string;
  mailing_address?: string;
  property_address?: string;
  apn?: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  year_built?: number;
  last_sale_date?: string;
  last_sale_price?: number;
  est_value?: number;
  offer_basis?: number;
  repairs_est?: number;
  offer_price?: number;
  channel?: string;
  status?: string;
  notes?: string;
};

export default function LeadTable({ leads, setLeads }: { leads: Lead[]; setLeads: (v: Lead[]) => void; }) {

  const columns = useMemo(() => [
    'owner_name','email','property_address','est_value','offer_basis','repairs_est','offer_price','channel','status','notes'
  ], []);

  const updateCell = (idx: number, key: string, value: string) => {
    const copy = [...leads];
    // coerce numbers where needed
    if (['est_value','offer_basis','repairs_est','offer_price'].includes(key)) {
      (copy[idx] as any)[key] = Number(value);
    } else {
      (copy[idx] as any)[key] = value;
    }
    // recompute offer when relevant fields change
    if (['est_value','offer_basis','repairs_est'].includes(key)) {
      const est = Number((copy[idx].est_value ?? 0));
      const basis = Number((copy[idx].offer_basis ?? 0.7));
      const rep = Number((copy[idx].repairs_est ?? 0));
      copy[idx].offer_price = computeOfferPrice(est, basis, rep);
    }
    setLeads(copy);
    localStorage.setItem('leads', JSON.stringify(copy));
  };

  return (
    <div style={{ overflowX: 'auto', border: '1px solid #283052', borderRadius: 12 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: '#101939' }}>
          <tr>
            {columns.map((c) => (
              <th key={c} style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, borderBottom: '1px solid #283052' }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((row, i) => (
            <tr key={i} style={{ background: i % 2 ? '#0f1a33' : '#0d1730' }}>
              {columns.map((c) => (
                <td key={c} style={{ padding: 8, borderBottom: '1px solid #283052' }}>
                  <input
                    value={((row as any)[c] ?? '')}
                    onChange={(e) => updateCell(i, c, e.target.value)}
                    style={{ width: '100%', background: 'transparent', color: 'white', border: '1px solid #283052', borderRadius: 8, padding: '6px 8px' }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
