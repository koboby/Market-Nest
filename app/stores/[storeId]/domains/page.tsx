import "./domains.css";
import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {ArrowLeft,Globe2} from "lucide-react";
import {createClient} from "@/lib/supabase/server";
import DomainManager from "./domain-manager";
export default async function DomainsPage({params}:{params:Promise<{storeId:string}>}){
 const {storeId}=await params;const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:store}=await supabase.from("stores").select("id,name,slug").eq("id",storeId).maybeSingle();if(!store)notFound();
 const {data:domains}=await supabase.from("store_domains").select("id,domain,verification_status,is_primary").eq("store_id",storeId).order("created_at");
 return <main className="domains-shell"><header><Link href={`/stores/${storeId}`}><ArrowLeft size={16}/> {store.name}</Link><span>STORE DOMAINS</span></header><section className="domains-heading"><Globe2 size={25}/><small>YOUR BRAND, YOUR ADDRESS</small><h1>Custom domains.</h1><p>Connect your own domain to give customers a memorable place to shop.</p></section><DomainManager storeId={storeId} slug={store.slug} initialDomains={domains??[]}/></main>;
}
