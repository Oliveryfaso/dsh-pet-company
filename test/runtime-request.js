import {Readable} from 'node:stream';
export async function request(runtime,method,path,body,headers={}) {
 const req=Readable.from(body===undefined?[]:[JSON.stringify(body)]);req.url='/dsh-pet-company/'+path;req.method=method;req.headers={host:'127.0.0.1:3080','content-type':'application/json',...headers};
 let code,data;await runtime.handle(req,{writeHead(c){code=c;},end(b){data=JSON.parse(b);}});return {code,data};
}
