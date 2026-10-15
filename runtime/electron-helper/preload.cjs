'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('companyBridge',Object.freeze({
 init:()=>ipcRenderer.invoke('company:init'),ready:()=>ipcRenderer.send('company:ready'),
 onState:callback=>{const listener=(_event,message)=>callback(message);ipcRenderer.on('company:state',listener);return()=>ipcRenderer.removeListener('company:state',listener);},
 ack:id=>ipcRenderer.send('company:ack',id),interactive:value=>ipcRenderer.send('company:interactive',value),drag:(dx,dy)=>ipcRenderer.send('company:drag',{dx,dy}),
}));
