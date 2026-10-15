import {randomUUID} from 'node:crypto';
import {mkdir,writeFile,readFile,unlink} from 'node:fs/promises';
import {join,dirname} from 'node:path';
export class OwnerLock {
 constructor(home){this.file=join(home,'dsh-pet-company/runtime/owner.lock');this.token=randomUUID();this.owned=false;this.other=null;this.ready=this.acquire();}
 async acquire(){await mkdir(dirname(this.file),{recursive:true});try{await writeFile(this.file,JSON.stringify({token:this.token,pid:process.pid})+'\n',{flag:'wx',mode:0o600});this.owned=true;this.other=null;}catch(e){if(e.code!=='EEXIST')throw e;try{const text=await readFile(this.file,'utf8');if(text.length>4096)throw Error();this.other=JSON.parse(text);}catch{this.other={};}}return this.owned;}
 status(){return {owned:this.owned,reason:this.owned?'':'同一 DSH home 的陪伴运行权已被占用，本 Profile 只读。',recoveryToken:typeof this.other?.token==='string'?this.other.token:null};}
 async recover({stopped,token}){
  await this.ready;if(this.owned)return;if(stopped!==true||!token||token!==this.other?.token)throw Error('请先停止相关 Profile 并核对锁标识');
  const gate=this.file+'.recovery';let held=false;
  try{
   try{await writeFile(gate,this.token,{flag:'wx',mode:0o600});held=true;}catch(e){if(e.code==='EEXIST')throw Error('已有恢复操作或遗留恢复锁，请先停止相关 Profile 并检查');throw e;}
   const text=await readFile(this.file,'utf8');if(text.length>4096)throw Error('锁状态无法确认，请保留原文件');const owner=JSON.parse(text);
   if(owner.token!==token||!Number.isSafeInteger(owner.pid)||owner.pid<=0)throw Error('锁状态无法确认，请保留原文件');
   let alive=true;try{process.kill(owner.pid,0);}catch(e){if(e.code==='ESRCH')alive=false;else throw Error('无法确认原进程已退出');}if(alive)throw Error('原拥有者仍在运行，未移除锁');
   if(await readFile(this.file,'utf8')!==text)throw Error('锁已改变');await unlink(this.file);await this.acquire();
  }finally{if(held)await unlink(gate);}
 }
 async release(){await this.ready;if(!this.owned)return;try{const text=await readFile(this.file,'utf8');if(JSON.parse(text).token===this.token)await unlink(this.file);}catch(e){if(e.code!=='ENOENT')throw e;}finally{this.owned=false;}}
}
