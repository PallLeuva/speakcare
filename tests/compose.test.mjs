import test from 'node:test';
import assert from 'node:assert/strict';
import { composeMessage, discomfortMessage, filterPhrases } from '../dist/compose.js';
import { phrases, parts, feelings, times } from '../dist/data.js';

test('selected phrases keep the patient’s selection order', () => {
  assert.equal(composeMessage(['pain','water'],phrases,'en',null), 'I am in pain. I would like some water, please.');
});
test('custom text is preserved verbatim, including medical terms and negation', () => {
  const text='I am NOT allergic to penicillin. I do not want an injection.';
  assert.equal(composeMessage([],phrases,'en',null,text),text);
});
test('changing the board language translates only the catalog, never custom text', () => {
  assert.equal(composeMessage(['pain'],phrases,'es',null,'Keep my words.'),'Tengo dolor. Keep my words.');
});
test('no description is inferred when the user has not selected an area', () => {
  assert.equal(discomfortMessage({location:'',feeling:'sharp',intensity:7},'en',parts,feelings,times),'');
});
test('intensity zero is preserved rather than dropped as a falsy value', () => {
  assert.equal(discomfortMessage({location:'leftArm',feeling:'tingling',intensity:0,timing:'now'},'en',parts,feelings,times),'I feel tingling in my left arm. The intensity is 0 out of 10. It is happening now.');
});
test('unknown intensity and timing are never invented', () => {
  assert.equal(discomfortMessage({location:'head',feeling:'other',intensity:null,timing:''},'en',parts,feelings,times),'I feel discomfort in my head.');
});
test('left and right are distinct in both language catalogs', () => {
  assert.match(discomfortMessage({location:'rightArm',feeling:'aching'},'es',parts,feelings,times),/brazo derecho/);
  assert.match(discomfortMessage({location:'leftArm',feeling:'aching'},'es',parts,feelings,times),/brazo izquierdo/);
});
test('search respects category and selected language; keyword search finds synonyms', () => {
  assert.equal(filterPhrases(phrases,'all','bathroom','en')[0].id,'restroom');
  assert.equal(filterPhrases(phrases,'all','agua','es')[0].id,'water');
  assert.equal(filterPhrases(phrases,'questions','water','en').length,0);
});
test('every catalog entry has a unique ID, icon, category, and both translations', () => {
  assert.equal(new Set(phrases.map(p=>p.id)).size,phrases.length);
  for(const p of phrases) for(const language of ['en','es']) {
    assert.ok(p[language].label);assert.ok(p[language].text);assert.ok(p.icon);assert.ok(p.category);
  }
});
test('favorites only returns known selected catalog IDs', () => {
  assert.deepEqual(filterPhrases(phrases,'all','','en',true,['water','invalid']).map(p=>p.id),['water']);
});
