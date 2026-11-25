import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
export async function POST(request:Request){
 const secret=process.env.PAYSTACK_SECRET_KEY;if(!secret)return NextResponse.json({error:"Subscription payments are not configured yet."},{status:503});
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Please sign in."},{status:401});
 let body:any;try{body=await request.json();}catch{return NextResponse.json({error:"Invalid request."},{status:400});}
 const {storeId,planId}=body??{};if(typeof storeId!=="string"||typeof planId!=="string")return NextResponse.json({error:"Choose a valid store and plan."},{status:400});
 const [{data:store},{data:plan},{data:existing}]=await Promise.all([
  supabase.from("stores").select("id,name").eq("id",storeId).maybeSingle(),
  supabase.from("subscription_plans").select("id,name,price_monthly,currency,provider_plan_code").eq("id",planId).eq("is_active",true).maybeSingle(),
  supabase.from("store_subscriptions").select("id,status").eq("store_id",storeId).in("status",["trialing","active","past_due"]).maybeSingle()
 ]);
 if(!store||!plan)return NextResponse.json({error:"Store or plan not found."},{status:404});
 if(existing?.status==="active")return NextResponse.json({error:"This store already has an active subscription."},{status:409});
 if(!plan.provider_plan_code)return NextResponse.json({error:"This plan is not connected to a Paystack recurring plan yet."},{status:409});
 const origin=new URL(request.url).origin;
 const response=await fetch("https://api.paystack.co/transaction/initialize",{method:"POST",headers:{"Authorization":`Bearer ${secret}`,"Content-Type":"application/json"},body:JSON.stringify({email:user.email,plan:plan.provider_plan_code,amount:Math.round(Number(plan.price_monthly)*100),currency:plan.currency||"NGN",callback_url:`${origin}/stores/${storeId}/billing/confirmation`,metadata:{purpose:"market_nest_subscription",store_id:storeId,plan_id:plan.id,plan_name:plan.name}})});
 const result=await response.json();if(!response.ok||!result.status||!result.data?.authorization_url)return NextResponse.json({error:result.message||"Could not start subscription payment."},{status:502});
 return NextResponse.json({authorizationUrl:result.data.authorization_url});
}
