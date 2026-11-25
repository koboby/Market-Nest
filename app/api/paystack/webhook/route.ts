import { NextResponse } from "next/server";
import { createHmac,timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
export const runtime="nodejs";
export async function POST(request:Request){
 const secret=process.env.PAYSTACK_SECRET_KEY;if(!secret)return NextResponse.json({error:"Webhook is not configured."},{status:503});
 const raw=await request.text();const signature=request.headers.get("x-paystack-signature")??request.headers.get("paystack-signature")??"";
 const expected=createHmac("sha512",secret).update(raw).digest("hex");
 const a=Buffer.from(signature);const b=Buffer.from(expected);
 if(a.length!==b.length||!timingSafeEqual(a,b))return NextResponse.json({error:"Invalid signature."},{status:401});
 let event:any;try{event=JSON.parse(raw);}catch{return NextResponse.json({error:"Invalid payload."},{status:400});}
 const admin=createAdminClient();
 if(event.event==="charge.success"&&typeof event.data?.reference==="string"){
  const metadata=event.data.metadata??{};
  if(metadata.purpose==="market_nest_subscription"&&metadata.store_id&&metadata.plan_id){
   if(event.data.status!=="success")return NextResponse.json({error:"Subscription payment was not successful."},{status:400});
   const {data:existing}=await admin.from("store_subscriptions").select("id").eq("store_id",metadata.store_id).in("status",["trialing","active","past_due"]).maybeSingle();
   const subscription={store_id:metadata.store_id,plan_id:metadata.plan_id,status:"active",billing_provider:"paystack",provider_customer_code:event.data.customer?.customer_code??null,provider_subscription_code:event.data.subscription?.subscription_code??event.data.subscription_code??null,current_period_start:new Date().toISOString(),current_period_end:event.data.subscription?.next_payment_date??null};
   const result=existing?await admin.from("store_subscriptions").update(subscription).eq("id",existing.id):await admin.from("store_subscriptions").insert(subscription);
   if(result.error)return NextResponse.json({error:"Subscription could not be activated."},{status:500});
  }else{
   const {data:order}=await admin.from("orders").select("id,total,currency").eq("payment_reference",event.data.reference).maybeSingle();
   if(order){
    if(event.data.status!=="success"||Number(event.data.amount)!==Math.round(Number(order.total)*100)||event.data.currency!==order.currency)return NextResponse.json({error:"Payment details did not match the order."},{status:400});
    const {error}=await admin.rpc("complete_paid_order",{p_reference:event.data.reference,p_payload:event.data});
    if(error)return NextResponse.json({error:"Payment confirmation could not be saved."},{status:500});
   }
  }
 }
 if(event.event==="subscription.disable"||event.event==="subscription.not_renew"){
  const code=event.data?.subscription_code;
  if(code){const {error}=await admin.from("store_subscriptions").update(event.event==="subscription.disable"?{status:"cancelled"}:{cancel_at_period_end:true}).eq("provider_subscription_code",code);if(error)return NextResponse.json({error:"Subscription update failed."},{status:500});}
 }
 if(event.event==="invoice.payment_failed"){
  const code=event.data?.subscription?.subscription_code??event.data?.subscription_code;
  if(code){await admin.from("store_subscriptions").update({status:"past_due"}).eq("provider_subscription_code",code);}
 }
 return NextResponse.json({received:true});
}
