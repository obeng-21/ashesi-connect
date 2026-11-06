'use client';
import { useState, type FormEvent } from 'react';
const api = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
export default function Home() {
 const [identifier, setIdentifier] = useState(''); const [password, setPassword] = useState('');
 const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
 async function login(event: FormEvent) {
  event.preventDefault(); setLoading(true); setError('');
  try {
   const response = await fetch(api + '/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier, password }) });
   if (!response.ok) throw Error('Sign-in failed. Check your credentials.');
   const result = await response.json();
   // Access tokens are kept in memory only. A production refresh-cookie flow is required before release.
   setError(result.forcePasswordChange ? 'Your account requires a password change. Contact the administrator until account management is enabled.' : 'Authentication succeeded. The role-specific workspace is under development.');
  } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to connect'); }
  finally { setLoading(false); }
 }
 return <main style={{ maxWidth: 460, margin: '10vh auto', padding: 24 }}><div style={{ borderLeft: '5px solid #8B1C3B', paddingLeft: 18 }}><p style={{ letterSpacing: 3, textTransform: 'uppercase', fontSize: 12 }}>Ashesi University</p><h1 style={{ fontFamily: 'Georgia, serif', fontSize: 42 }}>Graduation Tracker</h1><p>Secure academic progress portal</p></div><form onSubmit={login} style={{ display: 'grid', gap: 14, marginTop: 36 }}><label>Student or staff ID<input required value={identifier} onChange={e => setIdentifier(e.target.value)} style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: 13, marginTop: 6 }} /></label><label>Password<input required type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: 13, marginTop: 6 }} /></label><button disabled={loading} style={{ background: '#8B1C3B', color: 'white', border: 0, padding: 15, cursor: 'pointer' }}>{loading ? 'Signing in…' : 'Sign in'}</button><p role="status" aria-live="polite">{error}</p></form></main>;
}
