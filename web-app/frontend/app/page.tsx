'use client';
import { useState, type FormEvent } from 'react';

const api = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
type CurriculumSummary = { programme:string; track:string; version:string; status:string; validationIssues:string[]; sourceWorkbookHash?:string };
type AdminCatalogue = { curricula: CurriculumSummary[] };
type Preview = {
 status: 'INSUFFICIENT_DATA' | 'REQUIREMENTS_OUTSTANDING' | 'ACADEMIC_REQUIREMENTS_MET';
 officialCertification: false;
 programme: string; track: string; yearGroup: number;
 curriculumVersion: string | null;
 issues: string[];
 exploratoryGpa?: { gpa: number | null; issues: string[] };
 audit: null | {
  creditsEarned: number; creditsRequired: number; percentComplete: number;
  remainingRequirements: Array<{ code: string; reason: string; credits: number }>;
 };
};
export default function Home() {
 const [identifier,setIdentifier] = useState('');
 const [password,setPassword] = useState('');
 const [error,setError] = useState('');
 const [loading,setLoading] = useState(false);
 const [preview,setPreview] = useState<Preview|null>(null);
 const [role,setRole] = useState<string|null>(null);
 const [adminCurricula,setAdminCurricula] = useState<CurriculumSummary[]|null>(null);
 async function login(event: FormEvent) {
  event.preventDefault();setLoading(true);setError('');setPreview(null);setAdminCurricula(null);
  try {
   const response = await fetch(api+'/api/v1/auth/login',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({identifier,password}),cache:'no-store'
   });
   if(!response.ok) throw Error('Sign-in failed. Check your credentials.');
   const result: { accessToken:string;role:string;forcePasswordChange:boolean } = await response.json();
   setRole(result.role);
   if(result.forcePasswordChange) {
    setError('Password change is required. Contact the administrator. No academic data was loaded.');
    return;
   }
   if(result.role==='ADMIN') {
    const catalogueResponse = await fetch(api+'/api/v1/admin/curricula',{
     headers:{Authorization:'Bearer '+result.accessToken},cache:'no-store'
    });
    if(!catalogueResponse.ok) throw Error('Signed in, but the administrator catalogue is unavailable.');
    const catalogue:AdminCatalogue = await catalogueResponse.json();
    setAdminCurricula(catalogue.curricula);
    return;
   }
   if(result.role!=='STUDENT') {
    setError('Unsupported account role. No student records were loaded.');
    return;
   }
   // Access token is used once and not stored in browser storage.
   const auditResponse = await fetch(api+'/api/v1/students/me/academic-preview',{
    headers:{Authorization:'Bearer '+result.accessToken},cache:'no-store'
   });
   if(!auditResponse.ok) throw Error('Signed in, but the academic preview is unavailable.');
   setPreview(await auditResponse.json() as Preview);
  } catch(cause) {setError(cause instanceof Error?cause.message:'Unable to connect');}
  finally {setLoading(false);}
 }
 const card: React.CSSProperties={border:'1px solid #e1d9d5',borderRadius:12,padding:20,background:'#fff'};
 return <main style={{maxWidth:920,margin:'5vh auto',padding:24,color:'#242124',fontFamily:'Arial, sans-serif'}}>
  <header style={{borderLeft:'5px solid #8B1C3B',paddingLeft:18}}>
   <p style={{letterSpacing:3,textTransform:'uppercase',fontSize:12}}>Ashesi University</p>
   <h1 style={{fontFamily:'Georgia, serif',fontSize:40,margin:'8px 0'}}>Graduation Tracker</h1>
   <p>Private, provisional academic progress dashboard</p>
  </header>
  <p style={{padding:'12px 16px',background:'#fff3e6',borderRadius:8,marginTop:24}}>
   This is an advisory preview, not an official degree audit, graduation approval or Registry certification.
  </p>
  {!preview && adminCurricula===null && <form onSubmit={login} style={{display:'grid',gap:14,marginTop:28,maxWidth:460}}>
   <label>Student or staff ID<input autoComplete="username" required value={identifier} onChange={e=>setIdentifier(e.target.value)} style={{display:'block',width:'100%',boxSizing:'border-box',padding:13,marginTop:6}} /></label>
   <label>Password<input autoComplete="current-password" required type="password" value={password} onChange={e=>setPassword(e.target.value)} style={{display:'block',width:'100%',boxSizing:'border-box',padding:13,marginTop:6}} /></label>
   <button disabled={loading} style={{background:'#8B1C3B',color:'#fff',border:0,borderRadius:6,padding:15,cursor:'pointer'}}>{loading?'Loading…':'Sign in and view progress'}</button>
  </form>}
  <p role="status" aria-live="polite">{error}</p>
  {adminCurricula!==null && <section aria-label="Administrator curriculum catalogue" style={{marginTop:24}}>
   <h2>Curriculum review catalogue</h2>
   <p>Read-only catalogue. Registry approval evidence must be independently verified before any curriculum is promoted. No graduation decisions are made here.</p>
   {adminCurricula.length===0 ? <p>No curriculum records have been imported.</p> :
    <div style={{overflowX:'auto'}}><table style={{borderCollapse:'collapse',width:'100%',textAlign:'left'}}>
     <thead><tr><th scope="col">Programme</th><th scope="col">Track</th><th scope="col">Version</th><th scope="col">Status</th><th scope="col">Validation issues</th></tr></thead>
     <tbody>{adminCurricula.map((item,i)=><tr key={item.programme+'-'+item.track+'-'+item.version+'-'+i}>
      <td style={{padding:10,borderBottom:'1px solid #ddd'}}>{item.programme}</td>
      <td style={{padding:10,borderBottom:'1px solid #ddd'}}>{item.track}</td>
      <td style={{padding:10,borderBottom:'1px solid #ddd'}}>{item.version}</td>
      <td style={{padding:10,borderBottom:'1px solid #ddd'}}>{item.status}</td>
      <td style={{padding:10,borderBottom:'1px solid #ddd'}}>{item.validationIssues?.length ? item.validationIssues.join(', ') : 'None recorded'}</td>
     </tr>)}</tbody>
    </table></div>}
   <button onClick={()=>{setAdminCurricula(null);setRole(null);setPassword('');setIdentifier('');setError('');}} style={{marginTop:18,padding:12}}>Sign out / clear catalogue</button>
  </section>}
  {preview && <section aria-label="Academic progress" style={{display:'grid',gap:18,marginTop:24}}>
   <div style={card}><h2 style={{marginTop:0}}>Academic overview</h2>
    <p><strong>Programme:</strong> {preview.programme} · <strong>Track:</strong> {preview.track} · <strong>Cohort:</strong> {preview.yearGroup}</p>
    <p><strong>Curriculum version:</strong> {preview.curriculumVersion??'Not established'}</p>
    <p><strong>Preview status:</strong> {preview.status.replaceAll('_',' ')}</p>
   </div>
   <div style={card}><h2 style={{marginTop:0}}>Course progress</h2>
    {preview.audit ? <>
     <p><strong>{preview.audit.creditsEarned}</strong> of {preview.audit.creditsRequired} credits counted ({preview.audit.percentComplete}%)</p>
     <progress aria-label="Credit completion" max={100} value={preview.audit.percentComplete} style={{width:'100%',height:18}}/>
     <h3>Remaining requirements</h3>
     {preview.audit.remainingRequirements.length ? <ul>{preview.audit.remainingRequirements.map((r,i)=><li key={r.code+'-'+i}>{r.code}: {r.reason.replaceAll('_',' ')} ({r.credits} credits)</li>)}</ul> : <p>No course gaps identified in the available provisional rules.</p>}
    </> : <p>Course progress cannot be calculated until curriculum and transcript data are reconciled.</p>}
   </div>
   <div style={card}><h2 style={{marginTop:0}}>Exploratory GPA</h2>
    <p>{preview.exploratoryGpa?.gpa??'Unavailable'}</p>
    <p>Not an official institutional GPA. Repeat and transfer rules require verification.</p>
    {preview.exploratoryGpa?.issues?.length ? <ul>{preview.exploratoryGpa.issues.map((issue,i)=><li key={i}>{issue.replaceAll('_',' ')}</li>)}</ul> : null}
   </div>
   {preview.issues.length>0 && <div style={card}><h2 style={{marginTop:0}}>Data requiring review</h2><ul>{preview.issues.map((issue,i)=><li key={i}>{issue.replaceAll('_',' ')}</li>)}</ul></div>}
   <button onClick={()=>{setPreview(null);setRole(null);setPassword('');setIdentifier('');setError('');}} style={{padding:12,justifySelf:'start'}}>Sign out / clear preview</button>
  </section>}
  <footer style={{marginTop:32,color:'#6c6666',fontSize:13}}>Student records are displayed only after authenticated access. {role==='ADMIN'?'Administrator access is not yet enabled in this interface.':''}</footer>
 </main>;
}
