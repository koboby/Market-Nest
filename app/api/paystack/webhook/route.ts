import { NextResponse } from "next/server";
import { createHmac,timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
export const runtime="nodejs";
export async function POST(request:Request){
 const secret=process.env.PAYSTACK_SECRET_KEY;if(!secret)return NextResponse.json({error:"Webhook is not configured."},{status:503});
 const raw=await request.text();const signature=request.headers.get("x-paystack-signature")??"";
 const expected=createHmac("sha512",secret).update(raw).digest("hex");
 const a=Buffer.from(signature);const b=Buffer.from(expected);
 if(a.length!==b.length||!timingSafeEqual(a,b))return NextResponse.json({error:"Invalid signature."},{status:401});
 let event:any;try{event=JSON.parse(raw);}catch{return NextResponse.json({error:"Invalid payload."},{status:400});}
 if(event.event==="charge.success"&&typeof event.data?.reference==="string"){
  const admin=createAdminClient();
  const {data:order}=await admin.from("orders").select("id,total,currency").eq("payment_reference",event.data.reference).maybeSingle();
  if(!order)return NextResponse.json({received:true});
  if(event.data.status!=="success"||Number(event.data.amount)!==Math.round(Number(order.total)*100)||event.data.currency!==order.currency)return NextResponse.json({error:"Payment details did not match the order."},{status:400});
  const {error}=await admin.rpc("complete_paid_order",{p_reference:event.data.reference,p_payload:event.data});
  if(error)return NextResponse.json({error:"Payment confirmation could not be saved."},{status:500});
 }
 return NextResponse.json({received:true});
}
