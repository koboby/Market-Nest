import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
export async function PATCH(request:Request){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Sign in first."},{status:401});
 const allow=(process.env.PLATFORM_ADMIN_EMAILS??"").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean);if(!user.email||!allow.includes(user.email.toLowerCase()))return NextResponse.json({error:"Platform administrator access is required."},{status:403});
 let body:any;try{body=await request.json();}catch{return NextResponse.json({error:"Invalid request."},{status:400});}
 const {storeId,status}=body??{};if(typeof storeId!=="string"||!["draft","published","suspended"].includes(status))return NextResponse.json({error:"Choose a valid store and status."},{status:400});
 const admin=createAdminClient();const {data,error}=await admin.from("stores").update({status}).eq("id",storeId).select("id,name,slug,status").maybeSingle();
 if(error||!data)return NextResponse.json({error:error?.message||"Store not found."},{status:400});
 return NextResponse.json({store:data});
}
