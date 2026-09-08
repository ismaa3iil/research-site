import {optimize} from './math.mjs';
self.onmessage=({data:{version,triangle}})=>{for(const id of ['O-DGS','O-ERS','O-NFIS'])self.postMessage({version,id,result:optimize(id,triangle)});};
