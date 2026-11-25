import "./media.css";
import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {ArrowLeft,Image as ImageIcon} from "lucide-react";
import {createClient} from "@/lib/supabase/server";
export default async function MediaPage({params}:{params:Promise<{storeId:string}>}){
 const {storeId}=await params;const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:store}=await supabase.from("stores").select("id,name").eq("id",storeId).maybeSingle();if(!store)notFound();
 const {data:objects}=await supabase.storage.from("store-media").list(storeId,{limit:100,sortBy:{column:"created_at",order:"desc"}});
 const media=await Promise.all((objects??[]).filter(file=>file.name&&!file.name.startsWith(".")).map(async file=>{const path=`${storeId}/${file.name}`;const {data}=await supabase.storage.from("store-media").createSignedUrl(path,1800);return {name:file.name,path,url:data?.signedUrl??null,size:file.metadata?.size??0};}));
 return <main className="media-shell"><header><Link href={`/stores/${storeId}`}><ArrowLeft size={16}/> {store.name}</Link><span>STORE MEDIA</span></header><section><ImageIcon size={25}/><small>YOUR IMAGE LIBRARY</small><h1>Media library.</h1><p>All stored product and storefront images are WebP and strictly below 100 KB.</p><b>{media.length} files · 99,999 bytes maximum per image</b></section><div className="media-grid">{media.map(file=><article key={file.path}>{file.url?<img src={file.url} alt={file.name}/>:<div/>}<b>{file.name}</b><small>{(Number(file.size)/1024).toFixed(1)} KB</small></article>)}</div>{!media.length&&<p className="media-empty">Your compressed images will appear here when you add products.</p>}</main>;
}
