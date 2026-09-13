(function(){
  const KEY = 'spartanAgeOk';
  const allowedReturnPages = new Set(['calculator.html','checkout.html','confirmation.html','track.html']);
  const page = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const verified = localStorage.getItem(KEY) === 'yes';

  function safeRelativeReturn(raw){
    if(!raw) return null;
    try{
      const u = new URL(raw, 'https://local.invalid/');
      const p = (u.pathname.split('/').pop() || '').toLowerCase();
      if(!allowedReturnPages.has(p)) return null;
      // Reject absolute/external input; only simple relative page + query is accepted.
      if(/^https?:\/\//i.test(raw) || raw.startsWith('//')) return null;
      return `${p}${u.search}`;
    }catch{return null}
  }

  function safeReturnPage(){
    const raw = new URLSearchParams(window.location.search).get('return');
    return safeRelativeReturn(raw);
  }

  if(page !== 'index.html' && page !== ''){
    if(!verified && allowedReturnPages.has(page)){
      const current = `${page}${window.location.search || ''}`;
      const target = `index.html?return=${encodeURIComponent(current)}`;
      window.location.replace(target);
    }
    return;
  }

  document.addEventListener('DOMContentLoaded',()=>{
    const ageGate = document.querySelector('#ageGate');
    const ageCheck = document.querySelector('#ageCheck');
    const enterBtn = document.querySelector('#enterBtn');
    if(!ageGate || !ageCheck || !enterBtn) return;

    const returnPage = safeReturnPage();
    if(verified){
      ageGate.style.display='none';
      if(returnPage) window.location.replace(returnPage);
      return;
    }

    ageGate.style.display='flex';
    enterBtn.disabled = !ageCheck.checked;
    ageCheck.addEventListener('change',()=>{
      enterBtn.disabled = !ageCheck.checked;
    });
    enterBtn.addEventListener('click',()=>{
      if(!ageCheck.checked) return;
      localStorage.setItem(KEY,'yes');
      ageGate.style.display='none';
      if(returnPage) window.location.replace(returnPage);
    });
  });
})();
