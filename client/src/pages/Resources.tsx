import { Link, useParams } from 'wouter';
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Layout } from '@/components/Layout';
import { RESOURCE_GUIDES, RESOURCE_DISCLAIMER, RESOURCE_SOURCE } from '@shared/resourceGuides';
import { downloadResource } from '@/lib/downloadResource';
import { toast } from 'sonner';
export default function Resources() {
 const {slug}=useParams<{slug?:string}>();const guide=RESOURCE_GUIDES.find(g=>g.slug===slug);const [busy,setBusy]=useState(false);
 const download=async(format:'pdf'|'docx')=>{if(!guide)return;setBusy(true);try{await downloadResource(guide,format);}catch{toast.error('Download failed. Please try again.');}finally{setBusy(false);}};
 return <Layout><Helmet><title>{guide?.title??'Resource Center'} | SC Visiting Angels</title></Helmet>
 <section className="resource-hero text-white py-12"><div className="container relative"><p className="uppercase tracking-widest text-sm mb-3">Practical tools for your family</p><h1 className="text-3xl md:text-4xl font-bold !text-white">{guide?.title??'LTC Resource Center'}</h1><p className="mt-4 max-w-2xl">{guide?.summary??'Twelve guides and worksheets, organized in the order you need them. Read online, download, or print.'}</p></div></section>
 <div className="container py-10 max-w-5xl">
 {slug&&!guide?<p role="alert">This guide was not found. <Link href="/resources" className="underline">View all resources</Link></p>:guide?<>
 <div className="resource-actions flex gap-3 flex-wrap mb-6"><button className="va-btn" disabled={busy} onClick={()=>download('pdf')}>Download PDF</button>{guide.format==='docx'&&<button className="va-btn" disabled={busy} onClick={()=>download('docx')}>Download Word worksheet</button>}<button className="va-btn" onClick={()=>window.print()}>Print guide</button><Link href="/resources" className="underline self-center">All resources</Link></div>
 <div className="grid md:grid-cols-3 gap-6"><article className="md:col-span-2 bg-white rounded-2xl border p-6"><h2 className="text-xl font-bold mb-5">Use this guide</h2><ol className="space-y-4 list-decimal pl-5">{guide.points.map(text=><li key={text}>{text}</li>)}</ol>{guide.fields&&<div className="mt-8 grid sm:grid-cols-2 gap-5">{guide.fields.map(field=><div className="rounded-xl bg-teal-50 p-4 min-h-24" key={field}><h3 className="text-sm font-semibold">{field}</h3><div className="border-b border-slate-300 mt-8"/></div>)}</div>}</article><aside className="rounded-2xl bg-slate-100 overflow-hidden"><img className="w-full h-48 object-cover" src="/manus-storage/policy-form-hero_314c2717.jpg" alt="A family reviewing care information"/><div className="p-5"><h2 className="font-bold mb-4">Your next steps</h2>{['Learn the basics','Review your policy','Prepare your claim','Manage benefits'].map((label,i)=><div key={label} className={`mb-3 p-3 border-l-4 ${i+1===guide.stage?'border-teal bg-white':'border-slate-300'}`}>{i+1}. {label}</div>)}</div></aside></div>
 </>:<div className="grid md:grid-cols-2 gap-5">{RESOURCE_GUIDES.map((item,i)=><Link key={item.slug} href={'/resources/'+item.slug} className="block border rounded-xl p-6 bg-white hover:shadow-lg transition-shadow"><p className="text-sm text-teal-700 mb-2">Stage {item.stage} · {String(i+1).padStart(2,'0')}</p><h2 className="text-lg font-bold">{item.title}</h2><p className="text-slate-600 mt-2">{item.summary}</p><p className="text-sm mt-4 font-semibold">Read guide →</p></Link>)}</div>}
 <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm"><h2 className="font-bold mb-2">Educational use only</h2><p>{RESOURCE_DISCLAIMER}</p><a href={RESOURCE_SOURCE} target="_blank" rel="noopener noreferrer" className="underline block mt-3">NAIC consumer reference</a></div>
 </div></Layout>;
}
