import crypto from 'crypto';
import { getOrder, expireOrderIfNeeded } from '../lib/db.js';
import { buildInvoicePdf } from '../lib/invoice.js';
import { isAdmin } from '../lib/admin-auth.js';

function sameToken(a,b){
  try{
    const aa=Buffer.from(String(a||'')), bb=Buffer.from(String(b||''));
    return aa.length===bb.length && aa.length>0 && crypto.timingSafeEqual(aa,bb);
  }catch{return false}
}

export default async function handler(req,res){
  try{
    let order=await getOrder(String(req.query.order||''));
    order=await expireOrderIfNeeded(order);
    if(!order) return res.status(404).send('Order not found');

    const admin=isAdmin(req);
    const token=String(req.query.token||'');
    if(!admin && !sameToken(order.accessToken,token)) return res.status(403).send('Order access denied');

    const pdf=await buildInvoicePdf(order);
    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition',`inline; filename="${order.id}.pdf"`);
    res.status(200).send(pdf);
  }catch(e){
    res.status(500).send('Could not create invoice');
  }
}
