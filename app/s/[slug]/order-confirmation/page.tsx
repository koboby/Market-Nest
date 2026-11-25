import Link from "next/link";
import {redirect} from "next/navigation";
import {CheckCircle2,Clock3} from "lucide-react";
import {createAdminClient} from "@/lib/supabase/admin";
export default async function OrderConfirmation({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<{reference?:string}>}){
 const {slug}=await params;const {reference}=await searchParams;if(!reference)redirect(`/s/${slug}`);
 const admin=createAdminClient();const {data:order}=await admin.from("orders").select("id,store_id,total,currency,payment_status,payment_reference,stores!inner(slug,name)").eq("payment_reference",reference).maybeSingle();
 if(!order||((order.stores as any).slug!==slug))redirect(`/s/${slug}`);
 if(order.payment_status==="pending"&&process.env.PAYSTACK_SECRET_KEY){
  const response=await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,{headers:{Authorization:`Bearer ${process.env.PAYSTACK_SECRET_KEY}`},cache:"no-store"});
  if(response.ok){const result=await response.json();if(result.status&&result.data?.status==="success"&&Number(result.data.amount)===Math.round(Number(order.total)*100)&&result.data.currency===order.currency){await admin.rpc("complete_paid_order",{p_reference:reference,p_payload:result.data});}}
 }
 const {data:latest}=await admin.from("orders").select("payment_status,order_number").eq("id",order.id).single();
 const paid=latest?.payment_status==="paid";
 return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#f7f6f0",padding:24,color:"#26372b"}}><section style={{maxWidth:480,textAlign:"center",background:"#fff",padding:"48px 30px",borderRadius:18,border:"1px solid #e7e9e2"}}>{paid?<CheckCircle2 size={42} color="#4b7953"/>:<Clock3 size={42} color="#9a7a43"/>}<p style={{fontSize:10,letterSpacing:2,fontWeight:800,color:"#78917e"}}>{(order.stores as any).name.toUpperCase()}</p><h1 style={{font:"500 34px Georgia",margin:"16px 0"}}>{paid?"Your order is confirmed.":"Payment is being confirmed."}</h1><p style={{fontSize:13,lineHeight:1.8,color:"#7b887e"}}>{paid?`Thank you. Your order #${latest?.order_number} has been paid successfully.`:"We have received your payment return. Your order status will update as soon as the payment provider confirms it."}</p><Link href={`/s/${slug}`} style={{display:"inline-block",marginTop:22,background:"#365c43",color:"#fff",padding:"13px 20px",borderRadius:7,fontSize:12}}>Continue shopping</Link></section></main>;
}
