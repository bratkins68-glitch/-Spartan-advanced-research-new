import { isAdmin } from '../lib/admin-auth.js';
import { listOrders } from '../lib/db.js';

export default async function handler(req,res){
  if(!isAdmin(req)) return res.status(401).json({error:'Unauthorized'});
  const orders=await listOrders(200);
  res.status(200).json({orders});
}
