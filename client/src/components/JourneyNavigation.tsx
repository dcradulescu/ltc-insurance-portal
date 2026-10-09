import { Link, useLocation } from "wouter";
export const journey = [{ href: "/", label: "Welcome" }, { href: "/education", label: "Learn" }, { href: "/academy", label: "Watch" }, { href: "/policy-form", label: "Your policy" }, { href: "/strategy", label: "Your plan" }, { href: "/contact", label: "Get support" }];
export function JourneyNavigation() {
 const [location] = useLocation();
 return <nav aria-label="Your LTC journey" className="journey-navigation border-b bg-white px-4 py-3 overflow-x-auto"><ol className="flex gap-3 min-w-max mx-auto w-fit">{journey.map((step,index)=><li key={step.href}><Link href={step.href} aria-current={location===step.href?"page":undefined} className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ${location===step.href?'bg-slate-800 text-white':'bg-slate-100 text-slate-700 hover:bg-teal-50'}`}><span className="rounded-full border w-6 h-6 text-center">{index+1}</span>{step.label}</Link></li>)}</ol></nav>;
}
