import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
import PlatformAdmin from "./platform-admin";
import "./platform.css";
type StoreSummary={id:string;name:string;slug:string;status:string;created_at:string};
type SubscriptionSummary={store_id:string;status:string;subscription_plans:{name:string;price_monthly:number}|null};
export default async function PlatformPage(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const allow=(process.env.PLATFORM_ADMIN_EMAILS??"").split(",").map(value=>value.trim().toLowerCase()).filter(Boolean);if(!user.email||!allow.includes(user.email.toLowerCase()))redirect("/dashboard");
 const admin=createAdminClient();
 const [{count:storeCount},{count:orders},{count:subscriptions},{data:plans},{data:storeData},{data:subscriptionData},{data:paidOrders}]=await Promise.all([
  admin.from("stores").select("*",{count:"exact",head:true}),
  admin.from("orders").select("*",{count:"exact",head:true}),
  admin.from("store_subscriptions").select("*",{count:"exact",head:true}).eq("status","active"),
  admin.from("subscription_plans").select("id,name,slug,price_monthly,provider_plan_code,is_active").order("price_monthly"),
  admin.from("stores").select("id,name,slug,status,created_at").order("created_at",{ascending:false}).limit(100),
  admin.from("store_subscriptions").select("store_id,status,subscription_plans(name,price_monthly)").in("status",["trialing","active","past_due"]),
  admin.from("orders").select("total").eq("payment_status","paid").eq("currency","NGN")
 ]);
 const paidRevenue=(paidOrders??[]).reduce((sum,order)=>sum+Number(order.total),0);
 const subscriptionsByStore=new Map(((subscriptionData??[]) as SubscriptionSummary[]).map(subscription=>[subscription.store_id,subscription]));
 const merchantStores=((storeData??[]) as StoreSummary[]).map(store=>{const subscription=subscriptionsByStore.get(store.id);return {...store,subscription:subscription?.status??"none",subscriptionPlan:subscription?.subscription_plans?.name??"No plan"};});
 return <main className="platform-shell"><header><a href="/dashboard">MARKET NEST</a><span>PLATFORM CONTROL</span></header><section className="platform-heading"><small>SUPER ADMIN</small><h1>Platform overview.</h1><p>Manage merchant plans and monitor the Market Nest ecosystem.</p></section><div className="platform-stats"><article><span>Stores</span><b>{storeCount??0}</b></article><article><span>Orders</span><b>{orders??0}</b></article><article><span>Active subscriptions</span><b>{subscriptions??0}</b></article><article><span>Paid revenue (NGN)</span><b>₦{paidRevenue.toLocaleString("en-NG",{maximumFractionDigits:0})}</b></article></div><PlatformAdmin plans={plans??[]} stores={merchantStores}/></main>;
}
