import './globals.css';

export const metadata = {
  title: 'Mirath — Islamic Inheritance Calculator',
  description: 'Build family trees, register properties, and calculate Islamic inheritance shares (Hanafi Faraid) with precision.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="paper-bg">{children}</body>
    </html>
  );
}
