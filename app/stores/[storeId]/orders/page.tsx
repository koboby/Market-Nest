import "./orders.css";
import Link from "next/link";
import { notFound,redirect } from "next/navigation";
import { ArrowLeft,ReceiptText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function OrdersPage({params}:{params:Promise<{storeId:string}>}){
 const {storeId}=await params;const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:store}=await supabase.from("stores").select("id,name,currency").eq("id",storeId).maybeSingle();if(!store)notFound();
 const {data:orders,error}=await supabase.from("orders").select("id,order_number,email,customer_name,total,currency,payment_status,fulfillment_status,created_at").eq("store_id",storeId).order("created_at",{ascending:false}).limit(100);
 const money=(amount:number,currency:string)=>new Intl.NumberFormat("en-NG",{style:"currency",currency:currency||"NGN",maximumFractionDigits:2}).format(Number(amount));
 return <main className="orders-shell"><header><Link href={`/stores/${storeId}`}><ArrowLeft size={16}/> {store.name}</Link><span>SALES</span></header><section className="orders-heading"><div><small>YOUR BUSINESS</small><h1>Orders</h1><p>Every customer order, from payment to delivery.</p></div><span>{orders?.length??0} recent orders</span></section><section className="orders-panel">{error?<p>Could not load orders. Please refresh.</p>:orders?.length?<div className="orders-table"><div className="orders-row orders-label"><span>ORDER</span><span>CUSTOMER</span><span>TOTAL</span><span>PAYMENT</span><span>FULFILMENT</span></div>{orders.map(order=><article className="orders-row" key={order.id}><Link href={`/stores/${storeId}/orders/${order.id}`}><b>#{order.order_number}</b></Link><span>{order.customer_name}<small>{order.email}</small></span><b>{money(order.total,order.currency)}</b><i className={`order-state ${order.payment_status}`}>{order.payment_status}</i><i className="order-state">{order.fulfillment_status}</i></article>)}</div>:<div className="orders-empty"><ReceiptText size={28}/><h2>Your orders will appear here.</h2><p>When customers complete checkout, you can track payments and fulfilment from this page.</p></div>}</section></main>;
}
