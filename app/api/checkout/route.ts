import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
type CartLine={productId:string;quantity:number};
export async function POST(request:Request){
 const secret=process.env.PAYSTACK_SECRET_KEY;
 if(!secret)return NextResponse.json({error:"Online checkout is not configured yet. Please contact the store."},{status:503});
 let body:any;try{body=await request.json();}catch{return NextResponse.json({error:"Invalid checkout request."},{status:400});}
 const {storeSlug,email,name,phone,address,items}=body??{};
 if(typeof storeSlug!=="string"||typeof email!=="string"||!email.includes("@")||typeof name!=="string"||name.trim().length<2||!Array.isArray(items)||items.length<1||items.length>20)return NextResponse.json({error:"Please provide your contact details and at least one product."},{status:400});
 const lines:CartLine[]=items.map((item:any)=>({productId:String(item.productId),quantity:Number(item.quantity)}));
 if(lines.some(line=>! /^[0-9a-f-]{36}$/i.test(line.productId)||!Number.isInteger(line.quantity)||line.quantity<1||line.quantity>20))return NextResponse.json({error:"One or more cart quantities are invalid."},{status:400});
 const quantities=new Map<string,number>();for(const line of lines)quantities.set(line.productId,(quantities.get(line.productId)??0)+line.quantity);
 const admin=createAdminClient();
 const {data:store}=await admin.from("stores").select("id,name,slug,currency,status").eq("slug",storeSlug).eq("status","published").maybeSingle();
 if(!store)return NextResponse.json({error:"This store is not available for checkout."},{status:404});
 const {data:products,error:productError}=await admin.from("products").select("id,title,price,inventory_quantity,sku,images,status").eq("store_id",store.id).in("id",Array.from(quantities.keys())).eq("status","active");
 if(productError||!products||products.length!==quantities.size)return NextResponse.json({error:"A product in your cart is no longer available."},{status:409});
 let subtotal=0;for(const product of products){const quantity=quantities.get(product.id)!;if(product.inventory_quantity<quantity)return NextResponse.json({error:`${product.title} does not have enough stock available.`},{status:409});subtotal+=Number(product.price)*quantity;}
 if(!Number.isFinite(subtotal)||subtotal<=0)return NextResponse.json({error:"The order total is invalid."},{status:400});
 const customerEmail=email.trim().toLowerCase();
 const {data:customer,error:customerError}=await admin.from("customers").upsert({store_id:store.id,email:customerEmail,full_name:name.trim(),phone:typeof phone==="string"?phone.trim():null},{onConflict:"store_id,email"}).select("id").single();
 if(customerError||!customer)return NextResponse.json({error:"Could not create customer details. Please try again."},{status:500});
 const reference=`MN-${Date.now()}-${crypto.randomUUID().slice(0,8)}`;
 const {data:order,error:orderError}=await admin.from("orders").insert({store_id:store.id,customer_id:customer.id,email:customerEmail,customer_name:name.trim(),phone:typeof phone==="string"?phone.trim():null,shipping_address:address&&typeof address==="object"?address:{},currency:store.currency||"NGN",subtotal,total:subtotal,payment_provider:"paystack",payment_reference:reference,payment_status:"pending"}).select("id").single();
 if(orderError||!order)return NextResponse.json({error:"Could not create your order. Please try again."},{status:500});
 const orderItems=products.map(product=>{const quantity=quantities.get(product.id)!;const images=Array.isArray(product.images)?product.images as Array<{path?:string}>:[];return {order_id:order.id,product_id:product.id,product_title:product.title,sku:product.sku,quantity,unit_price:product.price,line_total:Number(product.price)*quantity,image_path:images.find(item=>item.path)?.path??null};});
 const {error:itemError}=await admin.from("order_items").insert(orderItems);
 if(itemError){await admin.from("orders").delete().eq("id",order.id);return NextResponse.json({error:"Could not prepare your order."},{status:500});}
 const origin=new URL(request.url).origin;
 const paystack=await fetch("https://api.paystack.co/transaction/initialize",{method:"POST",headers:{"Authorization":`Bearer ${secret}`,"Content-Type":"application/json"},body:JSON.stringify({email:customerEmail,amount:Math.round(subtotal*100),currency:store.currency||"NGN",reference,callback_url:`${origin}/s/${store.slug}/order-confirmation?reference=${encodeURIComponent(reference)}`,metadata:{order_id:order.id,store_id:store.id,store_slug:store.slug,customer_name:name.trim()}})});
 const result=await paystack.json();
 if(!paystack.ok||!result.status||!result.data?.authorization_url){await admin.from("orders").delete().eq("id",order.id);return NextResponse.json({error:result.message||"Payment could not be started. Please try again."},{status:502});}
 return NextResponse.json({authorizationUrl:result.data.authorization_url});
}
