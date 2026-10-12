const API_URL = "https://google-ai-smart-flashcard.onrender.com/generate";
const STORAGE_KEY = "smartflashcard_history_v1";
const generateBtn = document.getElementById("generateBtn");
const wordInput = document.getElementById("wordInput");
const flashcardContainer = document.getElementById("flashcardContainer");
const btnText = document.getElementById("btnText");
const loadingSpinner = document.getElementById("loadingSpinner");
const feedback = document.getElementById("feedback");
const cardCount = document.getElementById("cardCount");
const emptyState = document.getElementById("emptyState");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

function getHistory(){try{const v=JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");return Array.isArray(v)?v:[]}catch{return[]}}
function saveHistory(cards){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(cards.slice(0,50)))}catch(e){console.warn("Could not save locally",e)}}
function parseFlashcard(text){
 const clean=String(text||"").replace(/\*\*/g,"").replace(/^\s*```(?:json|text)?\s*/i,"").replace(/\s*```\s*$/i,"").trim();
 const f={definition:"",meaning:"",example:"",translation:"",partOfSpeech:""};
 const lines=clean.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);let current="";
 const pats=[["definition",/^(?:\d+[.)]\s*)?(?:english\s+)?definition\s*[:\-]\s*/i],["meaning",/^(?:\d+[.)]\s*)?(?:vietnamese\s+)?(?:meaning|nghĩa(?:\s+tiếng\s+việt)?)\s*[:\-]\s*/i],["example",/^(?:\d+[.)]\s*)?(?:example\s+sentence|example|ví\s+dụ)\s*[:\-]\s*/i],["translation",/^(?:\d+[.)]\s*)?(?:vietnamese\s+translation|translation|bản\s+dịch|dịch\s+nghĩa)\s*[:\-]\s*/i]];
 for(const line of lines){const pos=line.match(/^\(?\s*(?:part of speech|word type|loại từ)\s*\)?\s*[:\-]\s*(.+)$/i);if(pos){f.partOfSpeech=pos[1].replace(/[()]/g,"").trim();current="";continue}let matched=false;for(const [key,pat] of pats){const m=line.match(pat);if(m){f[key]+=(f[key]?"\n":"")+line.slice(m[0].length).trim();current=key;matched=true;break}}if(!matched&&current)f[current]+=(f[current]?"\n":"")+line.replace(/^\d+[.)]\s*/,"")}
 if(!f.definition&&lines[0])f.definition=lines[0].replace(/^\d+[.)]\s*/,"");if(!f.meaning&&lines[1])f.meaning=lines[1].replace(/^\d+[.)]\s*/,"");if(!f.example&&lines[2])f.example=lines[2].replace(/^\d+[.)]\s*/,"");if(!f.translation&&lines[3])f.translation=lines[3].replace(/^\d+[.)]\s*/,"");
 for(const k of ["definition","meaning","example","translation"])f[k]=f[k].replace(/^\s*[-•]\s*/,"").trim();return{...f,raw:clean}
}
function field(label,value,cls=""){const s=document.createElement("section");s.className=`field ${cls}`.trim();const h=document.createElement("div");h.className="field-label";h.textContent=label;const p=document.createElement("p");p.textContent=value||"Chưa có nội dung";s.append(h,p);return s}
function renderCard(item){
 const card=document.createElement("article");card.className="flashcard";const top=document.createElement("div");top.className="card-top";const title=document.createElement("h3");title.className="word-title";title.textContent=item.word;top.append(title);
 if(item.partOfSpeech){const b=document.createElement("span");b.className="part-of-speech";b.textContent=item.partOfSpeech;top.append(b)}
 card.append(top,field("DEFINITION",item.definition),field("NGHĨA TIẾNG VIỆT",item.meaning),field("EXAMPLE",item.example,"example"),field("BẢN DỊCH",item.translation));
 const actions=document.createElement("div");actions.className="card-actions";const copy=document.createElement("button");copy.type="button";copy.textContent="Sao chép";copy.addEventListener("click",async()=>{const t=`${item.word}\nDefinition: ${item.definition}\nNghĩa: ${item.meaning}\nExample: ${item.example}\nBản dịch: ${item.translation}`;try{await navigator.clipboard.writeText(t);feedback.textContent=`Đã sao chép "${item.word}".`}catch{feedback.textContent="Trình duyệt không cho phép sao chép tự động."}});
 const del=document.createElement("button");del.type="button";del.textContent="Xóa thẻ";del.addEventListener("click",()=>{saveHistory(getHistory().filter(x=>x.id!==item.id));renderHistory();feedback.textContent=`Đã xóa "${item.word}".`});actions.append(copy,del);card.append(actions);return card
}
function renderHistory(){const h=getHistory();flashcardContainer.replaceChildren();h.forEach(x=>flashcardContainer.append(renderCard(x)));cardCount.textContent=String(h.length);emptyState.classList.toggle("hidden",h.length>0);clearHistoryBtn.classList.toggle("hidden",h.length===0)}
async function generateFlashcard(){
 const word=wordInput.value.trim();if(!word){feedback.textContent="Hãy nhập một từ vựng trước nhé.";wordInput.focus();return}
 generateBtn.disabled=true;btnText.classList.add("hidden");loadingSpinner.classList.remove("hidden");feedback.textContent="Đang kết nối AI…";
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),90000);
 try{const res=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({word}),signal:controller.signal});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||`Máy chủ trả về lỗi ${res.status}.`);if(!data.flashcard)throw new Error("AI chưa trả về nội dung. Vui lòng thử lại.");
 const p=parseFlashcard(data.flashcard);const item={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,word:data.word||word,...p,createdAt:new Date().toISOString()};const h=getHistory().filter(x=>x.word.toLowerCase()!==item.word.toLowerCase());h.unshift(item);saveHistory(h);renderHistory();wordInput.value="";feedback.textContent=`Đã tạo flashcard cho "${item.word}".`
 }catch(e){console.error(e);feedback.textContent=e.name==="AbortError"?"Máy chủ phản hồi quá lâu. Thử lại sau ít phút nhé.":(e.message||"Không thể tạo flashcard. Vui lòng thử lại.")}finally{clearTimeout(timer);generateBtn.disabled=false;btnText.classList.remove("hidden");loadingSpinner.classList.add("hidden")}
}
generateBtn.addEventListener("click",generateFlashcard);wordInput.addEventListener("keydown",e=>{if(e.key==="Enter")generateFlashcard()});clearHistoryBtn.addEventListener("click",()=>{if(confirm("Xóa toàn bộ lịch sử flashcard trên trình duyệt này?")){saveHistory([]);renderHistory();feedback.textContent="Đã xóa lịch sử trên thiết bị này."}});renderHistory();
