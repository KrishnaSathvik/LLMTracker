export const metadata = { title: 'LLM Tracker' };
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'Inter, system-ui, Arial' }}>
        {children}
      </body>
    </html>
  );
}
