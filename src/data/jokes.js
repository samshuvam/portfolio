// Jokes sprinkled around the site: loader lines, the phone, the terminal,
// idle toasts. Tags help pick a fitting one. Add more any time.
export const jokes = [
  { id: 'npt-wedding', tags: ['nepal', 'time'], text: 'Nepal is 15 minutes ahead of India on the clock, and about 30 minutes behind it at every wedding.' },
  { id: 'works-on-my-machine', tags: ['ai'], text: 'I trained an LLM on my own code. Now it also says “it works on my machine”.' },
  { id: 'rag-charger', tags: ['ai'], text: 'My RAG pipeline retrieves the right evidence 203% better. My brain still cannot retrieve where I left my charger.' },
  { id: 'evtol-exam', tags: ['aviation'], text: 'Why did the eVTOL fail its exam? All vertical takeoff, no horizontal thinking.' },
  { id: 'jhol-momo', tags: ['food'], text: 'There are two kinds of people: those who love momo, and those who have not tried jhol momo yet.' },
  { id: 'virgo-bar', tags: ['kanya'], text: 'A Kanya walks into a bar. Then straightens the bar.' },
  { id: 'cloud-jacket', tags: ['ai', 'nepal'], text: 'I told my mom I work in the cloud. She asked if I took a jacket.' },
  { id: 'ktm-traffic', tags: ['nepal'], text: 'Kathmandu traffic: the original slow-motion feature. No GPU required.' },
  { id: 'forget-on-purpose', tags: ['ai'], text: 'My bio-memory model forgets on purpose. I just forget.' },
  { id: 'chiya-meeting', tags: ['food', 'nepal'], text: 'Chiya is not a drink. It is a meeting, a negotiation and a therapy session, in a small glass.' },
  { id: 'everest-hallucination', tags: ['ai', 'nepal'], text: 'An AI once told me Everest is 9,000 m tall. That is why I build verification layers.' },
  { id: 'load-shedding', tags: ['nepal'], text: 'Load-shedding taught a whole generation of Nepali engineers to press Ctrl+S every four seconds.' },
  { id: 'dashain-budget', tags: ['nepal', 'food'], text: 'Dashain budget: 10% tika, 10% new clothes, 80% meat.' },
  { id: 'dal-bhat-power', tags: ['food', 'nepal'], text: 'Dal bhat power, 24 hour. Peer reviewed by every trekker in Nepal.' },
  { id: 'fl-group-project', tags: ['ai'], text: 'Federated learning is a group project where nobody shares their notes and everyone still passes.' },
  { id: 'kanya-alignment', tags: ['kanya'], text: 'A Kanya’s favourite chart is the alignment chart. Lawful good, centred, 8 px baseline.' },
  { id: 'dashain-features', tags: ['ai', 'nepal'], text: 'I do not have bugs. I have undocumented Dashain features.' },
  { id: 'flight-hours', tags: ['aviation'], text: 'The plane on this website has logged more flight hours than my sleep schedule.' },
  { id: 'drone-pun', tags: ['aviation'], text: 'What do you call a drone that tells jokes? An unmanned aerial pun.' },
  { id: 'tokens-momo', tags: ['ai', 'food'], text: 'Tokens are like momos: you always believe the plate can fit one more.' },
  { id: 'vector-calm', tags: ['ai'], text: 'Why is the vector database so calm? It knows exactly how far it is from everything.' },
  { id: 'aunty-recsys', tags: ['nepal', 'ai'], text: 'Nepali aunties run the best recommendation system ever built. Cold start: none. Accuracy: terrifying.' },
  { id: 'srm-big-data', tags: ['nepal'], text: 'SRM taught me Big Data. Nepali weddings taught me big crowds.' },
  { id: 'erp-old-software', tags: ['work'], text: 'The ERP migration went smoothly. Only three people ask where the old software went. Daily.' },
  { id: 'bs-time-machine', tags: ['nepal'], text: 'No, I did not build a time machine. 2083 is just the Bikram Sambat year.' },
  { id: 'pilot-ctrl-z', tags: ['aviation'], text: 'I wanted to be a pilot, until I found out aircraft do not ship with Ctrl+Z.' },
  { id: 'chiya-debugging', tags: ['food', 'ai'], text: 'Debugging at 2 AM with chiya is called research. Without chiya it is called crying.' },
  { id: 'atc-ktm', tags: ['aviation', 'nepal'], text: 'Urban air traffic control is easy. It is just Kathmandu traffic, in three dimensions, plus time.' },
  { id: 'yap-budh', tags: ['kanya'], text: 'Kanya is ruled by Budh, planet of speech. My phone bill is ruled by Kanya.' },
  { id: 'monsoon-wifi', tags: ['nepal'], text: 'Monsoon in Lalitpur: the rain is strong, the Wi-Fi is weak, and the chiya is on its third round.' },
  { id: 'gpu-consumer', tags: ['ai'], text: 'My model runs on a consumer GPU. Its cooling fan is louder than all my real fans combined.' },
  { id: 'kite-strings', tags: ['nepal'], text: 'Dashain kite fights are just distributed systems with glass-coated strings and no rollback.' },
];

export const randomJoke = (tag) => {
  const pool = tag ? jokes.filter((j) => j.tags.includes(tag)) : jokes;
  return pool[Math.floor(Math.random() * pool.length)] || jokes[0];
};
