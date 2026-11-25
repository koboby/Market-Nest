import "./products.css";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Plus, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function ProductsPage({params}:{params:Promise<{storeId:string}>}) {
  const {storeId}=await params; const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect("/login");
  const {data:store}=await supabase.from("stores").select("id,name").eq("id",storeId).maybeSingle();
  if(!store) notFound();
  const {data:products,error}=await supabase.from("products").select("id,title,slug,price,status,inventory_quantity,created_at").eq("store_id",storeId).order("created_at",{ascending:false});
  return <main className="products-shell"><header className="products-top"><Link href={`/stores/${storeId}`}><ArrowLeft size={16}/> {store.name}</Link><span>PRODUCT CATALOGUE</span></header><section className="products-heading"><div><span className="products-eyebrow">YOUR CATALOGUE</span><h1>Products</h1><p>Everything you sell, organised in one place.</p></div><Link className="products-add" href={`/stores/${storeId}/products/new`}><Plus size={16}/> Add product</Link></section><section className="products-list"><div className="products-list-head"><h2>All products <span>{products?.length??0}</span></h2><span>Manage your online catalogue</span></div>{error?<p className="products-error">Could not load products. Refresh and try again.</p>:products?.length?<div className="products-table"><div className="products-table-row products-table-labels"><span>PRODUCT</span><span>PRICE</span><span>INVENTORY</span><span>STATUS</span></div>{products.map(product=><div className="products-table-row" key={product.id}><div className="products-name"><span className="products-thumb"><Package size={18}/></span><span><b>{product.title}</b><small>/{product.slug}</small></span></div><span>₦{Number(product.price).toLocaleString("en-NG",{minimumFractionDigits:2})}</span><span>{product.inventory_quantity}</span><span><i className={`product-status product-status-${product.status}`}>{product.status}</i></span></div>)}</div>:<div className="products-empty"><span><Package size={26}/></span><h3>Your first product goes here.</h3><p>Add a product to start building your online catalogue.</p><Link className="products-add" href={`/stores/${storeId}/products/new`}><Plus size={16}/> Add your first product</Link></div>}</section></main>;
}
