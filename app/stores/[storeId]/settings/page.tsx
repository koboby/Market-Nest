"use client";
import "./settings.css";
import Link from "next/link";
import {useEffect,useState, type FormEvent} from "react";
import {useParams} from "next/navigation";
import {createClient} from "@/lib/supabase/client";
import {ArrowLeft,Save,Settings2} from "lucide-react";
export default function StoreSettingsPage(){
 const {storeId}=useParams<{storeId:string}>();const [name,setName]=useState("");const [description,setDescription]=useState("");const [timezone,setTimezone]=useState("Africa/Lagos");const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(false);const [message,setMessage]=useState("");
 useEffect(()=>{let live=true;(async()=>{const supabase=createClient();const {data}=await supabase.from("stores").select("name,description,timezone").eq("id",storeId).maybeSingle();if(live&&data){setName(data.name);setDescription(data.description??"");setTimezone(data.timezone??"Africa/Lagos");}if(live)setLoading(false);})();return()=>{live=false};},[storeId]);
 async function save(e:FormEvent){e.preventDefault();setSaving(true);setMessage("");const supabase=createClient();const {error}=await supabase.from("stores").update({name:name.trim(),description:description.trim()||null,timezone}).eq("id",storeId);setSaving(false);setMessage(error?error.message:"Store settings saved.");}
 return <main className="store-settings-shell"><header><Link href={`/stores/${storeId}`}><ArrowLeft size={16}/> Back to workspace</Link><span>STORE PREFERENCES</span></header><section><span className="settings-icon"><Settings2 size={22}/></span><small>YOUR STORE</small><h1>Settings.</h1><p>Keep your store details accurate and up to date.</p><form onSubmit={save}><label>Store name<input required maxLength={80} value={name} onChange={e=>setName(e.target.value)}/></label><label>Store description<textarea rows={4} maxLength={500} value={description} onChange={e=>setDescription(e.target.value)}/></label><label>Store timezone<select value={timezone} onChange={e=>setTimezone(e.target.value)}><option value="Africa/Lagos">West Africa Time (Lagos)</option><option value="UTC">UTC</option><option value="Europe/London">London</option><option value="America/New_York">New York</option></select></label>{message&&<p role="status">{message}</p>}<button disabled={loading||saving}><Save size={15}/>{saving?"Saving…":"Save settings"}</button></form></section></main>;
}
