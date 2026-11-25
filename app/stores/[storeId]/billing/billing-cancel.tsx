"use client";
import {useState} from "react";
export default function BillingCancel({storeId}:{storeId:string}){
 const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
 async function cancel(){if(!window.confirm("Request cancellation of this recurring subscription?"))return;setBusy(true);setMessage("");try{const response=await fetch("/api/billing/cancel",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({storeId})});const data=await response.json();if(!response.ok)throw new Error(data.error||"Could not cancel subscription.");setMessage(data.message); }catch(e){setMessage(e instanceof Error?e.message:"Could not cancel subscription.");}setBusy(false);}
 return <div className="billing-cancel"><button onClick={cancel} disabled={busy}>{busy?"Requesting…":"Cancel renewal"}</button>{message&&<small role="status">{message}</small>}</div>;
}
