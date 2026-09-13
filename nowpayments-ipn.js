import { deductInventoryAfterPayment } from '../lib/inventory.js';
import crypto from 'crypto';
import { getOrder, patchOrder, recordWebhook } from '../lib/db.js';
import { sendOrderEmail } from '../lib/email.js';

function sortObject(obj){
  if(Array.isArray(obj)) return obj.map(sortObject);
  if(obj&&typeof obj==='object') return Object.keys(obj).sort().reduce((a,k)=>(a[k]=sortObject(obj[k]),a),{});
  return obj;
}
function validSignature(body,sig){
  const secret=process.env.NOWPAYMENTS_IPN_SECRET;
  if(!secret||!sig) return false;
  const digest=crypto.createHmac('sha512',secret).update(JSON.stringify(sortObject(body))).digest('hex');
  try{return crypto.timingSafeEqual(Buffer.from(digest),Buffer.from(String(sig)))}catch{return false}
}
function mapStatus(s){
  const v=String(s||'').toLowerCase();
  if(['finished','confirmed','sending'].includes(v)) return 'Paid';
  if(['failed','expired','refunded'].includes(v)) return v==='refunded'?'Refunded':'Payment Failed';
  if(v==='partially_paid') return 'Partially Paid';
  return 'Awaiting Payment';
}

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).end();
  if(!validSignature(req.body,req.headers['x-nowpayments-sig'])) return res.status(401).json({error:'Invalid signature'});
  const body=req.body;
  const orderId=String(body.order_id||'');
  const paymentId=String(body.payment_id||body.id||'');
  const eventKey=`${paymentId}:${body.payment_status||''}:${body.updated_at||body.actually_paid||''}`;
  if(!(await recordWebhook('NOWPayments',eventKey,body))) return res.status(200).json({ok:true,duplicate:true});
  const order=await getOrder(orderId);
  if(!order) return res.status(404).json({error:'Order not found'});
  const status=mapStatus(body.payment_status);
  const wasPaid = ['Paid','Processing','Shipped'].includes(order.status);
  const updated=await patchOrder(orderId,{
    status,paymentProvider:'NOWPayments',paymentId:paymentId||order.paymentId,
    paymentStatus:body.payment_status||order.paymentStatus,paymentJson:body
  });
  if(status==='Paid' && !wasPaid){
    let paidOrder=updated;
    if(!updated.inventoryDeductedAt){
      await deductInventoryAfterPayment(updated.items||[]);
      paidOrder=await patchOrder(orderId,{inventoryDeductedAt:new Date().toISOString()});
    }
    await sendOrderEmail(paidOrder);
  }
  res.status(200).json({ok:true});
}
