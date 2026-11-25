import "./editor.css";
import { notFound,redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StoreEditor from "./store-editor";

type Section={id:string;type:"hero"|"text"|"featured";title:string;body:string;button:string};
type Theme={accent:string;background:string};
const defaultSections:Section[]=[
 {id:"hero-main",type:"hero",title:"A little more you.",body:"Discover thoughtful pieces made for everyday living.",button:"Explore the collection"},
 {id:"intro",type:"text",title:"Made with intention.",body:"Tell your customers what makes your brand special. Share your story and the details that matter.",button:""},
 {id:"featured",type:"featured",title:"A few favourites.",body:"Showcase the products your customers will love.",button:"Shop all"},
];

export default async function EditorPage({params}:{params:Promise<{storeId:string}>}){
 const {storeId}=await params;const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:store}=await supabase.from("stores").select("id,name,slug").eq("id",storeId).maybeSingle();if(!store)notFound();
 const {data:page}=await supabase.from("store_pages").select("content,is_published").eq("store_id",storeId).eq("slug","home").maybeSingle();
 const content=page?.content as {sections?:Section[];theme?:Theme}|null;
 return <StoreEditor storeId={storeId} storeName={store.name} initialSections={content?.sections?.length?content.sections:defaultSections} initialTheme={content?.theme??{accent:"#365c43",background:"#f7f6f0"}} initialPublished={page?.is_published??false}/>;
}
