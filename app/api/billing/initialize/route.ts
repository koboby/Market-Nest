import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
import {isRecord} from "@/lib/validation";
export async function POST(request:Request){
 const secret=process.env.PAYSTACK_SECRET_KEY;if(!secret)return NextResponse.json({error:"Subscription payments are not configured yet."},{status:503});
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Please sign in."},{status:401});
 let rawBody:unknown;try{rawBody=await request.json();}catch{return NextResponse.json({error:"Invalid request."},{status:400});}
 if(!isRecord(rawBody)||typeof rawBody.storeId!=="string"||typeof rawBody.planId!=="string")return NextResponse.json({error:"Choose a valid store and plan."},{status:400});
 const storeId=rawBody.storeId;const planId=rawBody.planId;if(typeof storeId!=="string"||typeof planId!=="string")return NextResponse.json({error:"Choose a valid store and plan."},{status:400});
 const [{data:store},{data:plan},{data:existing}]=await Promise.all([
  supabase.from("stores").select("id,name,owner_id").eq("id",storeId).maybeSingle(),
  supabase.from("subscription_plans").select("id,name,price_monthly,currency,provider_plan_code").eq("id",planId).eq("is_active",true).maybeSingle(),
  supabase.from("store_subscriptions").select("id,status").eq("store_id",storeId).in("status",["trialing","active","past_due"]).maybeSingle()
 ]);
 if(!store||!plan)return NextResponse.json({error:"Store or plan not found."},{status:404});
 if(store.owner_id!==user.id)return NextResponse.json({error:"Only the store owner can manage billing."},{status:403});
 if(!user.email)return NextResponse.json({error:"Your account needs an email address to subscribe."},{status:400});
 if(existing?.status==="active")return NextResponse.json({error:"This store already has an active subscription."},{status:409});
 if(!plan.provider_plan_code)return NextResponse.json({error:"This plan is not connected to a Paystack recurring plan yet."},{status:409});
 const admin=createAdminClient();
 const pending={store_id:storeId,plan_id:plan.id,status:"trialing",billing_provider:"paystack",current_period_start:new Date().toISOString()};
 const {error:pendingError}=existing?await admin.from("store_subscriptions").update(pending).eq("id",existing.id):await admin.from("store_subscriptions").insert(pending);
 if(pendingError)return NextResponse.json({error:"Could not prepare your subscription."},{status:500});
 const origin=new URL(request.url).origin;
 const response=await fetch("https://api.paystack.co/transaction/initialize",{method:"POST",headers:{"Authorization":`Bearer ${secret}`,"Content-Type":"application/json"},body:JSON.stringify({email:user.email,plan:plan.provider_plan_code,amount:Math.round(Number(plan.price_monthly)*100),currency:plan.currency||"NGN",callback_url:`${origin}/stores/${storeId}/billing/confirmation`,metadata:{purpose:"market_nest_subscription",store_id:storeId,plan_id:plan.id,plan_name:plan.name}})});
 const result=await response.json();if(!response.ok||!result.status||!result.data?.authorization_url){await admin.from("store_subscriptions").update({status:"expired"}).eq("store_id",storeId).eq("plan_id",plan.id).eq("status","trialing");return NextResponse.json({error:result.message||"Could not start subscription payment."},{status:502});}
 return NextResponse.json({authorizationUrl:result.data.authorization_url});
}
