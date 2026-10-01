// Plain-English cards for every bit of jargon and every word from home.
// `art` picks a tiny animated diagram (see TermArt.jsx); `photo` uses one of
// the gallery photos instead.

export const glossary = {
  // ---- AI and systems ---------------------------------------------------
  rag: { term: 'RAG', full: 'Retrieval-augmented generation', kind: 'AI', art: 'rag', body: 'Before answering, the AI looks up relevant documents and writes its answer from them, so it can cite sources instead of guessing.' },
  llm: { term: 'LLM', full: 'Large language model', kind: 'AI', art: 'tokens', body: 'Software trained on huge amounts of text to understand and write language. ChatGPT, Llama and Mistral are LLMs.' },
  tokens: { term: 'Tokens', kind: 'AI', art: 'tokens', body: 'The word-pieces an LLM reads and writes. "Janakpur" might be two or three tokens. Every model has a limit on how many fit at once.' },
  'context-window': { term: 'Context window', kind: 'AI', art: 'window', body: 'How much text a model can keep in mind at once. Overfill it and the oldest details fall out.' },
  lora: { term: 'LoRA', full: 'Low-rank adaptation', kind: 'AI', art: 'lora', body: 'A lightweight way to teach a big model something new by training a tiny add-on instead of every weight.' },
  'federated-learning': { term: 'Federated learning', kind: 'AI', art: 'nodes', body: 'Many devices improve one shared model while their raw data never leaves home. Only what they learned is shared.' },
  'differential-privacy': { term: 'Differential privacy', kind: 'AI', art: 'noise', body: 'Carefully calibrated noise added to data or updates, so no single person can be picked out of the result.' },
  'secure-aggregation': { term: 'Secure aggregation', kind: 'AI', art: 'nodes', body: 'A way to add up everyone’s model updates so the server sees only the total, never an individual contribution.' },
  'vector-db': { term: 'Vector database', kind: 'AI', art: 'vectors', body: 'Stores the meaning of text, images or audio as lists of numbers, so similar things can be found fast.' },
  embedding: { term: 'Embedding', kind: 'AI', art: 'vectors', body: 'A list of numbers that captures what something means. Similar meanings land close together.' },
  'continual-learning': { term: 'Continual learning', kind: 'AI', art: 'curve', body: 'Teaching an AI new things over time without it forgetting the important old things.' },
  ebbinghaus: { term: 'Ebbinghaus forgetting curve', kind: 'AI', art: 'curve', body: 'Memory fades fast and then levels off, unless you revisit it. Each review makes it last longer. Measured in 1885 and still true.' },
  'knowledge-graph': { term: 'Knowledge graph', kind: 'AI', art: 'graph', body: 'Facts stored as connected things: "Sita" born-in "Janakpur" capital-of "Mithila". Machines can walk the links.' },
  hallucination: { term: 'Hallucination', kind: 'AI', art: 'verify', body: 'When an AI states something false with total confidence. The fix is grounding, checking and saying "I don’t know".' },
  'symbolic-ai': { term: 'Symbolic AI', kind: 'AI', art: 'symbols', body: 'AI that reasons with explicit symbols and rules instead of only learned numbers. Easier to inspect, often cheaper to run.' },
  whisper: { term: 'Whisper', kind: 'AI', art: 'wave', body: 'OpenAI’s speech-to-text model. It turns hours of video audio into searchable transcripts.' },
  ffmpeg: { term: 'FFmpeg', kind: 'Tool', art: 'wave', body: 'The Swiss Army knife for audio and video: cut, convert, extract. Half the internet’s video runs through it.' },
  'mongodb-atlas': { term: 'MongoDB Atlas', kind: 'Tool', art: 'vectors', body: 'MongoDB’s managed cloud database. You store data; they keep the servers running.' },
  xgboost: { term: 'XGBoost', kind: 'AI', art: 'trees', body: 'A fast machine-learning method that combines hundreds of small decision trees into one strong predictor.' },
  pbac: { term: 'PBAC', full: 'Policy-based access control', kind: 'Security', art: 'shield', body: 'Rules decide who can see which documents, checked at the moment of every query.' },
  'world-model': { term: 'World model', kind: 'AI', art: 'rover', body: 'An AI’s internal simulation of its surroundings, used to predict what happens next before acting.' },
  erp: { term: 'ERP', full: 'Enterprise resource planning', kind: 'Systems', art: 'erp', body: 'One system that runs a company’s sales, stock, accounts and people, instead of a dozen spreadsheets. Odoo is one.' },
  'computer-vision': { term: 'Computer vision', kind: 'AI', art: 'vision', body: 'Teaching computers to understand images and video: faces, hands, roads, obstacles.' },

  // ---- Aviation ---------------------------------------------------------
  evtol: { term: 'eVTOL', full: 'Electric vertical take-off and landing', kind: 'Aviation', photo: '1000024316', body: 'An electric aircraft that lifts off like a drone and flies like a small plane. Above: an EHang EH216-S I spotted.' },
  uam: { term: 'UAM', full: 'Urban air mobility', kind: 'Aviation', art: 'drone', body: 'Moving people and parcels through low-altitude city airspace: air taxis, delivery drones, medical flights.' },
  '4d-trajectory': { term: '4D trajectory', kind: 'Aviation', art: 'radar', body: 'A flight path described by latitude, longitude, altitude and time. The fourth dimension is when you’ll be there.' },
  vertiport: { term: 'Vertiport', kind: 'Aviation', art: 'drone', body: 'An airport for vertical take-off aircraft. Think rooftop helipad with chargers.' },
  waypoint: { term: 'Waypoint', kind: 'Aviation', art: 'radar', body: 'A named point in the sky that routes are built from. Real ones have five-letter names, so this site’s sections do too.' },

  // ---- Home: Janakpur, Mithila, Nepal ------------------------------------
  janakpur: { term: 'Janakpur Dham', kind: 'Place', photo: 'img-20260527-185937-774', body: 'Capital of Madhesh Province, about 225 km southeast of Kathmandu. Birthplace of Sita, the old heart of Mithila, and my hometown.' },
  sita: { term: 'Sita (Janaki)', kind: 'Culture', art: 'lotus', body: 'Daughter of King Janak, found in a furrow of a ploughed field, born in Janakpur. Janaki means "daughter of Janak".' },
  'janaki-mandir': { term: 'Janaki Mandir', kind: 'Place', photo: 'img-20260527-185937-774', body: 'Finished in 1910 and nicknamed Nau Lakha Mandir after its nine-lakh cost. Sixty rooms of white stone and marble.' },
  mithila: { term: 'Mithila', kind: 'Culture', art: 'fish', body: 'The cultural region spanning southeastern Nepal and northern Bihar, with its own language, script, food and painting.' },
  maithili: { term: 'Maithili', kind: 'Language', art: 'script', body: 'My mother tongue, the first language of Janakpur and one of the most spoken languages in Nepal.' },
  tirhuta: { term: 'Tirhuta', full: 'Mithilakshar', kind: 'Script', art: 'script', body: 'Maithili’s own traditional script. The glyph in my logo is "shu" from my name, written in it.' },
  'mithila-art': { term: 'Mithila painting', kind: 'Culture', art: 'fish', body: 'Bold double outlines, fish for luck, peacocks for love, lotus for purity. Painted by Maithil women on mud walls for centuries.' },
  'vivah-panchami': { term: 'Vivah Panchami', kind: 'Festival', art: 'lotus', body: 'The anniversary of Ram and Sita’s wedding, re-enacted in Janakpur every Mangsir.' },
  chhath: { term: 'Chhath', kind: 'Festival', art: 'sun', body: 'Four days of offerings to the sun, made standing in ponds and rivers at sunset and sunrise. The biggest festival back home.' },
  dashain: { term: 'Dashain', kind: 'Festival', art: 'kite', body: 'Nepal’s longest festival: fifteen days of family, red tika, jamara, feasts and kites.' },
  tihar: { term: 'Tihar', kind: 'Festival', art: 'diyo', body: 'Five days of lights that honour crows, dogs and cows, then Laxmi Puja and Bhai Tika between siblings.' },
  'bikram-sambat': { term: 'Bikram Sambat', kind: 'Calendar', art: 'calendar', body: 'Nepal’s official calendar, about 56 years and 8 months ahead of the Gregorian one. The new year starts in mid-April.' },
  npt: { term: 'Nepal Time', full: 'UTC+5:45', kind: 'Time', art: 'clock', body: 'Nepal sets its clocks 5 hours 45 minutes ahead of UTC, one of the few 45-minute offsets in the world.' },
  ritu: { term: 'Ritu', kind: 'Calendar', art: 'seasons', body: 'Nepal’s six seasons: Basanta, Grishma, Barsha, Sharad, Hemanta and Shishir. Four is not enough for this country.' },
  lokta: { term: 'Lokta paper', kind: 'Craft', art: 'paper', body: 'Handmade Nepali paper from the bark of the lokta shrub. The daytime background of this site is its colour.' },
  'prayer-wheel': { term: 'Prayer wheel', kind: 'Culture', photo: '1000095679', body: 'A cylinder carrying a mantra. Spinning it clockwise, as at Boudhanath, is said to equal reciting the prayer.' },
  'lali-gurans': { term: 'Lali gurans', kind: 'Nature', art: 'flower', body: 'Rhododendron, Nepal’s national flower. In spring it turns whole hillsides red.' },
  everest: { term: 'Sagarmatha', full: 'Mount Everest', kind: 'Place', art: 'mountain', body: '8,848.86 m, as measured jointly by Nepal and China in 2020. The tallest point on Earth sits on Nepal’s border.' },
  pranam: { term: 'प्रणाम', full: 'Pranam', kind: 'Maithili', art: 'script', body: 'How you greet someone respectfully in Maithili, usually with folded hands.' },
  namaste: { term: 'नमस्ते', full: 'Namaste', kind: 'Nepali', art: 'script', body: 'Nepali for hello, and goodbye, and thank you for coming. Literally: I bow to you.' },

  // ---- Sky ---------------------------------------------------------------
  kanya: { term: 'Kanya rashi', kind: 'Jyotish', art: 'stars', body: 'Virgo in Hindu astrology. Rashi comes from the kundali, not just the birthday, which is why my Western sign is no help here.' },
  budh: { term: 'Budh', full: 'Mercury', kind: 'Jyotish', art: 'planet', body: 'The ruling planet of Kanya. In jyotish it governs intellect, speech and communication. That explains the yapping.' },
  chitra: { term: 'Chitra', full: 'Spica', kind: 'Sky', art: 'stars', body: 'The brightest star in Virgo, about 250 light-years away. In jyotish it anchors the Chitra nakshatra.' },
};

export const getTerm = (id) => glossary[id];
