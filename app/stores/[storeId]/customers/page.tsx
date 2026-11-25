import "./customers.css";
import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {ArrowLeft,Users} from "lucide-react";
import {createClient} from "@/lib/supabase/server";
export default async function CustomersPage({params}:{params:Promise<{storeId:string}>}){
 const {storeId}=await params;const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:store}=await supabase.from("stores").select("id,name").eq("id",storeId).maybeSingle();if(!store)notFound();
 const {data:customers,error}=await supabase.from("customers").select("id,email,full_name,phone,total_orders,total_spent,created_at").eq("store_id",storeId).order("created_at",{ascending:false}).limit(100);
 return <main className="customers-shell"><header><Link href={`/stores/${storeId}`}><ArrowLeft size={16}/> {store.name}</Link><span>CUSTOMER RELATIONSHIPS</span></header><section className="customers-heading"><div><small>YOUR COMMUNITY</small><h1>Customers</h1><p>Get to know the people who shop with you.</p></div><b>{customers?.length??0} customers</b></section><section className="customers-panel">{error?<p>Could not load customers.</p>:customers?.length?<div className="customers-table"><div className="customers-row customers-label"><span>CUSTOMER</span><span>PHONE</span><span>ORDERS</span><span>TOTAL SPENT</span></div>{customers.map(c=><article className="customers-row" key={c.id}><span><b>{c.full_name||"Customer"}</b><small>{c.email}</small></span><span>{c.phone||"—"}</span><span>{c.total_orders}</span><b>₦{Number(c.total_spent).toLocaleString("en-NG",{minimumFractionDigits:2})}</b></article>)}</div>:<div className="customers-empty"><Users size={28}/><h2>Your customers will show up here.</h2><p>Customer profiles are created automatically when shoppers place their first order.</p></div>}</section></main>;
}
