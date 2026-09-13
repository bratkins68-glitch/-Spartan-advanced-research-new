import { isAdmin } from '../lib/admin-auth.js';
import { setInventory } from '../lib/inventory.js';

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  if(!isAdmin(req)) return res.status(401).json({error:'Unauthorized'});

  try{
    const productId = String(req.body?.productId || '');
    const q = req.body?.quantity;
    const quantity = (q === '' || q === null || typeof q === 'undefined') ? null : Number(q);
    const isActive = Boolean(req.body?.isActive);

    const result = await setInventory(productId, quantity, isActive);
    res.status(200).json({inventory:result});
  }catch(e){
    res.status(400).json({error:e.message});
  }
}
