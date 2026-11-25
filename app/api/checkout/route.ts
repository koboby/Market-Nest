import {NextResponse} from "next/server";
import {createAdminClient} from "@/lib/supabase/admin";
import {isRecord} from "@/lib/validation";

export const runtime="nodejs";
type CartLine={productId:string;variantId?:string;quantity:number};
type ProductRow={id:string;title:string;price:number|string;inventory_quantity:number;sku:string|null;images:unknown;status:string};
type VariantRow={id:string;product_id:string;title:string;price:number|string;inventory_quantity:number;sku:string|null;is_active:boolean};
type PaystackInitResponse={status?:boolean;message?:string;data?:{authorization_url?:string}};

export async function POST(request:Request){
 const secret=process.env.PAYSTACK_SECRET_KEY;
 if(!secret)return NextResponse.json({error:"Online checkout is not configured yet. Please contact the store."},{status:503});
 let rawBody:unknown;try{rawBody=await request.json();}catch{return NextResponse.json({error:"Invalid checkout request."},{status:400});}
 if(!isRecord(rawBody))return NextResponse.json({error:"Invalid checkout request."},{status:400});
 const {storeSlug,email,name,phone,address,items}=rawBody;
 if(typeof storeSlug!=="string"||typeof email!=="string"||!email.includes("@")||typeof name!=="string"||name.trim().length<2||!Array.isArray(items)||items.length<1||items.length>20)return NextResponse.json({error:"Please provide your contact details and at least one product."},{status:400});
 const lines:CartLine[]=items.map((rawItem:unknown)=>{
  if(!isRecord(rawItem))return {productId:"",quantity:0};
  return {productId:typeof rawItem.productId==="string"?rawItem.productId:"",variantId:typeof rawItem.variantId==="string"?rawItem.variantId:undefined,quantity:Number(rawItem.quantity)};
 });
 if(lines.some(line=>! /^[0-9a-f-]{36}$/i.test(line.productId)||(line.variantId&&!/^[0-9a-f-]{36}$/i.test(line.variantId))||!Number.isInteger(line.quantity)||line.quantity<1||line.quantity>20))return NextResponse.json({error:"One or more cart quantities are invalid."},{status:400});
 const quantities=new Map<string,CartLine>();for(const line of lines){const key=`${line.productId}:${line.variantId??"base"}`;const existing=quantities.get(key);quantities.set(key,{...line,quantity:(existing?.quantity??0)+line.quantity});}
 const admin=createAdminClient();
 const {data:store}=await admin.from("stores").select("id,name,slug,currency,status").eq("slug",storeSlug).eq("status","published").maybeSingle();
 if(!store)return NextResponse.json({error:"This store is not available for checkout."},{status:404});
 const productIds=Array.from(new Set(lines.map(line=>line.productId)));
 const {data:productData,error:productError}=await admin.from("products").select("id,title,price,inventory_quantity,sku,images,status").eq("store_id",store.id).in("id",productIds).eq("status","active");
 const products:ProductRow[]=productData??[];
 if(productError||products.length!==productIds.length)return NextResponse.json({error:"A product in your cart is no longer available."},{status:409});
 const variantIds=Array.from(new Set(lines.map(line=>line.variantId).filter((value):value is string=>!!value)));
 let variants:VariantRow[]=[];
 if(variantIds.length){
  const {data:variantData,error:variantError}=await admin.from("product_variants").select("id,product_id,title,price,inventory_quantity,sku,is_active").eq("store_id",store.id).in("id",variantIds);
  variants=variantData??[];
  if(variantError||variants.length!==variantIds.length)return NextResponse.json({error:"A selected product option is no longer available."},{status:409});
 }
 let subtotal=0;
 for(const line of quantities.values()){
  const product=products.find(item=>item.id===line.productId);
  if(!product)return NextResponse.json({error:"A product in your cart is no longer available."},{status:409});
  const variant=line.variantId?variants.find(item=>item.id===line.variantId):undefined;
  if(line.variantId&&(!variant||variant.product_id!==product.id||!variant.is_active))return NextResponse.json({error:"A selected product option is no longer available."},{status:409});
  const stock=variant?variant.inventory_quantity:product.inventory_quantity;
  if(stock<line.quantity)return NextResponse.json({error:`${product.title} does not have enough stock available.`},{status:409});
  subtotal+=Number(variant?.price??product.price)*line.quantity;
 }
 if(!Number.isFinite(subtotal)||subtotal<=0)return NextResponse.json({error:"The order total is invalid."},{status:400});
 const customerEmail=email.trim().toLowerCase();
 const {data:customer,error:customerError}=await admin.from("customers").upsert({store_id:store.id,email:customerEmail,full_name:name.trim(),phone:typeof phone==="string"?phone.trim():null},{onConflict:"store_id,email"}).select("id").single();
 if(customerError||!customer)return NextResponse.json({error:"Could not create customer details. Please try again."},{status:500});
 const reference=`MN-${Date.now()}-${crypto.randomUUID().slice(0,8)}`;
 const shippingAddress=isRecord(address)?address:{};
 const {data:order,error:orderError}=await admin.from("orders").insert({store_id:store.id,customer_id:customer.id,email:customerEmail,customer_name:name.trim(),phone:typeof phone==="string"?phone.trim():null,shipping_address:shippingAddress,currency:store.currency||"NGN",subtotal,total:subtotal,payment_provider:"paystack",payment_reference:reference,payment_status:"pending"}).select("id").single();
 if(orderError||!order)return NextResponse.json({error:"Could not create your order. Please try again."},{status:500});
 const orderItems=Array.from(quantities.values()).map(line=>{
  const product=products.find(item=>item.id===line.productId)!;
  const variant=line.variantId?variants.find(item=>item.id===line.variantId):undefined;
  const images=Array.isArray(product.images)?product.images as Array<{path?:string}>:[];
  const unitPrice=Number(variant?.price??product.price);
  return {order_id:order.id,product_id:product.id,variant_id:variant?.id??null,product_title:product.title,variant_title:variant?.title??null,sku:variant?.sku??product.sku,quantity:line.quantity,unit_price:unitPrice,line_total:unitPrice*line.quantity,image_path:images.find(item=>item.path)?.path??null};
 });
 const {error:itemError}=await admin.from("order_items").insert(orderItems);
 if(itemError){await admin.from("orders").delete().eq("id",order.id);return NextResponse.json({error:"Could not prepare your order."},{status:500});}
 const origin=new URL(request.url).origin;
 let result:PaystackInitResponse;
 try{
  const paystack=await fetch("https://api.paystack.co/transaction/initialize",{method:"POST",headers:{"Authorization":`Bearer ${secret}`,"Content-Type":"application/json"},body:JSON.stringify({email:customerEmail,amount:Math.round(subtotal*100),currency:store.currency||"NGN",reference,callback_url:`${origin}/s/${store.slug}/order-confirmation?reference=${encodeURIComponent(reference)}`,metadata:{order_id:order.id,store_id:store.id,store_slug:store.slug,customer_name:name.trim()}})});
  result=await paystack.json() as PaystackInitResponse;
  if(!paystack.ok||!result.status||!result.data?.authorization_url)throw new Error(result.message||"Payment could not be started.");
 }catch(error){
  await admin.from("orders").delete().eq("id",order.id);
  return NextResponse.json({error:error instanceof Error?error.message:"Payment could not be started. Please try again."},{status:502});
 }
 return NextResponse.json({authorizationUrl:result.data.authorization_url});
}
