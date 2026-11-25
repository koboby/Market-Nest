"use client";

import "./new-product.css";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, Package, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadStoreImage } from "@/lib/images/upload-store-image";

function makeSlug(value:string){return value.toLowerCase().trim().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");}

export default function NewProductPage(){
  const {storeId}=useParams<{storeId:string}>(); const router=useRouter();
  const [title,setTitle]=useState("");const [price,setPrice]=useState("");const [description,setDescription]=useState("");const [inventory,setInventory]=useState("0");
  const [collections,setCollections]=useState<Array<{id:string;title:string}>>([]);const [collectionId,setCollectionId]=useState("");
  const [image,setImage]=useState<File|null>(null);const [imageSize,setImageSize]=useState<number|null>(null);const [publish,setPublish]=useState(false);const [error,setError]=useState("");const [loading,setLoading]=useState(false);
  useEffect(()=>{let live=true;(async()=>{const supabase=createClient();const {data}=await supabase.from("collections").select("id,title").eq("store_id",storeId).order("title");if(live)setCollections(data??[]);})();return()=>{live=false};},[storeId]);
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setError("");setLoading(true);const supabase=createClient();
    const {data:{user}}=await supabase.auth.getUser();if(!user){setLoading(false);router.push("/login");return;}
    const {data:store}=await supabase.from("stores").select("id").eq("id",storeId).maybeSingle();
    if(!store){setLoading(false);setError("You don't have access to this store.");return;}
    let imagePath:string|null=null;
    try{
      if(image){const uploaded=await uploadStoreImage(supabase,storeId,image);imagePath=uploaded.path;setImageSize(uploaded.size);}
      const {error:insertError}=await supabase.from("products").insert({
        store_id:storeId,collection_id:collectionId||null,title:title.trim(),slug:makeSlug(title),description:description.trim()||null,
        price:Number(price),inventory_quantity:Number(inventory),status:publish?"active":"draft",images:imagePath?[{path:imagePath}]:[],
      });
      if(insertError){if(imagePath) await supabase.storage.from("store-media").remove([imagePath]);throw new Error(insertError.message);}
      router.push(`/stores/${storeId}/products`);router.refresh();
    }catch(err){setError(err instanceof Error?err.message:"Could not save this product.");setLoading(false);}
  }
  return <main className="new-product-shell"><header><Link href={`/stores/${storeId}/products`}><ArrowLeft size={16}/> Back to products</Link><span>PRODUCT CATALOGUE</span></header><section className="new-product-heading"><span className="new-product-icon"><Package size={23}/></span><span className="new-product-eyebrow">ADD SOMETHING NEW</span><h1>Create a product.</h1><p>Add the details customers need to discover and buy your product.</p></section><form className="new-product-form" onSubmit={submit}><div className="new-product-main"><section className="new-product-panel"><h2>Product details</h2><label htmlFor="title">Product name</label><input id="title" required maxLength={120} value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Everyday Linen Shirt"/><label htmlFor="collection">Collection (optional)</label><select id="collection" value={collectionId} onChange={e=>setCollectionId(e.target.value)}><option value="">No collection</option>{collections.map(collection=><option key={collection.id} value={collection.id}>{collection.title}</option>)}</select><label htmlFor="description">Description</label><textarea id="description" rows={5} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Describe what makes this product special…"/></section><section className="new-product-panel"><h2>Media</h2><label className="product-upload" htmlFor="product-image"><ImagePlus size={24}/><b>{image?image.name:"Add a product image"}</b><span>{image?"Ready to compress and upload":"JPG, PNG or WebP · automatically compressed below 100 KB"}</span><input id="product-image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e=>setImage(e.target.files?.[0]??null)}/></label>{imageSize!==null&&<p className="product-image-size">Compressed image: {(imageSize/1024).toFixed(1)} KB</p>}</section></div><aside className="new-product-side"><section className="new-product-panel"><h2>Pricing</h2><label htmlFor="price">Price (NGN ₦)</label><input id="price" type="number" min="0" step="0.01" required value={price} onChange={e=>setPrice(e.target.value)} placeholder="0.00"/></section><section className="new-product-panel"><h2>Inventory</h2><label htmlFor="inventory">Available quantity</label><input id="inventory" type="number" min="0" step="1" required value={inventory} onChange={e=>setInventory(e.target.value)}/></section><section className="new-product-panel"><h2>Publishing</h2><label className="product-publish-toggle"><input type="checkbox" checked={publish} onChange={e=>setPublish(e.target.checked)}/> Publish this product now</label><p className="product-draft-note">Keep this off to save a draft. Only active products appear on your published storefront.</p></section></aside><div className="new-product-actions">{error&&<p role="alert">{error}</p>}<button disabled={loading}>{loading?<><Upload size={15}/> Saving…</>:"Save product"}</button></div></form></main>;
}
