export class PetBridge {
  constructor(port, fetcher=globalThis.fetch) { this.port=port; this.fetcher=fetcher; this.controllers=new Set(); }
  async request(path, body) {
    const port=this.port();
    if (!Number.isInteger(port) || port<1 || port>65535) throw Error('DSH web 服务未就绪');
    const controller=new AbortController(); this.controllers.add(controller);
    const timer=setTimeout(()=>controller.abort(),3000); timer.unref?.();
    try {
      const response=await this.fetcher(`http://127.0.0.1:${port}/dsh-pet-7340/${path}`,{
        method:body===undefined?'GET':'POST', signal:controller.signal, redirect:'error',
        headers:body===undefined?{}:{'Content-Type':'application/json'},
        body:body===undefined?undefined:JSON.stringify(body),
      });
      if (!response.ok) {
        const error=Error(response.status===403?'桌面宿主拒绝插件的本机 HTTP 请求（403），当前宿主未提供宠物共享服务':'dsh-pet 暂不可用');
        if(response.status===403) error.code='DESKTOP_ACCESS_BLOCKED';
        throw error;
      }
      const result=await response.json();
      if (body!==undefined && result.ok!==true) {
        const error=Error(result.reason==='unknown-pet'?'找不到所选宠物，请核对宠物 ID':result.reason || 'dsh-pet 拒绝请求');
        if(result.reason==='unknown-pet') error.code='PET_NOT_FOUND';
        throw error;
      }
      return result;
    } finally { clearTimeout(timer); this.controllers.delete(controller); }
  }
  async state(pet) {
    const state=await this.request('state');
    if(pet!==undefined) {
      // /state contains only past events; the configured roster is authoritative.
      const entries=await this.request('config');
      if(!Object.values(entries).some(entry=>entry?.pets?.some(item=>item.id===pet))) {
        const error=Error('找不到所选宠物，请核对宠物 ID'); error.code='PET_NOT_FOUND'; throw error;
      }
    }
    return state;
  }
  broadcast(pet,text) { return this.request('broadcast?pet='+encodeURIComponent(pet),{text}); }
  async animate(pet) {
    const entries=await this.request('config');
    const entry=Object.values(entries).find(e=>e?.pets?.some(p=>p.id===pet));
    if (entry?.animations?.categories?.some(c=>c.actions?.includes('care'))) await this.request('anim?pet='+encodeURIComponent(pet),{name:'care'});
  }
  close() { for (const c of this.controllers) c.abort(); }
}
