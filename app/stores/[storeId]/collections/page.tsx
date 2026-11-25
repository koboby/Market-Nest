import "./collections.css";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Layers3, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function CollectionsPage({params}:{params:Promise<{storeId:string}>}){
 const {storeId}=await params;const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:store}=await supabase.from("stores").select("id,name").eq("id",storeId).maybeSingle();if(!store)notFound();
 const {data:collections,error}=await supabase.from("collections").select("id,title,slug,description,is_published,created_at").eq("store_id",storeId).order("sort_order");
 return <main className="collections-shell"><header><Link href={`/stores/${storeId}`}><ArrowLeft size={16}/> {store.name}</Link><span>PRODUCT ORGANISATION</span></header><section className="collections-heading"><div><span>YOUR CATALOGUE</span><h1>Collections</h1><p>Bring related products together so customers can browse with ease.</p></div><Link href={`/stores/${storeId}/collections/new`}><Plus size={16}/> New collection</Link></section>{error?<p className="collections-error">Could not load collections.</p>:collections?.length?<div className="collections-grid">{collections.map(c=><article key={c.id}><span className="collection-icon"><Layers3 size={21}/></span><small>{c.is_published?"Published":"Draft"}</small><h2>{c.title}</h2><p>{c.description||"No description yet."}</p><span>/{c.slug}</span></article>)}</div>:<div className="collections-empty"><span><Layers3 size={26}/></span><h2>No collections yet</h2><p>Create a collection to organise your products into easy-to-shop groups.</p><Link href={`/stores/${storeId}/collections/new`}><Plus size={16}/> Create a collection</Link></div>}</main>;
}
