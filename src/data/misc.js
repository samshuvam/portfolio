// Videos: paste a YouTube link and it joins the in-flight playlist.
export const videos = [
  { id: 'federated-learning', title: 'Federated learning, explained', url: 'https://www.youtube.com/watch?v=Ewa8DXRcki4', description: 'Privacy-preserving collaborative learning, from the build bench.', length: 'Explainer' },
  { id: '8k-test', title: '8K video test', url: 'https://www.youtube.com/watch?v=pD4S0JUZlVY', description: 'Testing the 8K video on my Samsung. Peak hardware nerd behaviour.', length: 'Camera test' },
];

export const youtubeId = (url) => {
  try {
    const u = new URL(url);
    return u.hostname.includes('youtu.be') ? u.pathname.slice(1) : u.searchParams.get('v');
  } catch {
    return null;
  }
};

// The now log, in Shuvam's own words. Update it whenever.
export const nowLog = [
  { label: 'Now', text: 'Refining research systems, documenting experiments and turning technical work into clearer public explanations, alongside my work, of course.' },
  { label: 'Next', text: 'Sleeping, and waiting for Dashain, Tihar and Chhath. Enjoying the waiting period too.' },
];
export const nowUpdated = 'Ashwin 2083 (October 2026)';

// Testimonials only render once they are approved with a real name.
export const testimonials = [
  { context: 'Industry systems', quote: 'Shuvam’s smart location-based option saved us and our retailers countless hours and brought clarity to a complex operational workflow.', source: 'United Lubricants', approved: false },
  { context: 'Research', quote: 'One of the most rigorous undergraduate researchers I have mentored.', source: 'SRM University', approved: false },
];

// Gallery captions. Photos without an entry simply show no caption.
export const photoCaptions = {
  '1000000448': 'Above the clouds at sunset, wing and engine in frame',
  '1000024316': 'EHang EH216-S, a two-seat eVTOL, up close',
  '1000095679': 'Boudhanath, lit up at night, from above',
  'img-1766-1': 'Swayambhunath and its prayer flags',
  'img-20260527-185937-774': 'Janaki Mandir, Janakpur, at sunset',
  '1000000914': 'A moon worth stopping for',
  '1000090016': 'Fairy lights and wooden beams',
  '1000120018': 'A pigeon, in black and white',
  '1000099923': 'Gerbera in full colour',
  '1000001128': 'A white rose',
  'img-20260129-144208885': 'Bougainvillea against a pale sky',
  'img-20260816-183220291-1': 'Hills after the rain',
  'img-20260802-123616882': 'A drive up into the clouds',
  '1000002070': 'Mackerel sky over still water',
  '1000000865': 'Balconies stacked to a point',
  '1000053322': 'Looking up an atrium',
  '1000053325': 'Floors of light',
  '1000052692': 'Floodlight through fog',
  '1000000798': 'A corridor of trees',
  '1000000944': 'Last light over the hills',
  '1000087749': 'Snow, lamps and a glowing gate',
  '1000087750': 'Snow on bare branches',
  '20210925-170434': 'A window seat over the hills',
};
