import "./billing.css";
import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {ArrowLeft,CheckCircle2,CreditCard} from "lucide-react";
import {createClient} from "@/lib/supabase/server";
import BillingActions from "./billing-actions";
import BillingCancel from "./billing-cancel";
export default async function BillingPage({params}:{params:Promise<{storeId:string}>}){
 const {storeId}=await params;const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:store}=await supabase.from("stores").select("id,name,currency").eq("id",storeId).maybeSingle();if(!store)notFound();
 const [{data:plans},{data:subscription}]=await Promise.all([supabase.from("subscription_plans").select("id,name,slug,description,price_monthly,currency,features,product_limit,staff_limit,provider_plan_code").eq("is_active",true).order("price_monthly"),supabase.from("store_subscriptions").select("status,current_period_end,cancel_at_period_end,subscription_plans(name,price_monthly,currency)").eq("store_id",storeId).in("status",["trialing","active","past_due"]).maybeSingle()]);
 const current=subscription as any;
 return <main className="billing-shell"><header><Link href={`/stores/${storeId}`}><ArrowLeft size={16}/> {store.name}</Link><span>MARKET NEST BILLING</span></header><section className="billing-heading"><small>YOUR SUBSCRIPTION</small><h1>Plans that grow with you.</h1><p>Choose the tools and room your online business needs.</p></section><section className="billing-current"><CreditCard size={20}/><div><b>Current plan: {current?.subscription_plans?.name??"No active plan"}</b><span>{current? `Status: ${current.status}${current.cancel_at_period_end?" · Renewal cancelled":""}`: "Choose a plan below to activate your merchant subscription."}</span></div>{current?.status==="active"&&!current.cancel_at_period_end&&<BillingCancel storeId={storeId}/>}</section><div className="billing-plans">{plans?.length?plans.map(plan=><article key={plan.id}><small>{plan.slug.toUpperCase()}</small><h2>{plan.name}</h2><p>{plan.description||"A plan for your growing online store."}</p><strong>{new Intl.NumberFormat("en-NG",{style:"currency",currency:plan.currency||"NGN",maximumFractionDigits:0}).format(Number(plan.price_monthly))}<i>/month</i></strong><ul>{(Array.isArray(plan.features)?plan.features:[]).map((feature:string)=><li key={feature}><CheckCircle2 size={15}/>{feature}</li>)}</ul><BillingActions storeId={storeId} planId={plan.id} disabled={!plan.provider_plan_code||current?.status==="active"}/></article>):<div className="billing-empty">Subscription plans will appear here when platform pricing is configured.</div>}</div></main>;
}
