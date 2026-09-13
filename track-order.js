import { getOrder, expireOrderIfNeeded } from '../lib/db.js';

export default async function handler(req,res){
  const id=String(req.query.order||'').trim();
  const email=String(req.query.email||'').trim().toLowerCase();

  let order=await getOrder(id);
  order=await expireOrderIfNeeded(order);

  if(!order || String(order.customer?.email||'').trim().toLowerCase()!==email){
    return res.status(404).json({error:'Order not found. Check the order number and email address.'});
  }

  res.status(200).json({
    orderId:order.id,
    createdAt:order.createdAt,
    status:order.status,
    trackingNumber:order.trackingNumber||null,
    shippedAt:order.shippedAt||null,
    shippingService:order.shippingService||'USPS',
    items:(order.items||[]).map(i=>({name:i.name,strength:i.strength,qty:i.qty}))
  });
}
