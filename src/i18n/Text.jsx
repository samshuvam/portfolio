import { useLang, translate } from './index';
import core from './ui/core';
import lab from './ui/lab';
import phrases from './ui/phrases';
const normalized = text => String(text).replace(/\s+/g,' ').trim();
const catalog = new Map();
for(const dict of [core,lab]) for(const [key,en] of Object.entries(dict.en)) catalog.set(normalized(en),{en,ne:dict.ne?.[key],mai:dict.mai?.[key]});
for(const [en,[ne,mai]] of Object.entries(phrases)) catalog.set(en,{en,ne,mai});
export function copy(text,lang,vars) {
  const key=normalized(text),entry=catalog.get(key);
  const value=entry?.[lang]??text;
  return vars ? String(value).replace(/\{(\w+)\}/g,(_,k)=>vars[k]??'') : value;
}
export function useCopy(){const lang=useLang();return(text,vars)=>copy(text,lang,vars);}
export default function Text({text}){const lang=useLang();return copy(text,lang);}
