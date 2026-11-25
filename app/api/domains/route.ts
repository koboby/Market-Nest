import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
export async function POST(request:Request){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Sign in first."},{status:401});
 let body:any;try{body=await request.json();}catch{return NextResponse.json({error:"Invalid request."},{status:400});}
 const storeId=String(body.storeId??""),domain=String(body.domain??"").trim().toLowerCase().replace(/^https?:\/\//,"").replace(/\/$/,"");
 if(!/^[a-z0-9](?:[a-z0-9.-]{0,251}[a-z0-9])?$/.test(domain)||!domain.includes(".")||domain.includes(".."))return NextResponse.json({error:"Enter a valid domain name without a URL path."},{status:400});
 const {data:store}=await supabase.from("stores").select("id").eq("id",storeId).maybeSingle();if(!store)return NextResponse.json({error:"Store not found or access denied."},{status:404});
 const token=process.env.VERCEL_TOKEN,projectId=process.env.VERCEL_PROJECT_ID;if(!token||!projectId)return NextResponse.json({error:"Custom domain connection requires VERCEL_TOKEN and VERCEL_PROJECT_ID in the deployment environment."},{status:503});
 const teamId=process.env.VERCEL_TEAM_ID;const query=teamId?`?teamId=${encodeURIComponent(teamId)}`:"";
 const response=await fetch(`https://api.vercel.com/v10/projects/${encodeURIComponent(projectId)}/domains${query}`,{method:"POST",headers:{"Authorization":`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({name:domain})});
 const result=await response.json();if(!response.ok)return NextResponse.json({error:result.error?.message||result.message||"Vercel could not add this domain."},{status:response.status});
 const {data,error}=await supabase.from("store_domains").insert({store_id:storeId,domain,verification_status:result.verified?"verified":"pending"}).select("id,domain,verification_status,is_primary").single();
 if(error){return NextResponse.json({error:error.message,vercelDomainAdded:true},{status:500});}
 return NextResponse.json({domain:data});
}
