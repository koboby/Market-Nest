import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
import {isRecord} from "@/lib/validation";
export async function POST(request:Request){
 const secret=process.env.PAYSTACK_SECRET_KEY;if(!secret)return NextResponse.json({error:"Billing is not configured."},{status:503});
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Sign in first."},{status:401});
 let rawBody:unknown;try{rawBody=await request.json();}catch{return NextResponse.json({error:"Invalid request."},{status:400});}
 if(!isRecord(rawBody)||typeof rawBody.storeId!=="string")return NextResponse.json({error:"Store ID is required."},{status:400});
 const storeId=rawBody.storeId;if(typeof storeId!=="string")return NextResponse.json({error:"Store ID is required."},{status:400});
 const {data:store}=await supabase.from("stores").select("id,owner_id").eq("id",storeId).maybeSingle();if(!store)return NextResponse.json({error:"Store not found or access denied."},{status:404});
 if(store.owner_id!==user.id)return NextResponse.json({error:"Only the store owner can manage billing."},{status:403});
 const admin=createAdminClient();const {data:subscription}=await admin.from("store_subscriptions").select("id,provider_subscription_code,provider_email_token").eq("store_id",storeId).eq("status","active").maybeSingle();
 if(!subscription?.provider_subscription_code||!subscription.provider_email_token)return NextResponse.json({error:"Paystack has not finished registering this subscription. Try again shortly."},{status:409});
 const response=await fetch("https://api.paystack.co/subscription/disable",{method:"POST",headers:{"Authorization":`Bearer ${secret}`,"Content-Type":"application/json"},body:JSON.stringify({code:subscription.provider_subscription_code,token:subscription.provider_email_token})});
 const result=await response.json();if(!response.ok||!result.status)return NextResponse.json({error:result.message||"Paystack could not cancel this subscription."},{status:502});
 await admin.from("store_subscriptions").update({cancel_at_period_end:true}).eq("id",subscription.id);
 return NextResponse.json({success:true,message:"Cancellation requested. Paystack will confirm the subscription status by webhook."});
}
