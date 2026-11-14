const fileNav=document.querySelector('#files');
const code=document.querySelector('#code');
const filename=document.querySelector('#file-name');
const copy=document.querySelector('#copy-code');
const status=document.querySelector('#source-status');
try{
  const response=await fetch('./source-code.json');
  if(!response.ok)throw new Error('Source unavailable');
  const files=await response.json();
  function select(path){
    code.textContent=files[path];filename.textContent=path;copy.disabled=false;
    fileNav.querySelectorAll('button').forEach(b=>{b.classList.toggle('active',b.dataset.path===path);b.setAttribute('aria-current',b.dataset.path===path?'true':'false');});
    code.parentElement.scrollTop=0;status.textContent='';
  }
  for(const path of Object.keys(files)){
    const button=document.createElement('button');button.textContent=path;button.dataset.path=path;button.addEventListener('click',()=>select(path));fileNav.append(button);
  }
  select('README.md');
  copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(code.textContent);status.textContent='File copied.';}catch{status.textContent='Clipboard unavailable. Select the code and copy it manually.';}});
}catch{filename.textContent='Source could not load';status.textContent='Try reloading, or download the full project using the button above.';}
