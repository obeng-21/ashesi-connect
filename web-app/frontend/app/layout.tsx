import type { ReactNode } from 'react';
export const metadata = { title: 'Ashesi Graduation Tracker', description: 'Academic progress and graduation eligibility' };
export default function RootLayout({ children }: { children: ReactNode }) { return <html lang="en"><body style={{ margin: 0, background: '#f8f6f4', color: '#241b1d', fontFamily: 'system-ui, sans-serif' }}>{children}</body></html>; }
