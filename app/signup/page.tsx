"use client";
import "../auth.css";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [name,setName] = useState(""); const [email,setEmail] = useState(""); const [password,setPassword] = useState("");
  const [error,setError] = useState(""); const [message,setMessage] = useState(""); const [loading,setLoading] = useState(false);
  async function handleSubmit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage(""); setLoading(true);
    const {data,error:signupError}=await createClient().auth.signUp({email,password,options:{data:{full_name:name},emailRedirectTo:`${window.location.origin}/dashboard`}});
    setLoading(false);
    if(signupError) return setError(signupError.message);
    if(data.session){router.push("/dashboard");router.refresh();}
    else setMessage("Check your email for the confirmation link. Once confirmed, sign in and create your store.");
  }
  return <main className="auth-shell"><Link className="auth-brand" href="/">market<span>nest</span></Link><section className="auth-card"><span className="auth-eyebrow">YOUR NEXT CHAPTER</span><h1>Let's make it yours.</h1><p>Create your account and start building your online store.</p><form onSubmit={handleSubmit}><label htmlFor="name">Your name</label><input id="name" autoComplete="name" required value={name} onChange={e=>setName(e.target.value)}/><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/><label htmlFor="password">Create a password</label><input id="password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)}/>{error && <p className="auth-error" role="alert">{error}</p>}{message && <p className="auth-success" role="status">{message}</p>}<button disabled={loading}>{loading?"Creating account…":"Create account"} <ArrowRight size={16}/></button></form><div className="auth-foot">Already have an account? <Link href="/login">Sign in</Link></div></section><p className="auth-note">A little space for your big ideas.</p></main>;
}
