
const $ = s => document.querySelector(s);
let products = [];
let cart = JSON.parse(localStorage.getItem('spartanCart') || '[]');
let activeProductId = null;
const productImages = {
    '5-amino-1mq-10': 'images/5-amino-1mq-10.svg',

  '5-amino-1mq-50': 'images/5-amino-1mq-50.svg',
      'reta-10': '01_Reta_10mg.png',

  'reta-20': '02_Reta_20mg.png',
      'mots-c-20': '03_MOTS-C_20mg.png',

  'mots-c-10': '04_MOTS-C_10mg.png',
      'bpc-157-10': '06_BPC-157_10mg.png',
      'tb-500-10': '07_TB-500_10mg.png',
      'kpv-10': '09_KPV_10mg.png',
    'kpv-5': '10_KPV_5mg.png',
    'klow-80': '11_KLOW_80mg.png',
   'glow-70': '12_GLOW_70mg.png', 
   'tesamorelin-10': '13_Tesamorelin_10mg.png', 
  'mt1-10': '14_MT-1_10mg.png',  
    
    
   'selank-10': 'Selank_10mg.png',

  'semax-10': 'Semax_10mg.png',

  'dsip-10': 'DSIP_10mg.png',

  'ara290-10': 'ARA290_10mg.png',

  'b12-1ml': 'B12_1mL.png',

  'glutathione-1500': 'Glutathione_1500mg.png' 
  
  

};
function money(n){ return `$${Number(n).toFixed(2)}`; }

async function loadProducts(){
  products = await fetch('products.json').then(r=>r.json());
  try{
    const r = await fetch('/api/inventory');
    if(r.ok){
      const j = await r.json();
      const inv = Object.fromEntries((j.inventory||[]).map(x=>[x.productId,x]));
      products = products.map(p=>{
        const i=inv[p.id];
        if(!i) return p;
        return {...p,status:i.isActive && (i.quantity===null || i.quantity>0) ? 'In Stock':'Out of Stock',inventoryQty:i.quantity};
      });
    }
  }catch{}
  renderProducts();
  renderCart();
}
function renderProducts(){
  const q = ($('#searchInput')?.value || '').toLowerCase();
  const filter = $('#stockFilter')?.value || 'all';
  const grid = $('#productGrid');
  if(!grid) return;
  grid.innerHTML = '';
  products.filter(p=>{
    const matches = `${p.name} ${p.strength}`.toLowerCase().includes(q);
    const isIn = p.status === 'In Stock';
    const image = productImages[p.id];
const stockOk = filter === 'all' || (filter === 'in' && isIn) || (filter === 'out' && !isIn);
    return matches && stockOk;
  }).forEach(p=>{
    const isIn = p.status === 'In Stock';
    const card = document.createElement('article');
    card.className='product-card';
    card.tabIndex=0;
    card.setAttribute('role','button');
    card.setAttribute('aria-label',`View details for ${p.name} ${p.strength}`);
    card.dataset.product=p.id;
    card.innerHTML = `

      ${productImages[p.id] ? `<img class="product-image" src="${productImages[p.id]}" alt="${p.name} ${p.strength}">` : ''}

      <h3>${p.name}</h3>
      <div class="strength">${p.strength}</div>
      <p>${p.description}</p>
      <div class="stock ${isIn?'in':'out'}">${p.status}${Number.isInteger(p.inventoryQty)?` · ${p.inventoryQty} available`:''}</div>
      <div class="price">${money(p.price)}</div>
      <div class="card-actions">
        <button class="details-btn" data-details="${p.id}">View Details</button>
        <button class="primary" ${isIn?'':'disabled'} data-add="${p.id}">${isIn?'Add to cart':'Out of stock'}</button>
      </div>
    `;
    grid.appendChild(card);
  });
  document.querySelectorAll('[data-add]').forEach(b=>b.onclick=e=>{e.stopPropagation();addToCart(b.dataset.add)});
  document.querySelectorAll('[data-details]').forEach(b=>b.onclick=e=>{e.stopPropagation();openProductModal(b.dataset.details)});
  document.querySelectorAll('[data-product]').forEach(card=>{
    card.addEventListener('click',e=>{ if(!e.target.closest('button')) openProductModal(card.dataset.product); });
    card.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){e.preventDefault();openProductModal(card.dataset.product)} });
  });
}
function openProductModal(id){
  const p=products.find(x=>x.id===id); if(!p)return;
  activeProductId=id;
  const isIn=p.status==='In Stock';
  $('#modalTitle').textContent=p.name;
  $('#modalStrength').textContent=p.strength;
  $('#modalDescription').textContent=p.description;
  $('#modalStock').textContent=p.status + (Number.isInteger(p.inventoryQty)?` · ${p.inventoryQty} available`:'');
  $('#modalStock').className=`stock ${isIn?'in':'out'}`;
  $('#modalPrice').textContent=money(p.price);
  const add=$('#modalAddToCart'); add.disabled=!isIn; add.textContent=isIn?'Add to Cart':'Out of Stock';
  $('#productModal').classList.add('show');
  $('#productModal').setAttribute('aria-hidden','false');
}
function closeProductModal(){
  $('#productModal')?.classList.remove('show');
  $('#productModal')?.setAttribute('aria-hidden','true');
  activeProductId=null;
}
function addToCart(id){
  const p=products.find(x=>x.id===id); if(!p || p.status!=='In Stock') return;
  const item = cart.find(x=>x.id===id);
  if(item) item.qty += 1; else cart.push({id,qty:1});
  saveCart();
}
function removeFromCart(id){
  cart = cart.filter(x=>x.id!==id);
  saveCart();
}
function saveCart(){
  localStorage.setItem('spartanCart',JSON.stringify(cart));
  renderCart();
}
function renderCart(){
  const count = cart.reduce((a,b)=>a+b.qty,0);
  if($('#cartCount')) $('#cartCount').textContent = count;
  const holder = $('#cartItems');
  if(!holder) return;
  holder.innerHTML='';
  let total = 0;
  cart.forEach(x=>{
    const p = products.find(p=>p.id===x.id);
    if(!p) return;
    total += p.price*x.qty;
    const row=document.createElement('div');
    row.className='cart-row';
    row.innerHTML=`<div><strong>${p.name}</strong><br><span>${p.strength} × ${x.qty}</span></div><div>${money(p.price*x.qty)}<br><button data-remove="${p.id}">Remove</button></div>`;
    holder.appendChild(row);
  });
  if($('#cartTotal')) $('#cartTotal').textContent=money(total);
  document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>removeFromCart(b.dataset.remove));
}
function openCart(){ $('#cartPanel')?.classList.add('open'); $('#overlay')?.classList.add('show'); $('#cartPanel')?.setAttribute('aria-hidden','false'); }
function closeCart(){ $('#cartPanel')?.classList.remove('open'); $('#overlay')?.classList.remove('show'); $('#cartPanel')?.setAttribute('aria-hidden','true'); }

$('#cartBtn')?.addEventListener('click',openCart);
$('#closeCart')?.addEventListener('click',closeCart);
$('#overlay')?.addEventListener('click',closeCart);
$('#searchInput')?.addEventListener('input',renderProducts);
$('#stockFilter')?.addEventListener('change',renderProducts);
$('#checkoutBtn')?.addEventListener('click',()=>{ if(cart.length) window.location.href='checkout.html'; });
$('#closeProductModal')?.addEventListener('click',closeProductModal);
$('#productModal')?.addEventListener('click',e=>{ if(e.target.id==='productModal') closeProductModal(); });
$('#modalAddToCart')?.addEventListener('click',()=>{ if(activeProductId){addToCart(activeProductId);closeProductModal();openCart();} });
document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeProductModal(); });

loadProducts();
