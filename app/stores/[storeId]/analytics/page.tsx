import "./analytics.css";
import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {ArrowLeft,ChartNoAxesCombined,ShoppingBag,Wallet,Users} from "lucide-react";
import {createClient} from "@/lib/supabase/server";
export default async function AnalyticsPage({params}:{params:Promise<{storeId:string}>}){
 const {storeId}=await params;const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:store}=await supabase.from("stores").select("id,name,currency").eq("id",storeId).maybeSingle();if(!store)notFound();
 const since=new Date();since.setMonth(since.getMonth()-5);since.setDate(1);
 const [{data:orders},{count:customers},{count:products}]=await Promise.all([
  supabase.from("orders").select("id,total,payment_status,created_at").eq("store_id",storeId).gte("created_at",since.toISOString()).order("created_at",{ascending:false}).limit(1000),
  supabase.from("customers").select("*",{count:"exact",head:true}).eq("store_id",storeId),
  supabase.from("products").select("*",{count:"exact",head:true}).eq("store_id",storeId)
 ]);
 const paid=(orders??[]).filter(o=>o.payment_status==="paid");const revenue=paid.reduce((sum,o)=>sum+Number(o.total),0);
 const months=Array.from({length:6},(_,i)=>{const date=new Date(since.getFullYear(),since.getMonth()+i,1);const label=date.toLocaleDateString("en-NG",{month:"short"});const value=paid.filter(o=>{const d=new Date(o.created_at);return d.getMonth()===date.getMonth()&&d.getFullYear()===date.getFullYear();}).reduce((sum,o)=>sum+Number(o.total),0);return {label,value};});
 const max=Math.max(1,...months.map(m=>m.value));
 const money=(n:number)=>new Intl.NumberFormat("en-NG",{style:"currency",currency:store.currency||"NGN",maximumFractionDigits:0}).format(n);
 return <main className="analytics-shell"><header><Link href={`/stores/${storeId}`}><ArrowLeft size={16}/> {store.name}</Link><span>STORE PERFORMANCE</span></header><section className="analytics-heading"><small>YOUR BUSINESS AT A GLANCE</small><h1>Analytics.</h1><p>Recent performance over the last six months.</p></section><div className="analytics-stats"><article><Wallet size={18}/><span>Paid revenue</span><b>{money(revenue)}</b></article><article><ShoppingBag size={18}/><span>Paid orders</span><b>{paid.length}</b></article><article><Users size={18}/><span>Customers</span><b>{customers??0}</b></article><article><ChartNoAxesCombined size={18}/><span>Products</span><b>{products??0}</b></article></div><section className="analytics-chart"><h2>Revenue by month</h2><p>Only successfully paid orders are included.</p><div className="analytics-bars">{months.map(m=><div key={m.label}><span>{money(m.value)}</span><i style={{height:`${Math.max(4,m.value/max*100)}%`}}/><small>{m.label}</small></div>)}</div></section><p className="analytics-note">This is an initial store-level report. More detailed conversion, traffic and product analytics will be added in a later release.</p></main>;
}
