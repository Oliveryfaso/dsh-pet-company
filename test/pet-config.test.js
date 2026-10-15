import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
test('orange automatic interactions never pick the preserved flattened source poses',async()=>{
 const cfg=JSON.parse(await readFile(new URL('pet/companion-orange-config.json',root),'utf8'));
 const actions=[...cfg.animations.idle,...cfg.animations.drag,...cfg.animations.clicks,...Object.values(cfg.animations.events).flat(Infinity)];
 assert.deepEqual(actions.filter(name=>['idle','source-idle','jumping','failed'].includes(name)),[]);
 assert.equal(cfg.pets[0].presentation.theme,'orange');
 assert.ok(cfg.animations.categories.some(category=>category.actions.includes('jumping')&&category.actions.includes('failed')),'original actions remain accessible for source inspection');
});

test('orange care keeps the exact selected reading proportions',async()=>{
 const dir=new URL('pet/companion-orange-animation/',root);
 assert.equal((await readFile(new URL('care.webm',dir))).equals(await readFile(new URL('review.webm',dir))),true,'orange care must be a byte-identical reading alias');
});
