"use client";
import {useState} from "react";
export default function BillingActions({storeId,planId,disabled}:{storeId:string;planId:string;disabled:boolean}){
 const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 async function subscribe(){setBusy(true);setError("");try{const response=await fetch("/api/billing/initialize",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({storeId,planId})});const data=await response.json();if(!response.ok)throw new Error(data.error||"Could not start subscription.");window.location.assign(data.authorizationUrl);}catch(e){setError(e instanceof Error?e.message:"Could not start subscription.");setBusy(false);}}
 return <div className="billing-action"><button onClick={subscribe} disabled={disabled||busy}>{busy?"Connecting to Paystack…":"Choose this plan"}</button>{error&&<small role="alert">{error}</small>}</div>;
}
