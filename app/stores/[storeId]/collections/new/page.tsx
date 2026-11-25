"use client";

import "./new-collection.css";
import Link from "next/link";
import { FormEvent,useState } from "react";
import { useParams,useRouter } from "next/navigation";
import { ArrowLeft,ArrowRight,Layers3 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function slugify(value:string){return value.toLowerCase().trim().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");}

export default function NewCollectionPage(){
 const {storeId}=useParams<{storeId:string}>();const router=useRouter();const [title,setTitle]=useState("");const [slug,setSlug]=useState("");const [description,setDescription]=useState("");const [slugEdited,setSlugEdited]=useState(false);const [error,setError]=useState("");const [loading,setLoading]=useState(false);
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setError("");setLoading(true);const supabase=createClient();const {data:{user}}=await supabase.auth.getUser();if(!user){router.push("/login");return;}
 const {error:saveError}=await supabase.from("collections").insert({store_id:storeId,title:title.trim(),slug:slugify(slug),description:description.trim()||null});
 setLoading(false);if(saveError){setError(saveError.message);return;}router.push(`/stores/${storeId}/collections`);router.refresh();}
 return <main className="new-collection-shell"><Link href={`/stores/${storeId}/collections`}><ArrowLeft size={16}/> Back to collections</Link><section><span className="new-collection-icon"><Layers3 size={23}/></span><small>ORGANISE YOUR PRODUCTS</small><h1>Create a collection.</h1><p>Give your customers an easy way to discover products that belong together.</p><form onSubmit={submit}><label htmlFor="title">Collection name</label><input id="title" required maxLength={80} value={title} onChange={e=>{setTitle(e.target.value);if(!slugEdited)setSlug(slugify(e.target.value));}} placeholder="e.g. New arrivals"/><label htmlFor="slug">Collection URL</label><input id="slug" required value={slug} onChange={e=>{setSlugEdited(true);setSlug(slugify(e.target.value));}} placeholder="new-arrivals"/><label htmlFor="description">Description (optional)</label><textarea id="description" rows={4} value={description} onChange={e=>setDescription(e.target.value)} placeholder="A short introduction to this collection…"/>{error&&<p className="new-collection-error" role="alert">{error}</p>}<button disabled={loading}>{loading?"Saving…":"Create collection"} <ArrowRight size={16}/></button></form></section></main>;
}
