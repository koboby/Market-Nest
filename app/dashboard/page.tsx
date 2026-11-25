import "./dashboard.css";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ImagePlus, Layers3, Package, Palette, Plus, Store } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const platformAdmins=(process.env.PLATFORM_ADMIN_EMAILS??"").split(",").map(value=>value.trim().toLowerCase()).filter(Boolean);
  const isPlatformAdmin=!!user.email&&platformAdmins.includes(user.email.toLowerCase());
  const { data: stores, error } = await supabase.from("stores").select("id, name, slug, status, currency, created_at").order("created_at", { ascending: false });
  if (error) return <main className="dashboard-shell"><p className="dashboard-error">We couldn’t load your stores. Please refresh and try again.</p></main>;
  return <main className="dashboard-shell">
    <header className="dashboard-topbar"><Link className="dashboard-brand" href="/">market<span>nest</span></Link><span className="dashboard-user">{user.email}</span>{isPlatformAdmin&&<Link href="/platform" className="dashboard-admin-link">Platform admin</Link>}</header>
    <section className="dashboard-welcome"><div><span className="dashboard-eyebrow">YOUR WORKSPACE</span><h1>Good things start <em>here.</em></h1><p>Manage your stores, shape your storefront and grow your online business.</p></div><Link className="dashboard-primary" href="/stores/new"><Plus size={17}/> Create a store</Link></section>
    <section className="dashboard-section"><div className="dashboard-section-heading"><div><span className="dashboard-eyebrow">YOUR BUSINESS</span><h2>Your stores</h2></div><span>{stores?.length ?? 0} stores</span></div>
      {stores?.length ? <div className="dashboard-store-grid">{stores.map(store => <Link className="dashboard-store-card" href={`/stores/${store.id}`} key={store.id}><div className="dashboard-store-icon"><Store size={21}/></div><span className="dashboard-status">{store.status}</span><h3>{store.name}</h3><p>/s/{store.slug}</p><span className="dashboard-card-link">Open workspace <ArrowRight size={15}/></span></Link>)}</div> : <div className="dashboard-empty"><div className="dashboard-empty-icon"><Store size={25}/></div><h3>Your first store starts here</h3><p>Choose a name, pick a theme and build a storefront that feels like your brand.</p><Link className="dashboard-primary" href="/stores/new"><Plus size={17}/> Create your first store</Link></div>}
    </section>
    <section className="dashboard-shortcuts"><div><Package size={18}/><span><b>Products</b><small>Your catalogue, all in one place</small></span></div><div><Layers3 size={18}/><span><b>Collections</b><small>Organise products your way</small></span></div><div><Palette size={18}/><span><b>Store design</b><small>Make every page yours</small></span></div><div><ImagePlus size={18}/><span><b>Optimised media</b><small>Every upload under 100 KB</small></span></div></section>
  </main>;
}
