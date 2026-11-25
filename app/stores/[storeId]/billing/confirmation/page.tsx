import Link from "next/link";
import "./confirmation.css";
import {redirect} from "next/navigation";
import {CheckCircle2,Clock3} from "lucide-react";
import {createClient} from "@/lib/supabase/server";
export default async function BillingConfirmation({params}:{params:Promise<{storeId:string}>}){
 const {storeId}=await params;const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:store}=await supabase.from("stores").select("id,name").eq("id",storeId).maybeSingle();if(!store)redirect("/dashboard");
 const {data:subscription}=await supabase.from("store_subscriptions").select("status,subscription_plans(name)").eq("store_id",storeId).in("status",["active","trialing"]).maybeSingle();
 return <main className="billing-confirm"><section>{subscription?<CheckCircle2 size={40}/>:<Clock3 size={40}/>}<h1>{subscription?"Subscription activated.":"Payment confirmation pending."}</h1><p>{subscription?`Your ${(subscription as any).subscription_plans?.name??"Market Nest"} subscription is active.`:"Paystack will notify Market Nest as soon as your recurring payment is confirmed. You can refresh this page shortly."}</p><Link href={`/stores/${storeId}/billing`}>Return to billing</Link></section></main>;
}
