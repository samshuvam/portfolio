// Seconds of visible simulation time, never scroll position.
export const TRAFFIC = [
  {call:'SHUV-15937',from:'Pokhara',to:'Lalitpur'},
  {call:'SHUV-5711',from:'Biratnagar',to:'Janakpur'},
  {call:'SHUV-ACB',from:'Kathmandu',to:'Bhairahawa'},
  {call:'SHUV-SAM',from:'Janakpur',to:'Pokhara'},
];
export function cruiseTraffic(seconds){
  const cycle=132,at=((Math.max(0,seconds)-24)%cycle+cycle)%cycle;
  const index=Math.floor(at/33),local=at%33;
  return {flight:TRAFFIC[index],visible:seconds>=24&&local<17,progress:Math.min(1,local/17),direction:index%2?-1:1};
}
export function airportTraffic(seconds){
  const at=Math.max(0,seconds)%104,index=Math.floor(at/26),local=at%26;
  return {flight:TRAFFIC[index],visible:local<22,progress:Math.min(1,local/22),departing:index===2};
}

// Observation-deck traffic: two independently staggered background flights.
// SUV-1478 belongs to the page's cruise layer and never enters this schedule.
export function observationTraffic(seconds,slot){
  const elapsed=Math.max(0,seconds),cycle=96,local=(elapsed+slot*40)%cycle;
  const flight=TRAFFIC[(Math.floor((elapsed+slot*40)/cycle)*2+slot)%TRAFFIC.length],depart=flight.call==='SHUV-ACB',p=local/72,visible=local<72;
  return {flight,depart,p,visible,status:!visible?'EXPECTED':depart?(p<.45?'TAXI / 09R':'DEPARTING'):p<.58?'ON APPROACH':p<.72?'LANDED':'TAXI / TERMINAL'};
}
