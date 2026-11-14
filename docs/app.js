import { phrases, parts, feelings, times, categories, preferences, ui, icon } from './data.js';
import { composeMessage, discomfortMessage, filterPhrases } from './compose.js';

const $ = selector => document.querySelector(selector);
const app = $('#app');
const dialog = $('#dialog');
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const storageKey = 'speakcare-preferences-v1';
let stored = {};
try { stored = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch { /* Private mode and corrupt storage are safe to ignore. */ }

// Only language, display settings and catalog favorite IDs are persisted.
// Patient messages, discomfort and care card details never enter localStorage.
const state = {
  language: stored.language === 'es' ? 'es' : 'en', page:'board', category:'all', query:'', selected:[], custom:'', description:null,
  favorites:Array.isArray(stored.favorites) ? stored.favorites.filter(id => phrases.some(p => p.id === id)) : ['water','help','listen','explain'],
  large:stored.large === true, contrast:stored.contrast === true,
  rate:Number.isFinite(stored.rate) ? Math.max(.6,Math.min(1.2,stored.rate)) : .85,
  discomfort:{location:'',feeling:'other',intensity:null,timing:''}, saved:[],
  card:{name:'',support:'',notes:'',preferences:['time','ask']}, speaking:false, voiceStatus:'', dialogMessage:'',dialogLanguage:'en'
};
const t = key => ui[state.language][key];
const localized = (en, es) => state.language === 'es' ? es : en;
function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify({ language:state.language, favorites:state.favorites, large:state.large, contrast:state.contrast, rate:state.rate })); } catch { /* Functionality remains available without storage. */ }
}
function applySettings() {
  document.documentElement.lang = state.language;
  document.documentElement.classList.toggle('large-text', state.large);
  document.documentElement.classList.toggle('high-contrast', state.contrast);
}
const brand = (extra = '') => `<div class="brand ${extra}"><img src="./favicon.svg" alt=""><span>SpeakCare</span></div>`;
const action = (name, text, className = 'secondary-button', disabled = false, iconName = '') => `<button type="button" data-action="${name}" class="${className}" ${disabled ? 'disabled' : ''}>${iconName ? icon(iconName) : ''}${escape(text)}</button>`;
const empty = (title, subtitle, symbol = 'chat') => `<div class="empty-results">${icon(symbol)}<h3>${escape(title)}</h3><p>${escape(subtitle)}</p></div>`;
function currentMessage() {
  const description = state.description ? discomfortMessage(state.description, state.language, parts, feelings, times) : '';
  return composeMessage(state.selected, phrases, state.language, description, state.custom);
}

function render() {
  applySettings();
  app.innerHTML = `<div class="app-shell">
    <aside class="sidebar">${brand()}<div class="brand-sub">${localized('Care starts with connection','Conectar para cuidar')}</div>
      <nav class="side-nav" aria-label="${localized('Main navigation','Navegación principal')}">
        ${[['board','board'],['body','body'],['saved','star'],['card','card']].map(([id,symbol]) => `<button class="nav-item ${state.page === id ? 'active' : ''}" data-page="${id}" aria-label="${t(id)}" ${state.page === id ? 'aria-current="page"' : ''}>${icon(symbol)}<span>${t(id)}</span></button>`).join('')}
      </nav>
      <div class="side-bottom"><div class="help-card"><span class="help-leaf">${icon('leaf')}</span><h3>${t('helpSub')}</h3><p>${t('tagline')}</p>${action('help',t('helpButton'),'text-button',false,'arrow')}</div><div class="side-footer">${icon('shield')}<span>${localized('No account needed','Sin necesidad de cuenta')}</span></div></div>
    </aside>
    <div class="main-shell">
      <header class="topbar"><div class="breadcrumb">${icon('board')}<span>SpeakCare</span><span>/</span><span>${t(state.page)}</span></div>${brand('mobile-brand')}
        <div class="header-tools"><label class="language-control">${icon('globe')}<span class="sr-only">${t('language')}</span><select id="language" aria-label="${t('language')}"><option value="en" ${state.language === 'en' ? 'selected' : ''}>English</option><option value="es" ${state.language === 'es' ? 'selected' : ''}>Español</option></select></label>
        <button class="tool-button" data-action="settings" aria-label="${t('access')}">${icon('sliders')}<span class="tool-label">${t('access')}</span></button></div>
      </header>
      <section class="intro"><div><div class="eyebrow">${t('eyebrow')}</div><h1>${t('title')}</h1><p>${t('subtitle')}</p></div><button class="privacy-pill" data-action="privacy">${icon('shield')}${t('private')}</button></section>
      <main id="main" tabindex="-1">${state.page === 'card' ? cardPage() : `<div class="workspace"><section class="board-column">${state.page === 'body' ? bodyPage() : state.page === 'saved' ? savedPage() : boardPage()}</section><aside class="composer-column" aria-label="${t('yourMessage')}">${composer()}${quickResponses()}</aside></div>`}</main>
      <button type="button" id="mobile-message" class="mobile-message" data-action="show" ${!currentMessage() || state.page==='card'?'hidden':''}>${icon('chat')}<span>${t('yourMessage')}</span>${icon('expand')}</button>
      <footer class="footer"><span>${icon('heart')}${t('footer')}</span><a class="source-link" href="./source.html">${localized('View all source code','Ver todo el código')} ${icon('arrow')}</a><span>${t('disclaimer')}</span></footer>
    </div></div>`;
}

function phraseCards(list) {
  if (!list.length) return empty(t('noResults'),t('resetSearch'),'search');
  return list.map(p => `<article class="phrase ${state.selected.includes(p.id) ? 'selected' : ''}">
    <button type="button" class="phrase-main" data-phrase="${p.id}" aria-pressed="${state.selected.includes(p.id)}" aria-label="${escape(p[state.language].label)}"><span class="phrase-icon tone-${p.tone}">${icon(p.icon)}</span><span class="phrase-label">${escape(p[state.language].label)}</span></button>
    <button type="button" class="favorite-button ${state.favorites.includes(p.id) ? 'on' : ''}" data-favorite="${p.id}" aria-pressed="${state.favorites.includes(p.id)}" aria-label="${t(state.favorites.includes(p.id) ? 'unfavorite' : 'favorite')}: ${escape(p[state.language].label)}">${icon('star')}</button>
    ${state.selected.includes(p.id) ? `<span class="selection-check">${icon('check')}</span>` : ''}
  </article>`).join('');
}
function boardPage() {
  return `<div class="section-head"><div><h2>${t('boardTitle')}</h2><p>${t('boardSub')}</p></div></div>
    <label class="search">${icon('search')}<span class="sr-only">${t('search')}</span><input id="search" type="search" autocomplete="off" placeholder="${t('search')}" value="${escape(state.query)}"></label>
    <div class="categories" role="group" aria-label="${localized('Phrase categories','Categorías de frases')}">${categories.map(c => `<button type="button" class="chip ${state.category === c.id ? 'active' : ''}" data-category="${c.id}" aria-pressed="${state.category === c.id}">${c[state.language]}</button>`).join('')}</div>
    <div class="phrase-grid" id="phrases">${phraseCards(filterPhrases(phrases,state.category,state.query,state.language))}</div>
    <div class="results-note">${icon('star')}<span>${localized('Tap the star to keep a phrase in your favorites.','Toca la estrella para guardar una frase como favorita.')}</span></div>`;
}
function composer() {
  const msg = currentMessage();
  const count = state.selected.length + (state.description ? 1 : 0) + (state.custom.trim() ? 1 : 0);
  return `<section class="composer"><div class="composer-title"><h2>${t('yourMessage')}</h2><span id="message-count" class="count">${count} ${t('selected')}</span></div>
    <div class="composer-subtitle"><span class="status-dot"></span>${t('ready')}</div>
    <div class="message-display ${msg ? '' : 'empty'}" id="message-text" aria-live="polite" aria-atomic="true">${msg ? escape(msg) : `${t('empty')}<small>${t('emptySub')}</small>`}</div>
    <div class="message-tools">${action('copy',t('copy'),'',!msg,'copy')}${action('save',t('save'),'',!msg,'star')}${action('clear',t('clear'),'',!msg,'close')}</div>
    <div class="custom-field"><label for="custom">${t('custom')}</label><textarea id="custom" autocomplete="off" maxlength="600" placeholder="${t('customPlaceholder')}" aria-describedby="custom-count">${escape(state.custom)}</textarea><div class="char-count" id="custom-count">${state.custom.length}/600</div></div>
    ${action('speak',t(state.speaking?'stop':'speak'),'speak-button',!msg,state.speaking?'pause':'volume')}
    ${action('show',t('show'),'fullscreen-button',!msg,'expand')}
    <p class="composer-note">${t('hint')}</p><p id="voice-status" class="voice-status" role="status" ${state.voiceStatus ? '' : 'hidden'}>${escape(state.voiceStatus)}</p></section>`;
}
function quickResponses() {
  return `<section class="quick-card"><div class="quick-title"><h3>${t('quick')}</h3>${icon('chat')}</div><div class="quick-buttons">${[['yes','check'],['no','close'],['unsure','question']].map(([word,symbol]) => `<button data-quick="${word}" type="button">${icon(symbol)}${t(word)}</button>`).join('')}</div><p class="quick-note">${localized('Tap to show a response in large text.','Toca para mostrar una respuesta en grande.')}</p></section>`;
}
function updateComposer() {
  const msg = currentMessage();
  const display = $('#message-text');
  if (!display) return;
  display.classList.toggle('empty',!msg);
  display.innerHTML = msg ? escape(msg) : `${t('empty')}<small>${t('emptySub')}</small>`;
  $('#message-count').textContent = `${state.selected.length+(state.description?1:0)+(state.custom.trim()?1:0)} ${t('selected')}`;
  $('#custom-count').textContent = `${state.custom.length}/600`;
  if ($('#mobile-message')) $('#mobile-message').hidden = !msg || state.page === 'card';
  for (const name of ['speak','show','copy','save','clear']) document.querySelectorAll(`.composer [data-action="${name}"]`).forEach(b => b.disabled = !msg);
}
function refreshPhrases() {
  if ($('#phrases')) $('#phrases').innerHTML = phraseCards(filterPhrases(phrases,state.page === 'saved'?'all':state.category,state.page === 'saved'?'':state.query,state.language,state.page === 'saved',state.favorites));
}

function savedPage() {
  return `<div class="section-head"><div><h2>${t('favorites')}</h2><p>${t('savedSub')}</p></div></div><div class="phrase-grid" id="phrases">${phraseCards(filterPhrases(phrases,'all','',state.language,true,state.favorites))}</div>
    <div class="save-section-title"><h3>${localized('Messages for this visit','Mensajes para esta visita')}</h3><span class="count muted">${state.saved.length}</span></div>
    <p class="muted session-note">${t('session')}</p><div id="saved-messages">${state.saved.length ? state.saved.map(item => `<article class="saved-message"><p lang="${item.language}">${escape(item.text)}</p><div class="saved-message-footer"><span>${item.language === 'es' ? 'Español' : 'English'}</span><div class="saved-message-buttons"><button class="secondary-button" data-show-saved="${item.id}">${icon('expand')}${t('show')}</button><button class="close-button" data-delete-saved="${item.id}" aria-label="${t('remove')}">${icon('close')}</button></div></div></article>`).join('') : empty(t('noSaved'),t('noSavedSub'),'star')}</div>`;
}

function bodyPage() {
  const d = state.discomfort;
  return `<div class="section-head"><div><h2>${t('bodyTitle')}</h2><p>${t('bodySub')}</p></div></div>
    <section class="panel"><div class="body-layout"><div><h3>${t('where')}</h3><div class="body-map" role="group" aria-label="${t('where')}">
      <svg viewBox="0 0 180 332" fill="none" aria-hidden="true"><ellipse cx="90" cy="39" rx="23" ry="28" fill="#dce6d4" stroke="#bdcdb0" stroke-width="1.5"/><path d="M78 65v13L58 84c-9 4-12 15-15 29L29 170c-2 12 12 15 16 4l17-49v62l-4 111c-1 15 19 16 21 2l10-96h2l10 96c2 14 22 13 21-2l-4-111v-62l17 49c4 11 18 8 16-4l-14-57c-3-14-6-25-15-29l-20-6V65" fill="#e7eee0" stroke="#bdcdb0" stroke-width="1.5"/><path d="M65 105q25 13 50 0M65 158q25 12 50 0" stroke="#cbd8be" stroke-dasharray="3 4"/></svg>
      ${['head','neck','chest','stomach','rightArm','leftArm','rightLeg','leftLeg'].map(id => `<button class="body-point point-${id} ${d.location === id ? 'active' : ''}" data-part="${id}" aria-label="${escape(parts[id][state.language])}" aria-pressed="${d.location === id}" title="${escape(parts[id][state.language])}"></button>`).join('')}</div><p class="body-map-caption">${t('bodyHint')}</p>
      <label class="field"><span class="sr-only">${t('where')}</span><select id="location"><option value="">${t('chooseArea')}</option>${Object.entries(parts).map(([id,part]) => `<option value="${id}" ${d.location === id ? 'selected' : ''}>${escape(part[state.language])}</option>`).join('')}</select></label></div>
      <div><fieldset class="field"><legend>${t('feeling')}</legend><div class="feeling-options">${Object.entries(feelings).map(([id,f]) => `<button class="small-chip ${d.feeling === id ? 'active' : ''}" data-feeling="${id}" aria-pressed="${d.feeling === id}">${f[state.language]}</button>`).join('')}</div></fieldset>
      <div class="field"><div class="rating-header"><label for="intensity">${t('intensity')}</label><output class="rating-value" id="rating-value">${d.intensity ?? '—'}</output></div><input type="range" id="intensity" min="0" max="10" step="1" value="${d.intensity ?? 0}" aria-valuetext="${d.intensity ?? t('unknown')}"><div class="range-ends"><span>0 · ${t('none')}</span><span>10 · ${t('severe')}</span></div><button class="text-button" data-action="unset-intensity">${localized('Leave unspecified','Dejar sin especificar')}</button></div>
      <label class="field"><span>${t('timing')}</span><select id="timing"><option value="">${t('unknown')}</option>${Object.entries(times).map(([id,time]) => `<option value="${id}" ${d.timing === id ? 'selected' : ''}>${time[state.language]}</option>`).join('')}</select></label></div></div>
      <div class="description-preview"><h3>${t('preview')}</h3><p id="description-preview">${escape(discomfortMessage(d,state.language,parts,feelings,times) || t('chooseArea'))}</p></div>
      ${action('add-description',t('addDescription'),'primary-button block-button',!d.location,'plus')}</section>`;
}
function refreshDescription() {
  if ($('#description-preview')) $('#description-preview').textContent = discomfortMessage(state.discomfort,state.language,parts,feelings,times) || t('chooseArea');
  const addButton = $('[data-action="add-description"]');
  if (addButton) addButton.disabled = !state.discomfort.location;
}
function cardPage() {
  return `<div class="page-wide"><div class="section-head"><div><h2>${t('cardTitle')}</h2><p>${t('cardSub')}</p></div></div><div class="card-layout">
    <form class="panel care-form" autocomplete="off"><label class="field"><span>${t('name')}</span><input id="card-name" data-card="name" maxlength="80" value="${escape(state.card.name)}" placeholder="${t('namePlaceholder')}"></label>
    <label class="field"><span>${t('support')}</span><input id="card-support" data-card="support" maxlength="100" value="${escape(state.card.support)}" placeholder="${t('supportPlaceholder')}"></label>
    <fieldset class="field"><legend>${t('preference')}</legend>${preferences.map(p => `<label class="check-row"><input type="checkbox" data-preference="${p.id}" ${state.card.preferences.includes(p.id)?'checked':''}>${p[state.language]}</label>`).join('')}</fieldset>
    <label class="field"><span>${t('notes')}</span><textarea id="card-notes" data-card="notes" maxlength="500" placeholder="${t('notesPlaceholder')}">${escape(state.card.notes)}</textarea></label>
    <div class="card-actions">${action('print',t('print'),'primary-button',false,'print')}${action('download',t('download'),'secondary-button',false,'download')}</div><p class="card-notice">${localized('This card stays only on this page. Print or download it before closing or reloading.','Esta tarjeta solo está en esta página. Imprímela o descárgala antes de cerrar o recargar.')}</p></form>
    <article class="care-card" id="care-card" aria-label="${t('cardPreview')}">${careCardContent()}</article></div></div>`;
}
function careCardContent() {
  return `${brand()}<div class="care-eyebrow">${t('cardPreview')}</div><h2>${state.card.name ? escape(state.card.name) : localized('Hello, care team.','Hola, equipo de atención.')}</h2><p>${t('cardIntro')}</p><h3>${t('helps')}</h3><ul>${preferences.filter(p => state.card.preferences.includes(p.id)).map(p => `<li>${p[state.language]}</li>`).join('')}</ul>
    ${state.card.support ? `<h3>${t('supportLabel')}</h3><p>${escape(state.card.support)}</p>` : ''}${state.card.notes ? `<h3>${t('additional')}</h3><p>${escape(state.card.notes)}</p>` : ''}<div class="care-card-end">${t('footer')}<br>SpeakCare · ${t('disclaimer')}</div>`;
}

let toastTimer;
function toast(message) { clearTimeout(toastTimer); $('#toast').textContent=message; $('#toast').classList.add('visible'); toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4200); }
function openDialog(title, content, className='') {
  dialog.className=className;
  dialog.innerHTML=`<div class="dialog-inner"><div class="dialog-header"><h2 id="dialog-title">${escape(title)}</h2><button class="close-button" data-action="close" aria-label="${t('close')}">${icon('close')}</button></div>${content}</div>`;
  if (!dialog.open) dialog.showModal();
}
function showMessage(message, language=state.language) {
  if (!message) return;
  state.dialogMessage=message; state.dialogLanguage=language;
  openDialog(t('yourMessage'),`<div class="presentation-message" lang="${language}">${escape(message)}</div><div class="presentation-footer"><span>SpeakCare · ${t('footer')}</span>${action('speak-dialog',t('speak'),'speak-button',false,'volume')}</div>`,'presentation');
}
function showSettings() {
  openDialog(t('settingsTitle'),`<label class="setting-row">${t('large')}<input id="large" type="checkbox" ${state.large?'checked':''}></label><label class="setting-row">${t('contrast')}<input id="contrast" type="checkbox" ${state.contrast?'checked':''}></label><div class="setting-range"><label for="rate">${t('rate')} <output id="rate-value">${state.rate.toFixed(2)}×</output></label><input type="range" id="rate" min="0.6" max="1.2" step="0.05" value="${state.rate}"></div><small>${t('settingsNote')}</small>${action('reset-settings',t('reset'),'text-button')}`);
}
function stopSpeaking() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  state.speaking=false; updateSpeechButtons();
}
function updateSpeechButtons() {
  for (const button of document.querySelectorAll('[data-action="speak"],[data-action="speak-dialog"]')) {
    button.innerHTML = icon(state.speaking?'pause':'volume')+t(state.speaking?'stop':'speak');
  }
}
function setVoiceStatus(message) {
  state.voiceStatus=message;
  const element=$('#voice-status');
  if(element){element.textContent=message;element.hidden=!message;}
  if(message) toast(message);
}
function speak(message,language=state.language) {
  if(state.speaking){stopSpeaking();return;}
  if(!message)return;
  if(!('speechSynthesis' in window)) {
    setVoiceStatus(localized('Read-aloud is unavailable in this browser. Use full-screen text instead.','Este navegador no tiene lectura en voz alta. Usa el texto en pantalla.'));return;
  }
  const voice = window.speechSynthesis.getVoices().find(v=>v.localService && v.lang.toLowerCase().startsWith(language));
  if(!voice){setVoiceStatus(localized('No on-device voice is available for this language. Enable a system voice, or show the message on screen.','No hay voz local disponible para este idioma. Activa una voz del sistema o muestra el mensaje en pantalla.'));return;}
  setVoiceStatus('');
  window.speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(message);
  utterance.voice=voice;utterance.lang=voice.lang;utterance.rate=state.rate;
  utterance.onend=()=>{state.speaking=false;updateSpeechButtons();};
  utterance.onerror=event=>{state.speaking=false;updateSpeechButtons();if(!['canceled','interrupted'].includes(event.error))setVoiceStatus(localized('The device could not read this message. You can show it in full screen.','El dispositivo no pudo leer el mensaje. Puedes mostrarlo en pantalla.'));};
  state.speaking=true;updateSpeechButtons();window.speechSynthesis.speak(utterance);
}
if ('speechSynthesis' in window) window.speechSynthesis.getVoices();
dialog.addEventListener('close',stopSpeaking);
window.addEventListener('pagehide',stopSpeaking);

document.addEventListener('click',async event=>{
  const button=event.target.closest('button');if(!button || button.disabled)return;
  const data=button.dataset;
  if(data.page){stopSpeaking();state.page=data.page;render();$('#main').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});return;}
  if(data.phrase){
    stopSpeaking();state.selected=state.selected.includes(data.phrase)?state.selected.filter(id=>id!==data.phrase):[...state.selected,data.phrase];
    refreshPhrases();updateComposer();document.querySelector(`[data-phrase="${data.phrase}"]`)?.focus({preventScroll:true});return;
  }
  if(data.favorite){state.favorites=state.favorites.includes(data.favorite)?state.favorites.filter(id=>id!==data.favorite):[...state.favorites,data.favorite];persist();refreshPhrases();document.querySelector(`[data-favorite="${data.favorite}"]`)?.focus({preventScroll:true});return;}
  if(data.category){state.category=data.category;document.querySelectorAll('[data-category]').forEach(b=>{b.classList.toggle('active',b.dataset.category===state.category);b.setAttribute('aria-pressed',String(b.dataset.category===state.category));});refreshPhrases();return;}
  if(data.quick){showMessage(t(data.quick));return;}
  if(data.part){state.discomfort.location=data.part;$('#location').value=data.part;document.querySelectorAll('[data-part]').forEach(b=>{b.classList.toggle('active',b.dataset.part===data.part);b.setAttribute('aria-pressed',String(b.dataset.part===data.part));});refreshDescription();return;}
  if(data.feeling){state.discomfort.feeling=data.feeling;document.querySelectorAll('[data-feeling]').forEach(b=>{b.classList.toggle('active',b.dataset.feeling===data.feeling);b.setAttribute('aria-pressed',String(b.dataset.feeling===data.feeling));});refreshDescription();return;}
  if(data.showSaved){const item=state.saved.find(s=>s.id===data.showSaved);if(item)showMessage(item.text,item.language);return;}
  if(data.deleteSaved){state.saved=state.saved.filter(s=>s.id!==data.deleteSaved);render();return;}
  switch(data.action){
    case 'help':openDialog(t('helpTitle'),`<span class="help-leaf">${icon('leaf')}</span><p>${t('helpText')}</p><p>${t('settingsNote')}</p><small>${t('privacyText')}</small>${action('close',t('tourGo'),'primary-button block-button')}`);break;
    case 'privacy':openDialog(t('private'),`<p>${t('privacyText')}</p><small>${t('settingsNote')}</small>`);break;
    case 'settings':showSettings();break;
    case 'reset-settings':state.large=false;state.contrast=false;state.rate=.85;persist();applySettings();showSettings();break;
    case 'close':dialog.close();break;
    case 'speak':speak(currentMessage());break;
    case 'speak-dialog':speak(state.dialogMessage,state.dialogLanguage);break;
    case 'show':showMessage(currentMessage());break;
    case 'copy':try{await navigator.clipboard.writeText(currentMessage());toast(t('copied'));}catch{showMessage(currentMessage());toast(localized('Clipboard unavailable. Select and copy the full-screen text.','No se pudo copiar. Selecciona y copia el texto en pantalla.'));}break;
    case 'save':{const message=currentMessage();if(!message)return;if(state.saved.some(s=>s.text===message && s.language===state.language)){toast(localized('This message is already saved.','Este mensaje ya está guardado.'));return;}state.saved.unshift({id:crypto.randomUUID(),text:message,language:state.language});if(state.page==='saved')render();toast(t('savedToast'));break;}
    case 'clear':openDialog(t('clearTitle'),`<p>${t('clearText')}</p><div class="card-actions">${action('confirm-clear',t('clear'),'primary-button')}${action('close',t('keep'),'secondary-button')}</div>`);break;
    case 'confirm-clear':stopSpeaking();state.selected=[];state.custom='';state.description=null;dialog.close();render();toast(t('cleared'));break;
    case 'unset-intensity':state.discomfort.intensity=null;$('#intensity').value=0;$('#intensity').setAttribute('aria-valuetext',t('unknown'));$('#rating-value').textContent='—';refreshDescription();break;
    case 'add-description':if(!state.discomfort.location)return;state.description={...state.discomfort};updateComposer();toast(t('added'));break;
    case 'print':window.print();break;
    case 'download':{
      const text=['SpeakCare — '+t('cardPreview'),state.card.name,t('cardIntro'),'',t('helps'),...preferences.filter(p=>state.card.preferences.includes(p.id)).map(p=>'• '+p[state.language]),'',state.card.support?t('supportLabel')+': '+state.card.support:'',state.card.notes].filter(Boolean).join('\n');
      const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='SpeakCare-communication-card.txt';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);break;
    }
  }
});

document.addEventListener('input',event=>{
  const target=event.target;
  if(target.id==='search'){state.query=target.value;refreshPhrases();}
  if(target.id==='custom'){state.custom=target.value;updateComposer();}
  if(target.id==='intensity'){state.discomfort.intensity=Number(target.value);$('#rating-value').textContent=target.value;target.setAttribute('aria-valuetext',`${target.value} / 10`);refreshDescription();}
  if(target.id==='rate'){state.rate=Number(target.value);$('#rate-value').textContent=state.rate.toFixed(2)+'×';persist();}
  if(target.dataset.card){state.card[target.dataset.card]=target.value;$('#care-card').innerHTML=careCardContent();}
});
document.addEventListener('change',event=>{
  const target=event.target;
  if(target.id==='language'){stopSpeaking();state.language=target.value==='es'?'es':'en';state.voiceStatus='';persist();render();if(state.custom)toast(t('customNote'));}
  if(target.id==='location'){state.discomfort.location=target.value;document.querySelectorAll('[data-part]').forEach(b=>{b.classList.toggle('active',b.dataset.part===target.value);b.setAttribute('aria-pressed',String(b.dataset.part===target.value));});refreshDescription();}
  if(target.id==='timing'){state.discomfort.timing=target.value;refreshDescription();}
  if(target.id==='large'||target.id==='contrast'){state[target.id]=target.checked;persist();applySettings();}
  if(target.dataset.preference){state.card.preferences=target.checked?[...state.card.preferences,target.dataset.preference]:state.card.preferences.filter(id=>id!==target.dataset.preference);$('#care-card').innerHTML=careCardContent();}
});
document.addEventListener('submit',event=>event.preventDefault());
render();
