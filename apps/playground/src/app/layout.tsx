import type { ReactNode } from 'react';

export const metadata = {
  title: 'forge playground',
  description: 'Kitchen-sink demo for forge modules',
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
