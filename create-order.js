import { getInventoryMap } from '../lib/inventory.js';
import { verifyCart, validateCustomer, newOrderId, newAccessToken } from '../lib/order.js';
import { getUspsGroundAdvantageQuote } from '../lib/usps.js';
import { saveOrder, getOrderByClientRequestId, expireOrderIfNeeded } from '../lib/db.js';

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});

  try{
    const clientRequestId=String(req.body?.clientRequestId||'').trim().slice(0,100);
    if(!clientRequestId) return res.status(400).json({error:'Missing checkout request ID.'});

    const existingRaw=await getOrderByClientRequestId(clientRequestId);
    const existing=await expireOrderIfNeeded(existingRaw);
    if(existing){
      if(existing.status==='Expired'){
        return res.status(409).json({error:'This checkout attempt expired. Please submit the order again.',code:'ORDER_EXPIRED'});
      }
      return res.status(200).json({
        orderId:existing.id,
        orderAccessToken:existing.accessToken,
        totalCents:existing.totalCents,
        shippingCents:existing.shippingCents,
        shippingService:existing.shippingService,
        duplicateProtected:true
      });
    }

    const customer=validateCustomer(req.body.customer||{});
    const {items,subtotalCents,weightOz}=verifyCart(req.body.cart);

    const inventoryMap=await getInventoryMap();
    for(const item of items){
      const inv=inventoryMap[item.id];
      if(inv){
        if(!inv.isActive) return res.status(409).json({error:`${item.name} is out of stock.`});
        if(inv.quantity!==null && inv.quantity<item.qty){
          return res.status(409).json({error:`Only ${inv.quantity} of ${item.name} available.`});
        }
      }
    }

    const q=await getUspsGroundAdvantageQuote({
      destinationZip:customer.zip,
      weightOz
    });

    const now=Date.now();
    const order={
      id:newOrderId(),
      accessToken:newAccessToken(),
      clientRequestId,
      createdAt:new Date(now).toISOString(),
      expiresAt:new Date(now + 2*60*60*1000).toISOString(),
      status:'Awaiting Payment',
      customer,
      shipping:{
        name:`${customer.firstName} ${customer.lastName}`,
        street:customer.street,
        city:customer.city,
        state:customer.state,
        zip:customer.zip
      },
      items,
      subtotalCents,
      shippingCents:q.priceCents,
      totalCents:subtotalCents+q.priceCents,
      shippingService:q.service,
      shippingWeightOz:weightOz,
      trackingNumber:null,
      shippedAt:null,
      paymentProvider:null,
      paymentId:null,
      paymentStatus:null,
      paymentUrl:null,
      paymentJson:null
    };

    await saveOrder(order);

    res.status(201).json({
      orderId:order.id,
      orderAccessToken:order.accessToken,
      totalCents:order.totalCents,
      shippingCents:order.shippingCents,
      shippingService:order.shippingService
    });
  }catch(e){
    res.status(400).json({error:e.message});
  }
}
