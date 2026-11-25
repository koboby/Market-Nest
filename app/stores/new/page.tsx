import "./new-store.css";
"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Store } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function toSlug(value: string) { return value.toLowerCase().trim().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,48); }

export default function NewStorePage() {
  const router=useRouter(); const [name,setName]=useState(""); const [slug,setSlug]=useState(""); const [slugEdited,setSlugEdited]=useState(false);
  const [error,setError]=useState(""); const [loading,setLoading]=useState(false);
  function changeName(value:string){setName(value);if(!slugEdited)setSlug(toSlug(value));}
  async function handleSubmit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setError("");setLoading(true);const supabase=createClient();
    const {data:{user},error:userError}=await supabase.auth.getUser();
    if(userError||!user){setLoading(false);router.push("/login");return;}
    const {data:store,error:storeError}=await supabase.from("stores").insert({owner_id:user.id,name:name.trim(),slug:toSlug(slug),currency:"NGN",timezone:"Africa/Lagos"}).select("id").single();
    if(storeError||!store){setLoading(false);setError(storeError?.message??"We couldn't create your store.");return;}
    const {error:memberError}=await supabase.from("store_members").insert({store_id:store.id,user_id:user.id,role:"owner"});
    if(memberError){setLoading(false);setError("Your store was created, but its owner membership could not be saved. Please refresh your dashboard.");return;}
    setLoading(false);router.push(`/stores/${store.id}`);router.refresh();
  }
  return <main className="new-store-shell"><Link href="/dashboard" className="new-store-back"><ArrowLeft size={16}/> Back to dashboard</Link><section className="new-store-card"><div className="new-store-icon"><Store size={24}/></div><span className="new-store-eyebrow">LET'S GET YOU STARTED</span><h1>Name your store.</h1><p>This is the beginning of your online business. You can change these details later.</p><form onSubmit={handleSubmit}><label htmlFor="store-name">Store name</label><input id="store-name" required maxLength={60} value={name} onChange={e=>changeName(e.target.value)} placeholder="e.g. The Sunday Edit"/><label htmlFor="store-slug">Your store address</label><div className="slug-field"><span>marketnest.store/</span><input id="store-slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={slug} onChange={e=>{setSlugEdited(true);setSlug(toSlug(e.target.value));}} placeholder="your-store"/></div><small className="slug-help">Use lowercase letters, numbers and hyphens.</small>{error&&<p className="new-store-error" role="alert">{error}</p>}<button disabled={loading}>{loading?"Creating your store…":"Create my store"} <ArrowRight size={16}/></button></form></section></main>;
}
