// Node DOM/worker harness: exercises the real pointer and asynchronous request handlers.
import assert from 'node:assert/strict';import fs from 'node:fs';import * as deps from './geometry.mjs';import {compute} from './worker.mjs';
const ctx=new Proxy({},{get:(t,p)=>t[p]??(()=>{}),set:(t,p,v)=>(t[p]=v,true)}),elements=new Map();
const el=id=>{if(!elements.has(id))elements.set(id,{id,textContent:'',innerHTML:'',style:{},querySelectorAll:()=>[],setAttribute:()=>{},getBoundingClientRect:()=>({left:0,top:0}),setPointerCapture:()=>{},getContext:()=>ctx,parentElement:{}});return elements.get(id)};
const document={getElementById:el,querySelectorAll:()=>[]},window={devicePixelRatio:1,addEventListener:()=>{}};
class Worker{postMessage(q){this.sent=structuredClone(q)}}class ResizeObserver{observe(){}}
let src=fs.readFileSync(new URL('./app.mjs',import.meta.url),'utf8').replace("import {add,sub,mul,dot,mean,norm,area} from './geometry.mjs';","const {add,sub,mul,dot,mean,norm,area}=deps;").replaceAll('import.meta.url',"'http://localhost/app.mjs'");
src+='\nreturn {get:()=>({seq,data,points:structuredClone(points),busy,pending}),worker,canvas,project,configure:()=>{mode="four";points=structuredClone(presets.four["Triangle + its centroid"]);options();request();}};';
const app=new Function('deps','document','window','Worker','ResizeObserver',src)(deps,document,window,Worker,ResizeObserver);
const respond=q=>app.worker.onmessage({data:{id:q.id,...compute(q)}});
respond(app.worker.sent);app.configure();respond(app.worker.sent);assert(app.get().data);
const point=app.project(app.get().points[3]);app.canvas.onpointerdown({clientX:point[0],clientY:point[1],pointerId:1});app.canvas.onpointermove({clientX:point[0]+30,clientY:point[1]-10});
assert.equal(app.get().data,null);assert.match(el('metrics').textContent,/Recomputing/);const old=app.worker.sent;
app.canvas.onpointermove({clientX:point[0]+60,clientY:point[1]-10});respond(old);assert.equal(app.get().data,null);assert(app.get().busy);respond(app.worker.sent);assert(app.get().data);assert.match(app.get().data.result.transferNote,/D is free/);assert.equal(app.get().data.id,app.get().seq);app.canvas.onpointerup();
console.log(JSON.stringify({checks:8,staleChestHidden:true,staleResponseDiscarded:true,latestDragComputed:true,harness:'Node DOM/Worker mock; real app pointer handlers; no native browser rendering claimed'},null,2));
