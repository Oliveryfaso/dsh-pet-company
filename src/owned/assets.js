import {readFile,realpath,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {EMBEDDED_IDS} from '../runtime-provider.js';
export const OWNED_ROUTE='/pet-company-runtime';
export function ownedAssetURL(id,name){return OWNED_ROUTE+'/asset/'+encodeURIComponent(id)+'/'+encodeURIComponent(name)+'.webm';}
export async function readOwnedAsset(id,name) {
 if(!EMBEDDED_IDS.includes(id)||typeof name!=='string'||!/^[a-z][a-z0-9-]{0,63}$/.test(name))throw Error('素材标识无效');
 const root=await realpath(new URL('../../pet/'+id+'-animation/',import.meta.url));
 const file=fileURLToPath(new URL('../../pet/'+id+'-animation/'+name+'.webm',import.meta.url));
 if(await realpath(file)!==root+'/'+name+'.webm')throw Error('素材必须是包内文件');
 const info=await stat(file);if(!info.isFile()||info.size>16*1024*1024)throw Error('素材范围无效');
 return {bytes:await readFile(file),type:'video/webm',file};
}
