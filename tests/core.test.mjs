import { test } from 'node:test';
import { createAirliner as createFlightRig } from '../src/three/airlinerRig.js';
import assert from 'node:assert/strict';
import { KEEPSAKE_FRAMES, keepsakeFrameSvg, frameDataUrl } from '../src/lib/keepsakes.js';
import { build } from 'vite';
import { TRAFFIC, cruiseTraffic, airportTraffic, observationTraffic } from '../src/three/trafficSchedule.js';
import { journey } from '../src/data/journey.js';
import { imagery } from '../src/lib/imagery.js';
import fs from 'node:fs';

test('autonomous traffic has quiet gaps, repeatable timings and mostly arrivals',()=>{
  assert.equal(cruiseTraffic(0).visible,false);
  assert.equal(cruiseTraffic(24).visible,true);
  assert.equal(cruiseTraffic(42).visible,false);
  assert.deepEqual(cruiseTraffic(29),cruiseTraffic(161));
  assert.equal(new Set(TRAFFIC.map(f=>f.call)).size,4);
  assert.equal(new Set(TRAFFIC.map(f=>f.from+'→'+f.to)).size,4);
  const waves=[0,26,52,78].map(airportTraffic);
  assert.equal(waves.filter(f=>f.departing).length,1);
  assert.equal(waves.filter(f=>!f.departing).length,3);
  for(let t=0;t<300;t++){const flight=cruiseTraffic(t),ground=airportTraffic(t);assert.ok(flight.progress>=0&&flight.progress<=1);assert.ok(ground.progress>=0&&ground.progress<=1);assert.ok(TRAFFIC.includes(flight.flight));}
});
test('airport observation traffic keeps the main flight airborne and arrivals on separate timing',()=>{
  const calls=new Set();let arrivals=0,departures=0;
  for(let t=0;t<192;t++)for(let slot=0;slot<2;slot++){const flight=observationTraffic(t,slot);calls.add(flight.flight.call);assert.notEqual(flight.flight.call,'SUV-1478');if(flight.visible){assert.ok(flight.p>=0&&flight.p<1);if(flight.depart)departures++;else arrivals++;}}
  assert.equal(calls.size,4);assert.ok(arrivals>departures*2);
  assert.equal(observationTraffic(75,0).visible,false);
  assert.equal(observationTraffic(0,0).status,'ON APPROACH');
  assert.equal(observationTraffic(43,0).status,'LANDED');
  assert.equal(observationTraffic(56,0).status,'TAXI / TERMINAL');
});
test('every journey milestone owns a unique, installed contextual image',()=>{
  assert.equal(journey.length,16);assert.equal(new Set(journey.map(m=>m.image)).size,16);
  journey.forEach(m=>{assert.ok(imagery[m.image],m.id);assert.ok(fs.existsSync('public'+imagery[m.image].src),m.id);});
});

// Use the same module resolution and import.meta.glob transformation as the app.
const bundle = await build({ configFile:false, logLevel:'error', ssr:{noExternal:true}, build:{ssr:'tests/subjects.js',write:false,minify:false,target:'es2022'} });
const entry = bundle.output.find(file => file.type === 'chunk' && file.isEntry);
const {ask,sendMessage,toTirhuta,romanToDeva,localize,computeWorld} = await import('data:text/javascript;base64,'+Buffer.from(entry.code).toString('base64'));

test('all twenty Nepal keepsake frames have unique art, unique filters and an export watermark',()=>{
  assert.equal(KEEPSAKE_FRAMES.length,20);
  for(const field of ['id','name','filter'])assert.equal(new Set(KEEPSAKE_FRAMES.map(f=>f[field])).size,20);
  assert.equal(new Set(KEEPSAKE_FRAMES.map(f=>keepsakeFrameSvg(f))).size,20);
  for(const frame of KEEPSAKE_FRAMES){
    const svg=keepsakeFrameSvg(frame);
    assert.match(svg,/width="1200" height="1600"/);
    assert.match(svg,/SHUVAMSINGH.COM.NP · NEPAL KEEPSAKE/);
    assert.doesNotMatch(svg,/<script|https?:\/\/(?!www.w3.org)/);
    assert.equal(decodeURIComponent(frameDataUrl(frame).split(',')[1]),svg);
  }
});

test('assistant answers canonical facts in all three languages and accepts Devanagari queries',()=>{
  assert.match(ask('Which papers were accepted?','en').text,/IEEE ICAII/);
  assert.match(ask('What is his CGPA?','ne').text,/८\.६१/);
  assert.match(ask('शिक्षा','mai').text,/SRM University/);
  assert.match(ask('जन्म','ne').text,/२००३/);
  assert.match(ask('What is RAG?','mai').text,/[\u0900-\u097f]/);
  assert.match(ask('experience','mai').text,/[\u0900-\u097f]/);
  assert.match(ask('segmented generation','ne').text,/[\u0900-\u097f]/);
  assert.equal(ask('   ','en'),null);
});

test('content overlays preserve IDs, dates and canonical source objects',()=>{
  const source={id:'a',date:'2026-10-02',title:'Title',points:[{text:'Original',value:3}]};
  const translated=localize(source,{ne:{a:{title:'शीर्षक',points:[{text:'अनुवाद'}]}}},'ne');
  assert.equal(translated.date,source.date);
  assert.equal(translated.points[0].value,3);
  assert.equal(source.points[0].text,'Original');
});

test('Nepal date calculation respects the UTC+5:45 midnight boundary',()=>{
  const before=computeWorld(new Date('2026-10-01T18:14:00Z'));
  const after=computeWorld(new Date('2026-10-01T18:15:00Z'));
  assert.equal(before.npt.day,1);
  assert.equal(after.npt.day,2);
  assert.equal(after.npt.hour,0);
});

test('Tirhuta export preserves spaces and maps consonants, vowel signs, virama and digits',()=>{
  assert.equal(romanToDeva('Shuvam Singh'),'शुभम् सिंह');
  assert.equal(toTirhuta('क् ०9'),String.fromCodePoint(0x1148f,0x114c2)+' '+String.fromCodePoint(0x114d0,0x114d9));
  assert.equal(toTirhuta('Hello!'),'Hello!');
});

test('email relay accepts explicit confirmation and rejects failures, malformed JSON and HTTP errors',async()=>{
  const original=globalThis.fetch;
  try {
    for (const success of [true,'true']) {
      globalThis.fetch=async()=>({ok:true,json:async()=>({success})});
      assert.equal((await sendMessage({message:'Test'})).success,success);
    }
    for (const result of [{success:false},{success:'false'},{}]) {
      globalThis.fetch=async()=>({ok:true,json:async()=>result});
      await assert.rejects(sendMessage({message:'Test'}));
    }
    globalThis.fetch=async()=>({ok:true,json:async()=>{throw new Error('Invalid JSON');}});
    await assert.rejects(sendMessage({message:'Test'}));
    globalThis.fetch=async()=>({ok:false,status:503});
    await assert.rejects(sendMessage({message:'Test'}),/503/);
  } finally {globalThis.fetch=original;}
});

test('A350 flight gear retracts, clamps safely and updates lights without browser globals',()=>{
  const rig = createFlightRig();
  try {
    const gear = rig.group.getObjectByName('gear');
    assert.equal(gear.visible, false);
    rig.setGear(1);
    assert.equal(gear.visible, true);
    assert.equal(gear.children.length, 5);
    rig.setGear(.5);
    gear.children.forEach(part => assert.ok(Number.isFinite(part.rotation.x + part.rotation.z)));
    rig.update(3.2, {night:1,landing:1});
    const alpha=rig.group.getObjectByName('flight-lights').geometry.attributes.aAlpha.array;
    assert.ok([...alpha].every(Number.isFinite));
    assert.ok(alpha.some(value=>value>0));
    rig.setGear(-1);
    assert.equal(gear.visible,false);
    rig.setGear(2);
    assert.equal(gear.visible,true);
  } finally { rig.dispose(); }
});
