import { isAdmin } from '../lib/admin-auth.js';
import { getInventory } from '../lib/inventory.js';

export default async function handler(req,res){
  if(!isAdmin(req)) return res.status(401).json({error:'Unauthorized'});
  const inventory = await getInventory();
  res.status(200).json({inventory});
}
