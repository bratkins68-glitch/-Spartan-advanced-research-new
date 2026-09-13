import { sendShippingEmail } from '../lib/email.js';
import { isAdmin } from '../lib/admin-auth.js';
import { getOrder, patchOrder, addStatusHistory } from '../lib/db.js';

const ALLOWED=['Awaiting Payment','Paid','Processing','Shipped','Cancelled','Expired','Payment Failed','Refunded','Partially Paid'];

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  if(!isAdmin(req)) return res.status(401).json({error:'Unauthorized'});

  const id=String(req.body?.orderId||'');
  const status=String(req.body?.status||'');
  const note=String(req.body?.note||'').trim().slice(0,500);
  const trackingNumber=String(req.body?.trackingNumber||'').trim().slice(0,80);

  if(!ALLOWED.includes(status)) return res.status(400).json({error:'Invalid status'});

  const order=await getOrder(id);
  if(!order) return res.status(404).json({error:'Order not found'});

  const patch={
    status,
    trackingNumber:trackingNumber||order.trackingNumber||null
  };

  if(status==='Shipped' && !order.shippedAt){
    patch.shippedAt=new Date().toISOString();
  }

  const updated=await patchOrder(id,patch);
  await addStatusHistory(id,status,'admin',note || (trackingNumber?`Tracking ${trackingNumber}`:''));

  const becameShipped = status==='Shipped' && order.status!=='Shipped';
  if(becameShipped){
    try{ await sendShippingEmail(updated); }catch(e){ console.error('Shipping email failed:',e); }
  }

  res.status(200).json({order:updated});
}
