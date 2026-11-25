import "../auth.css";
"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    const { error: signInError } = await createClient().auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) return setError(signInError.message);
    router.push("/dashboard"); router.refresh();
  }
  return <main className="auth-shell"><Link className="auth-brand" href="/">market<span>nest</span></Link><section className="auth-card"><span className="auth-eyebrow">WELCOME BACK</span><h1>Your store is waiting.</h1><p>Sign in to pick up right where you left off.</p><form onSubmit={handleSubmit}><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/><label htmlFor="password">Password</label><input id="password" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/>{error && <p className="auth-error" role="alert">{error}</p>}<button disabled={loading}>{loading?"Signing in…":"Sign in"} <ArrowRight size={16}/></button></form><div className="auth-foot">New to Market Nest? <Link href="/signup">Create an account</Link></div></section><p className="auth-note">A little space for your big ideas.</p></main>;
}
