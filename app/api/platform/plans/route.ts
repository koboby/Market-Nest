import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
async function isPlatformAdmin(){const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();const allow=(process.env.PLATFORM_ADMIN_EMAILS??"").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean);return {user,allowed:!!user?.email&&allow.includes(user.email.toLowerCase())};}
export async function POST(request:Request){
 const {user,allowed}=await isPlatformAdmin();if(!user)return NextResponse.json({error:"Sign in first."},{status:401});if(!allowed)return NextResponse.json({error:"Platform administrator access is required."},{status:403});
 const secret=process.env.PAYSTACK_SECRET_KEY;if(!secret)return NextResponse.json({error:"Configure PAYSTACK_SECRET_KEY before creating recurring plans."},{status:503});
 let body:any;try{body=await request.json();}catch{return NextResponse.json({error:"Invalid request."},{status:400});}
 const name=String(body.name??"").trim(),slug=String(body.slug??"").trim().toLowerCase(),description=String(body.description??"").trim(),price=Number(body.price);
 if(name.length<2||!/^[a-z0-9-]{2,40}$/.test(slug)||!Number.isFinite(price)||price<=0||price>100000000)return NextResponse.json({error:"Enter a plan name, a URL-safe slug, and a valid monthly price."},{status:400});
 const features=Array.isArray(body.features)?body.features.map((x:any)=>String(x).trim()).filter(Boolean).slice(0,12):[];
 const response=await fetch("https://api.paystack.co/plan",{method:"POST",headers:{"Authorization":`Bearer ${secret}`,"Content-Type":"application/json"},body:JSON.stringify({name,description,amount:Math.round(price*100),interval:"monthly",currency:"NGN"})});
 const result=await response.json();if(!response.ok||!result.status||!result.data?.plan_code)return NextResponse.json({error:result.message||"Paystack could not create the recurring plan."},{status:502});
 const admin=createAdminClient();const {data,error}=await admin.from("subscription_plans").insert({name,slug,description,price_monthly:price,currency:"NGN",features,provider_plan_code:result.data.plan_code,is_active:true}).select("id,name,slug,price_monthly,provider_plan_code").single();
 if(error)return NextResponse.json({error:error.message,providerPlanCreated:true,planCode:result.data.plan_code},{status:500});
 return NextResponse.json({plan:data});
}
