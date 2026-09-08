import {buildFamilies} from './families.mjs';
self.onmessage=({data:{version,triangle,options}})=>{try{self.postMessage({version,scene:buildFamilies(triangle,options)});}catch(e){self.postMessage({version,error:e.message});}};
