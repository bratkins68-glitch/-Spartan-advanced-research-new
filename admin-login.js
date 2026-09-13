import crypto from 'crypto';
import { makeAdminCookie } from '../lib/admin-auth.js';

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const expected=String(process.env.ADMIN_PASSWORD||'');
  const supplied=String(req.body?.password||'');
  if(!expected) return res.status(500).json({error:'Admin password is not configured.'});
  const a=Buffer.from(expected), b=Buffer.from(supplied);
  const ok=a.length===b.length && crypto.timingSafeEqual(a,b);
  if(!ok) return res.status(401).json({error:'Incorrect password'});
  res.setHeader('Set-Cookie',makeAdminCookie());
  res.status(200).json({ok:true});
}
