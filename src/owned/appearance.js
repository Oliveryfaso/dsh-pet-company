export const APPEARANCE_DEFAULTS=Object.freeze({size:462,marginX:16,marginY:16,corner:'bottom-right',cloud:true,pop:true,closeSeconds:8,display:'desktop'});
export function validateAppearance(value={}) {
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('外观配置无效');
 for(const key of Object.keys(value))if(!Object.hasOwn(APPEARANCE_DEFAULTS,key))throw Error('未知外观配置');
 const a={...APPEARANCE_DEFAULTS,...value};
 for(const [key,min,max] of [['size',100,800],['marginX',0,4000],['marginY',0,4000],['closeSeconds',3,20]])if(!Number.isInteger(a[key])||a[key]<min||a[key]>max)throw Error('外观数值超出范围：'+key);
 if(!['bottom-right','bottom-left','top-right','top-left'].includes(a.corner)||!['web','desktop','none'].includes(a.display)||typeof a.cloud!=='boolean'||typeof a.pop!=='boolean')throw Error('外观选项无效');
 return a;
}
