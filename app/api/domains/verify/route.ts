import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
export async function POST(request:Request){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Sign in first."},{status:401});
 let body:any;try{body=await request.json();}catch{return NextResponse.json({error:"Invalid request."},{status:400});}
 const id=String(body.id??"");const {data:domain}=await supabase.from("store_domains").select("id,store_id,domain").eq("id",id).maybeSingle();if(!domain)return NextResponse.json({error:"Domain not found or access denied."},{status:404});
 const token=process.env.VERCEL_TOKEN,projectId=process.env.VERCEL_PROJECT_ID;if(!token||!projectId)return NextResponse.json({error:"Vercel domain verification is not configured."},{status:503});
 const teamId=process.env.VERCEL_TEAM_ID;const query=teamId?`?teamId=${encodeURIComponent(teamId)}`:"";
 const response=await fetch(`https://api.vercel.com/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(domain.domain)}${query}`,{headers:{"Authorization":`Bearer ${token}`},cache:"no-store"});
 const result=await response.json();if(!response.ok)return NextResponse.json({error:result.error?.message||"Could not check domain with Vercel."},{status:response.status});
 const verified=Boolean(result.verified);const {error}=await supabase.from("store_domains").update({verification_status:verified?"verified":"pending"}).eq("id",id);if(error)return NextResponse.json({error:error.message},{status:500});
 return NextResponse.json({verified,verification:result.verification??[]});
}
