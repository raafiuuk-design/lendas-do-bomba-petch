(()=>{
  const YEAR=2026;
  const MONTHS=[
    {month:8,name:'Setembro'},
    {month:9,name:'Outubro'},
    {month:10,name:'Novembro'},
    {month:11,name:'Dezembro'}
  ];
  const WEEK=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

  function monthHTML(month,name){
    const first=new Date(YEAR,month,1).getDay();
    const days=new Date(YEAR,month+1,0).getDate();
    let cells='';
    for(let i=0;i<first;i++)cells+='<div class="calendar-day empty"></div>';
    for(let d=1;d<=days;d++)cells+=`<div class="calendar-day"><b>${d}</b></div>`;
    return `<div class="card calendar-month"><h2>📅 ${name} ${YEAR}</h2><div class="calendar-week">${WEEK.map(w=>`<div>${w}</div>`).join('')}</div><div class="calendar-grid">${cells}</div></div>`;
  }

  function addCalendar(){
    const nav=document.getElementById('nav');
    const main=document.querySelector('main.wrap');
    if(!nav||!main)return;
    if(!document.getElementById('calendarNav')){
      const btn=document.createElement('button');
      btn.id='calendarNav';
      btn.dataset.page='calendar';
      btn.textContent='📅 Calendário';
      btn.onclick=()=>showPage('calendar');
      nav.appendChild(btn);
    }
    if(!document.getElementById('calendar')){
      const sec=document.createElement('section');
      sec.id='calendar';
      sec.className='page';
      sec.innerHTML=`<h1>📅 Calendário 2026</h1><p class="muted">Calendário do BOMBA PETCH de setembro até dezembro.</p><div class="calendar-wrap">${MONTHS.map(m=>monthHTML(m.month,m.name)).join('')}</div>`;
      main.appendChild(sec);
    }
    if(!document.getElementById('calendarStyles')){
      const style=document.createElement('style');
      style.id='calendarStyles';
      style.textContent=`.calendar-wrap{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:22px}.calendar-month{padding:18px}.calendar-month h2{margin-top:0;color:#ff7300}.calendar-week,.calendar-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}.calendar-week{margin-bottom:6px}.calendar-week div{text-align:center;font-size:12px;font-weight:800;color:#9aa3b0}.calendar-day{min-height:54px;border:1px solid #29313d;border-radius:8px;background:#0b0f15;padding:8px;text-align:right}.calendar-day b{color:#fff}.calendar-day.empty{background:transparent;border-color:transparent}@media(max-width:800px){.calendar-wrap{grid-template-columns:1fr}}@media(max-width:450px){.calendar-day{min-height:42px;padding:5px}.calendar-week div{font-size:10px}}`;
      document.head.appendChild(style);
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addCalendar);
  else addCalendar();
  setTimeout(addCalendar,500);
})();
