import {test} from 'node:test';
import assert from 'node:assert/strict';

test('provides a host bridge and an embeddable renderer relay',async()=>{
 const host=await import('../src/renderer-bridge.js').catch(()=>({}));
 const client=await import('../src/client-relay.js').catch(()=>({}));
 assert.equal(typeof host.RendererPetBridge,'function','host bridge has not been implemented');
 assert.equal(typeof client.createRendererRelay,'function','renderer relay has not been implemented');
});
