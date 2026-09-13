import { getInventory } from '../lib/inventory.js';

export default async function handler(req,res){
  const inventory = await getInventory();
  res.status(200).json({inventory});
}
