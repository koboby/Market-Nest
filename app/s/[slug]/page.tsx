import "./storefront.css";
import Image from "next/image";
import StorefrontShop from "./storefront-shop";
import "./storefront-shop.css";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { createClient } from "@/lib/supabase/server";

type Section={id?:string;type:"hero"|"text"|"featured";title:string;body:string;button:string};

export default async function PublicStorefront({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;const supabase=await createClient();
 const {data:store}=await supabase.from("stores").select("id,name,slug,currency").eq("slug",slug).eq("status","published").maybeSingle();
 if(!store)notFound();
 const [{data:page},{data:products}]=await Promise.all([
  supabase.from("store_pages").select("content").eq("store_id",store.id).eq("slug","home").eq("is_published",true).maybeSingle(),
  supabase.from("products").select("id,title,description,price,inventory_quantity,images").eq("store_id",store.id).eq("status","active").order("created_at",{ascending:false}),
 ]);
 const {data:variants}=await supabase.from("product_variants").select("id,product_id,title,price,inventory_quantity").eq("store_id",store.id).eq("is_active",true);
 const content=page?.content as {sections?:Section[];theme?:{accent?:string;background?:string}}|null;
 const sections=content?.sections??[{id:"hero",type:"hero" as const,title:`Welcome to ${store.name}.`,body:"Discover something you'll love.",button:"Explore the collection"}];
 const theme=content?.theme??{accent:"#365c43",background:"#f7f6f0"};
 const visibleProducts=await Promise.all((products??[]).map(async product=>{
  const imageItems=Array.isArray(product.images)?product.images as Array<{path?:string}>:[];
  const imagePath=imageItems.find(item=>item.path)?.path;
  if(!imagePath)return {...product,imageUrl:null,variants:(variants??[]).filter(variant=>variant.product_id===product.id)};
  const {data}=await supabase.storage.from("store-media").createSignedUrl(imagePath,60*60);
  return {...product,imageUrl:data?.signedUrl??null,variants:(variants??[]).filter(variant=>variant.product_id===product.id)};
 }));
 return <main className="public-store" style={{background:theme.background??"#f7f6f0","--store-accent":theme.accent??"#365c43"} as CSSProperties}><header className="public-store-nav"><a href="#home">{store.name}</a><nav><a href="#products">Shop</a><a href="#story">Our story</a></nav><a href="#products" className="public-bag">Bag (0)</a></header>
  {sections.map((section,index)=><section id={section.type==="text"?"story":index===0?"home":undefined} className={`public-section public-${section.type}`} key={section.id??index}>{section.type==="hero"&&<span className="public-kicker">WELCOME TO {store.name.toUpperCase()}</span>}{section.type==="text"&&<span className="public-kicker">A LITTLE ABOUT US</span>}{section.type==="featured"&&<span className="public-kicker">CURATED FOR YOU</span>}<h1>{section.title}</h1><p>{section.body}</p>{section.button&&<a href={section.type==="featured"?"#products":"#products"}>{section.button} ↗</a>}{section.type==="featured"&&<div className="public-featured">{visibleProducts.slice(0,3).map(product=><article key={product.id}>{product.imageUrl?<Image unoptimized width={600} height={750} src={product.imageUrl} alt={product.title}/>:<div className="public-product-placeholder"/>}<h3>{product.title}</h3><span>₦{Number(product.price).toLocaleString("en-NG",{minimumFractionDigits:2})}</span></article>)}</div>}</section>)}
  <section className="public-products" id="products"><span className="public-kicker">THE COLLECTION</span><h2>Made for your everyday.</h2>{visibleProducts.length?<StorefrontShop storeSlug={store.slug} currency={store.currency??"NGN"} products={visibleProducts.map(product=>({id:product.id,title:product.title,description:product.description,price:product.price,inventory_quantity:product.inventory_quantity,imageUrl:product.imageUrl,variants:product.variants}))}/>:<p className="public-empty">New pieces are on their way. Check back soon.</p>}</section>
  <footer className="public-store-footer">{store.name} <span>Made with Market Nest</span></footer></main>;
}
