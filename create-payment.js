import crypto from 'crypto';
import { getOrder, patchOrder, expireOrderIfNeeded } from '../lib/db.js';

function sameToken(a,b){
  try{
    const aa=Buffer.from(String(a||'')), bb=Buffer.from(String(b||''));
    return aa.length===bb.length && aa.length>0 && crypto.timingSafeEqual(aa,bb);
  }catch{return false}
}

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try{
    let order=await getOrder(String(req.body.orderId||''));
    order=await expireOrderIfNeeded(order);
    if(!order) return res.status(404).json({error:'Order not found'});
    if(!sameToken(order.accessToken,req.body.accessToken)) return res.status(403).json({error:'Order access denied'});
    if(order.status==='Expired') return res.status(409).json({error:'This unpaid order has expired. Please return to the catalog and create a new order.'});
    if(['Cancelled','Payment Failed','Refunded'].includes(order.status)) return res.status(409).json({error:`This order is ${order.status}.`});
    if(['Paid','Processing','Shipped'].includes(order.status)) return res.status(409).json({error:'Payment has already been received for this order.'});
    if(order.paymentUrl) return res.status(200).json({paymentUrl:order.paymentUrl,reused:true});
    if(!process.env.NOWPAYMENTS_API_KEY) throw new Error('NOWPayments API key is not configured.');

    const base=process.env.NOWPAYMENTS_API_BASE||'https://api.nowpayments.io/v1';
    const site=(process.env.SITE_URL||'').replace(/\/$/,'');
    const returnUrl=`${site}/confirmation.html?order=${encodeURIComponent(order.id)}&token=${encodeURIComponent(order.accessToken)}`;

    const payload={
      price_amount:(order.totalCents/100).toFixed(2),
      price_currency:'usd',
      order_id:order.id,
      order_description:`Spartan Advanced Research order ${order.id}`,
      ipn_callback_url:`${site}/api/nowpayments-ipn`,
      success_url:returnUrl,
      cancel_url:returnUrl,
      is_fixed_rate:true,
      is_fee_paid_by_user:true
    };

    const r=await fetch(`${base}/invoice`,{
      method:'POST',
      headers:{
        'x-api-key':process.env.NOWPAYMENTS_API_KEY,
        'content-type':'application/json'
      },
      body:JSON.stringify(payload)
    });

    const data=await r.json();
    if(!r.ok) throw new Error(data.message||`NOWPayments error ${r.status}`);

    const paymentUrl=data.invoice_url||data.payment_url;
    if(!paymentUrl) throw new Error('NOWPayments did not return a payment URL.');

    await patchOrder(order.id,{
      paymentProvider:'NOWPayments',
      paymentId:String(data.id||data.invoice_id||''),
      paymentStatus:'waiting',
      paymentUrl,
      paymentJson:data
    });

    res.status(200).json({paymentUrl});
  }catch(e){
    res.status(400).json({error:e.message});
  }
}
