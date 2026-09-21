(()=>{
  const YEAR=2026;
  const STORAGE_KEY='bombaPatchCalendarReminders2026';
  const MONTHS=[
    {month:8,name:'Setembro'},
    {month:9,name:'Outubro'},
    {month:10,name:'Novembro'},
    {month:11,name:'Dezembro'}
  ];
  const WEEK=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  let editing=false;

  function escapeHTML(value){
    return String(value??'')
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }

  function loadReminders(){
    try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{}}
    catch(error){return {}}
  }

  function saveReminders(reminders){
    localStorage.setItem(STORAGE_KEY,JSON.stringify(reminders));
  }

  function dateKey(month,day){
    return `${YEAR}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  }

  function monthHTML(month,name){
    const reminders=loadReminders();
    const first=new Date(YEAR,month,1).getDay();
    const days=new Date(YEAR,month+1,0).getDate();
    let cells='';
    for(let i=0;i<first;i++)cells+='<div class="calendar-day empty"></div>';
    for(let day=1;day<=days;day++){
      const key=dateKey(month,day);
      const reminder=reminders[key]||'';
      cells+=`<button class="calendar-day${reminder?' has-reminder':''}" type="button" data-date="${key}" data-label="${day} de ${name}" aria-label="${reminder?`Editar lembrete de ${day} de ${name}`:`Adicionar lembrete em ${day} de ${name}`}"><b>${day}</b><span class="calendar-reminder">${escapeHTML(reminder)}</span></button>`;
    }
    return `<div class="card calendar-month"><h2>📅 ${name} ${YEAR}</h2><div class="calendar-week">${WEEK.map(day=>`<div>${day}</div>`).join('')}</div><div class="calendar-grid">${cells}</div></div>`;
  }

  function renderMonths(){
    const wrap=document.querySelector('#calendar .calendar-wrap');
    if(!wrap)return;
    wrap.innerHTML=MONTHS.map(item=>monthHTML(item.month,item.name)).join('');
    wrap.querySelectorAll('.calendar-day[data-date]').forEach(day=>day.onclick=()=>{
      if(!editing)return;
      openEditor(day.dataset.date,day.dataset.label);
    });
  }

  function openEditor(key,label){
    const reminders=loadReminders();
    const text=prompt(`Lembrete para ${label}:`,reminders[key]||'');
    if(text===null)return;
    const clean=text.trim();
    if(clean)reminders[key]=clean;
    else delete reminders[key];
    saveReminders(reminders);
    renderMonths();
    showMessage(clean?'Lembrete salvo!':'Lembrete removido.');
  }

  function showMessage(text){
    const message=document.getElementById('calendarMsg');
    if(!message)return;
    message.textContent=text;
    clearTimeout(showMessage.timer);
    showMessage.timer=setTimeout(()=>message.textContent='',2500);
  }

  function toggleEditing(){
    editing=!editing;
    const calendar=document.getElementById('calendar');
    const button=document.getElementById('editCalendar');
    if(calendar)calendar.classList.toggle('calendar-editing',editing);
    if(button){
      button.classList.toggle('primary',editing);
      button.textContent=editing?'✅ Concluir edição':'✏️ Editar';
    }
    showMessage(editing?'Clique em uma data para escrever o lembrete.':'Edição concluída.');
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
      sec.innerHTML=`<h1>📅 Calendário 2026</h1><p class="muted">Calendário do BOMBA PATCH de setembro até dezembro.</p><div class="actions"><button id="editCalendar" class="btn" type="button">✏️ Editar</button><span id="calendarMsg" class="ok" role="status"></span></div><div class="calendar-wrap"></div>`;
      main.appendChild(sec);
      document.getElementById('editCalendar').onclick=toggleEditing;
      renderMonths();
    }
    if(!document.getElementById('calendarStyles')){
      const style=document.createElement('style');
      style.id='calendarStyles';
      style.textContent=`.calendar-wrap{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:22px}.calendar-month{padding:18px}.calendar-month h2{margin-top:0;color:#ff7300}.calendar-week,.calendar-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}.calendar-week{margin-bottom:6px}.calendar-week div{text-align:center;font-size:12px;font-weight:800;color:#9aa3b0}.calendar-day{appearance:none;display:flex;flex-direction:column;gap:5px;min-width:0;min-height:72px;border:1px solid #29313d;border-radius:8px;background:#0b0f15;padding:8px;color:#fff;text-align:left;font:inherit}.calendar-day b{align-self:flex-end;color:#fff}.calendar-day.empty{background:transparent;border-color:transparent}.calendar-reminder{display:block;width:100%;overflow-wrap:anywhere;color:#ffc078;font-size:11px;line-height:1.25}.calendar-day.has-reminder{border-color:#ff7300;background:#1b120b}.calendar-editing .calendar-day[data-date]{cursor:pointer;box-shadow:inset 0 0 0 1px #ff730055}.calendar-editing .calendar-day[data-date]:hover,.calendar-editing .calendar-day[data-date]:focus{border-color:#ff7300;outline:2px solid #ff730066}@media(max-width:800px){.calendar-wrap{grid-template-columns:1fr}}@media(max-width:450px){.calendar-day{min-height:62px;padding:5px}.calendar-week div{font-size:10px}.calendar-reminder{font-size:9px}}`;
      document.head.appendChild(style);
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addCalendar);
  else addCalendar();
  setTimeout(addCalendar,500);

  if(!document.querySelector('script[src="games-18-fix.js"]')){
    const script=document.createElement('script');
    script.src='games-18-fix.js?v=2';
    document.head.appendChild(script);
  }
})();
