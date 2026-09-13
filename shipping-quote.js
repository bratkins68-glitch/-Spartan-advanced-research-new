import { verifyCart, validateCustomer } from '../lib/order.js';
import { getUspsGroundAdvantageQuote } from '../lib/usps.js';

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const customer=validateCustomer(req.body.customer||{});
    const {weightOz}=verifyCart(req.body.cart);
    const quote=await getUspsGroundAdvantageQuote({destinationZip:customer.zip,weightOz});
    res.status(200).json({service:quote.service,shippingCents:quote.priceCents,weightOz:quote.weightOz});
  }catch(e){ res.status(400).json({error:e.message}); }
}
