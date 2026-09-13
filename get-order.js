import crypto from 'crypto';
import { getOrder, expireOrderIfNeeded } from '../lib/db.js';

function sameToken(a,b){
  try{
    const aa=Buffer.from(String(a||'')), bb=Buffer.from(String(b||''));
    return aa.length===bb.length && aa.length>0 && crypto.timingSafeEqual(aa,bb);
  }catch{return false}
}

export default async function handler(req,res){
  const id=String(req.query.id||'');
  const token=String(req.query.token||'');
  let order=await getOrder(id);
  order=await expireOrderIfNeeded(order);
  if(!order) return res.status(404).json({error:'Order not found'});
  if(!sameToken(order.accessToken,token)) return res.status(403).json({error:'Order access denied'});
  res.status(200).json(order);
}
