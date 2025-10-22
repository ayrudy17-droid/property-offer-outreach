
export const metadata = {
  title: 'Property Offer Outreach',
  description: 'Import leads, generate offers, send emails, and create PDFs.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'ui-sans-serif, system-ui, Arial', background: '#0b1020', color: 'white' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px' }}>
          <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <img src="/logo.svg" alt="Logo" width={150} height={40} />
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
