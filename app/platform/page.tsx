import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
import PlatformAdmin from "./platform-admin";
import "./platform.css";
export default async function PlatformPage(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const allow=(process.env.PLATFORM_ADMIN_EMAILS??"").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean);if(!user.email||!allow.includes(user.email.toLowerCase()))redirect("/dashboard");
 const admin=createAdminClient();const [{count:storeCount},{count:orders},{count:subscriptions},{data:plans},{data:stores},{data:subs},{data:paidOrders}]=await Promise.all([
  admin.from("stores").select("*",{count:"exact",head:true}),admin.from("orders").select("*",{count:"exact",head:true}),admin.from("store_subscriptions").select("*",{count:"exact",head:true}).eq("status","active"),admin.from("subscription_plans").select("id,name,slug,price_monthly,provider_plan_code,is_active").order("price_monthly"),admin.from("stores").select("id,name,slug,status,created_at").order("created_at",{ascending:false}).limit(100),admin.from("store_subscriptions").select("store_id,status,subscription_plans(name,price_monthly)").in("status",["trialing","active","past_due"]),admin.from("orders").select("total").eq("payment_status","paid")
 ]);
 const paidRevenue=(paidOrders??[]).reduce((sum,order)=>sum+Number(order.total),0);
 return <main className="platform-shell"><header><a href="/dashboard">MARKET NEST</a><span>PLATFORM CONTROL</span></header><section className="platform-heading"><small>SUPER ADMIN</small><h1>Platform overview.</h1><p>Manage merchant plans and monitor the Market Nest ecosystem.</p></section><div className="platform-stats"><article><span>Stores</span><b>{storeCount??0}</b></article><article><span>Orders</span><b>{orders??0}</b></article><article><span>Active subscriptions</span><b>{subscriptions??0}</b></article><article><span>Paid order revenue</span><b>₦{paidRevenue.toLocaleString("en-NG",{maximumFractionDigits:0})}</b></article></div><PlatformAdmin plans={plans??[]} stores={(stores??[]).map(store=>({...store,subscription:(subs??[]).find(sub=>sub.store_id===store.id)?.status??"none",subscriptionPlan:((subs??[]).find(sub=>sub.store_id===store.id)?.subscription_plans as any)?.name??"No plan"}))}/></main>;
}
