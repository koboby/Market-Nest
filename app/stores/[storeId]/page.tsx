import "./workspace.css";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, BarChart3, CreditCard, Globe2, ImagePlus, Layers3, Package, Palette, Settings2, Store, Users, Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { CSSProperties } from "react";

export default async function StoreWorkspacePage({params}:{params:Promise<{storeId:string}>}) {
  const {storeId}=await params; const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect("/login");
  const {data:store}=await supabase.from("stores").select("id,name,slug,status,currency,created_at").eq("id",storeId).maybeSingle();
  if(!store) notFound();
  const [{count:products},{count:collections}]=await Promise.all([
    supabase.from("products").select("*",{count:"exact",head:true}).eq("store_id",storeId),
    supabase.from("collections").select("*",{count:"exact",head:true}).eq("store_id",storeId),
  ]);
  const tools=[
    {title:"Products",description:"Add products, photos, prices and stock details.",icon:Package,href:`/stores/${storeId}/products`,value:String(products??0)},
    {title:"Collections",description:"Group products into collections customers can browse.",icon:Layers3,href:`/stores/${storeId}/collections`,value:String(collections??0)},
    {title:"Store design",description:"Choose a theme and customise your storefront.",icon:Palette,href:`/stores/${storeId}/editor`,value:"Editor"},
    {title:"Orders",description:"Track customer payments and fulfilment.",icon:Receipt,href:`/stores/${storeId}/orders`,value:"Sales"},
    {title:"Analytics",description:"See paid revenue, orders and customers.",icon:BarChart3,href:`/stores/${storeId}/analytics`,value:"Reports"},
    {title:"Customers",description:"View your customer list and purchase history.",icon:Users,href:`/stores/${storeId}/customers`,value:"CRM"},
    {title:"Subscription & billing",description:"Manage your Market Nest subscription.",icon:CreditCard,href:`/stores/${storeId}/billing`,value:"Billing"},
    {title:"Media library",description:"Browse your compressed WebP product images.",icon:ImagePlus,href:`/stores/${storeId}/media`,value:"100 KB max"},
    {title:"Custom domains",description:"Connect your own branded storefront domain.",icon:Globe2,href:`/stores/${storeId}/domains`,value:"Domains"},
    {title:"Store settings",description:"Manage your store name and preferences.",icon:Settings2,href:`/stores/${storeId}/settings`,value:"Settings"},
  ];
  return <main className="workspace-shell"><header className="workspace-top"><Link href="/dashboard"><ArrowLeft size={16}/> All stores</Link><Link href="/" className="workspace-brand">market<span>nest</span></Link></header><section className="workspace-intro"><div className="workspace-store-icon"><Store size={24}/></div><span className="workspace-eyebrow">STORE WORKSPACE</span><h1>{store.name}</h1><p>/s/{store.slug}</p><span className="workspace-status">{store.status}</span></section><section className="workspace-tools"><div className="workspace-heading"><div><span className="workspace-eyebrow">YOUR STORE</span><h2>Build something lovely.</h2></div><span>Created {new Date(store.created_at).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"})}</span></div><div className="workspace-grid">{tools.map(({title,description,icon:Icon,href,value})=><Link href={href} className="workspace-tool" key={title}><div className="workspace-tool-top"><span><Icon size={20}/></span><b>{value}</b></div><h3>{title}</h3><p>{description}</p><span className="workspace-tool-link">Open <ArrowRight size={15}/></span></Link>)}</div></section></main>;
}
