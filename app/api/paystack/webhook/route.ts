import {NextResponse} from "next/server";
import {createHmac,timingSafeEqual} from "node:crypto";
import {createAdminClient} from "@/lib/supabase/admin";
import {isRecord} from "@/lib/validation";
export const runtime="nodejs";
export async function POST(request:Request){
 const secret=process.env.PAYSTACK_SECRET_KEY;if(!secret)return NextResponse.json({error:"Webhook is not configured."},{status:503});
 const raw=await request.text();const signature=request.headers.get("x-paystack-signature")??request.headers.get("paystack-signature")??"";
 const expected=createHmac("sha512",secret).update(raw).digest("hex");const a=Buffer.from(signature);const b=Buffer.from(expected);
 if(a.length!==b.length||!timingSafeEqual(a,b))return NextResponse.json({error:"Invalid signature."},{status:401});
 let parsed:unknown;try{parsed=JSON.parse(raw);}catch{return NextResponse.json({error:"Invalid payload."},{status:400});}
 if(!isRecord(parsed))return NextResponse.json({error:"Invalid payload."},{status:400});
 const eventName=typeof parsed.event==="string"?parsed.event:"";const data=isRecord(parsed.data)?parsed.data:{};
 const metadata=isRecord(data.metadata)?data.metadata:{};const customer=isRecord(data.customer)?data.customer:{};
 const subscriptionData=isRecord(data.subscription)?data.subscription:{};const planData=isRecord(data.plan)?data.plan:{};
 const admin=createAdminClient();
 if(eventName==="charge.success"&&typeof data.reference==="string"){
  if(metadata.purpose==="market_nest_subscription"&&typeof metadata.store_id==="string"&&typeof metadata.plan_id==="string"){
   if(data.status!=="success")return NextResponse.json({error:"Subscription payment was not successful."},{status:400});
   const {data:existing}=await admin.from("store_subscriptions").select("id").eq("store_id",metadata.store_id).in("status",["trialing","active","past_due"]).maybeSingle();
   const subscriptionUpdate:{store_id:string;plan_id:string;status:string;billing_provider:string;provider_customer_code?:string;provider_subscription_code?:string;current_period_start:string;current_period_end?:string}={store_id:metadata.store_id,plan_id:metadata.plan_id,status:"active",billing_provider:"paystack",current_period_start:new Date().toISOString()};
   if(typeof customer.customer_code==="string")subscriptionUpdate.provider_customer_code=customer.customer_code;
   const code=typeof subscriptionData.subscription_code==="string"?subscriptionData.subscription_code:typeof data.subscription_code==="string"?data.subscription_code:undefined;
   if(code)subscriptionUpdate.provider_subscription_code=code;
   if(typeof subscriptionData.next_payment_date==="string")subscriptionUpdate.current_period_end=subscriptionData.next_payment_date;
   const result=existing?await admin.from("store_subscriptions").update(subscriptionUpdate).eq("id",existing.id):await admin.from("store_subscriptions").insert(subscriptionUpdate);
   if(result.error)return NextResponse.json({error:"Subscription could not be activated."},{status:500});
  }else{
   const {data:order}=await admin.from("orders").select("id,total,currency").eq("payment_reference",data.reference).maybeSingle();
   if(order){
    if(data.status!=="success"||Number(data.amount)!==Math.round(Number(order.total)*100)||data.currency!==order.currency)return NextResponse.json({error:"Payment details did not match the order."},{status:400});
    const {error}=await admin.rpc("complete_paid_order",{p_reference:data.reference,p_payload:data});
    if(error)return NextResponse.json({error:"Payment confirmation could not be saved."},{status:500});
   }else{
    const code=typeof subscriptionData.subscription_code==="string"?subscriptionData.subscription_code:typeof data.subscription_code==="string"?data.subscription_code:undefined;
    if(code)await admin.from("store_subscriptions").update({status:"active",current_period_start:new Date().toISOString(),...(typeof subscriptionData.next_payment_date==="string"?{current_period_end:subscriptionData.next_payment_date}:{})}).eq("provider_subscription_code",code);
   }
  }
 }
 if(eventName==="subscription.create"){
  const planCode=typeof planData.plan_code==="string"?planData.plan_code:undefined;
  const customerEmail=typeof customer.email==="string"?customer.email.toLowerCase():undefined;
  const customerCode=typeof customer.customer_code==="string"?customer.customer_code:undefined;
  const subscriptionCode=typeof data.subscription_code==="string"?data.subscription_code:undefined;
  const emailToken=typeof data.email_token==="string"?data.email_token:undefined;
  const metadataStoreId=typeof metadata.store_id==="string"?metadata.store_id:undefined;
  if(planCode&&customerEmail&&subscriptionCode){
   const {data:plan}=await admin.from("subscription_plans").select("id").eq("provider_plan_code",planCode).maybeSingle();
   if(plan){
    let storeIds:string[]=metadataStoreId?[metadataStoreId]:[];
    if(!storeIds.length){
     const {data:users}=await admin.auth.admin.listUsers({page:1,perPage:1000});
     const owner=users?.users?.find(item=>item.email?.toLowerCase()===customerEmail);
     if(owner){const {data:stores}=await admin.from("stores").select("id").eq("owner_id",owner.id);storeIds=(stores??[]).map(item=>item.id);}
    }
    if(storeIds.length){
     const {data:pending}=await admin.from("store_subscriptions").select("id").eq("plan_id",plan.id).in("status",["trialing","active"]).in("store_id",storeIds).order("created_at",{ascending:false}).limit(1).maybeSingle();
     if(pending){
      const update:{status:string;provider_customer_code?:string;provider_subscription_code:string;provider_email_token?:string;current_period_start:string;current_period_end?:string}={status:"active",provider_subscription_code:subscriptionCode,current_period_start:new Date().toISOString()};
      if(customerCode)update.provider_customer_code=customerCode;if(emailToken)update.provider_email_token=emailToken;
      if(typeof data.next_payment_date==="string")update.current_period_end=data.next_payment_date;
      await admin.from("store_subscriptions").update(update).eq("id",pending.id);
     }
    }
   }
  }
 }
 if(eventName==="subscription.disable"||eventName==="subscription.not_renew"){
  const code=typeof data.subscription_code==="string"?data.subscription_code:undefined;
  if(code){const update=eventName==="subscription.disable"?{status:"cancelled"}:{cancel_at_period_end:true};const {error}=await admin.from("store_subscriptions").update(update).eq("provider_subscription_code",code);if(error)return NextResponse.json({error:"Subscription update failed."},{status:500});}
 }
 if(eventName==="invoice.payment_failed"){
  const code=typeof subscriptionData.subscription_code==="string"?subscriptionData.subscription_code:typeof data.subscription_code==="string"?data.subscription_code:undefined;
  if(code)await admin.from("store_subscriptions").update({status:"past_due"}).eq("provider_subscription_code",code);
 }
 return NextResponse.json({received:true});
}
