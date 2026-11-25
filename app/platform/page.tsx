import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
import PlatformAdmin from "./platform-admin";
import "./platform.css";
export default async function PlatformPage(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const allow=(process.env.PLATFORM_ADMIN_EMAILS??"").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean);if(!user.email||!allow.includes(user.email.toLowerCase()))redirect("/dashboard");
 const admin=createAdminClient();const [{count:stores},{count:orders},{count:subscriptions},{data:plans}]=await Promise.all([
  admin.from("stores").select("*",{count:"exact",head:true}),admin.from("orders").select("*",{count:"exact",head:true}),admin.from("store_subscriptions").select("*",{count:"exact",head:true}).eq("status","active"),admin.from("subscription_plans").select("id,name,slug,price_monthly,provider_plan_code,is_active").order("price_monthly")
 ]);
 return <main className="platform-shell"><header><a href="/dashboard">MARKET NEST</a><span>PLATFORM CONTROL</span></header><section className="platform-heading"><small>SUPER ADMIN</small><h1>Platform overview.</h1><p>Manage merchant plans and monitor the Market Nest ecosystem.</p></section><div className="platform-stats"><article><span>Stores</span><b>{stores??0}</b></article><article><span>Orders</span><b>{orders??0}</b></article><article><span>Active subscriptions</span><b>{subscriptions??0}</b></article></div><PlatformAdmin plans={plans??[]}/></main>;
}
