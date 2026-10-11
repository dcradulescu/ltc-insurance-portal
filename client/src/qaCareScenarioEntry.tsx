import React, {useEffect,useState} from "react";
import {createRoot} from "react-dom/client";
import {CareCalculator} from "./components/CareCalculator";
import type {CareInputs} from "@shared/careCalculator";
import "./index.css";
type Saved={status:"empty"|"saved_valid"|"needs_review";inputs:CareInputs|null;reason:string|null;savedAt:string|null};
function Page(){
 const [saved,setSaved]=useState<Saved|null>(null);
 const [confirmed,setConfirmed]=useState<CareInputs|null>(null);
 useEffect(()=>{
  let alive=true;
  fetch("/qa-care-scenario",{credentials:"same-origin"})
    .then(async r=>{if(!r.ok)throw new Error("QA source unavailable");return r.json() as Promise<Saved>})
    .then(v=>{if(alive){setSaved(v);setConfirmed(v.status==="saved_valid"?v.inputs:null)}})
    .catch(()=>{if(alive)setSaved({status:"empty",inputs:null,savedAt:null,reason:"QA backend unavailable"})});
  return()=>{alive=false};
 },[]);
 async function save(inputs:CareInputs){
  const response=await fetch("/qa-care-scenario",{
   method:"POST",headers:{"Content-Type":"application/json"},
   body:JSON.stringify(inputs),
  });
  if(!response.ok)throw new Error("QA save rejected");
  const result=await response.json() as Saved;
  setConfirmed(result.status==="saved_valid"?result.inputs:null);
  return {status:result.status,reason:result.reason};
 }
 return <main className="mx-auto max-w-screen-lg p-3 sm:p-6">
  <h1 className="text-xl font-bold">Synthetic LTC care scenario QA</h1>
  <p className="text-xs text-slate-600">Synthetic browser fixture. No client data.</p>
  {saved===null?<p role="status">Loading persisted scenario…</p>:
  <>
   <CareCalculator
    policyId={20} defaultDailyMax={250} defaultMonthlyMax={7500}
    lifetimeMaximum={273750} eliminationPeriod="0"
    initialScenario={saved.inputs}
    initialScenarioValidated={saved.status==="saved_valid"}
    initialScenarioReason={saved.reason}
    onSaveScenario={save} onConfirmedScenario={setConfirmed}
   />
   <output data-testid="confirmed" className="text-xs">
     {confirmed ? "verified-model-present":"no-verified-model"}
   </output>
  </>}
 </main>;
}
createRoot(document.getElementById("root")!).render(<Page/>);
