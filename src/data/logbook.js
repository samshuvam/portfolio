// Experience and education, logged the way a pilot logs flights.

export const logbook = [
  {
    id: 'satyadip',
    date: 'May - Jun 2024, Dec 2025 - Now',
    aircraft: 'Systems Intern, then Technical Associate',
    route: 'United Lubricants & SatyaDip International',
    place: 'Lalitpur, Nepal',
    hours: 'Current',
    kind: 'work',
    remarks: [
      'Digital transformation and the full ERP migration from a legacy CRM to Odoo, plus IT infrastructure, networking and workflow automation across multi-branch operations.',
      'A centralised smart inventory system with QR stock tracking across manufacturing stages, bridging the factory floor and the books.',
      'LLM and data analytics over 100+ HS import codes and retail sales data, building product intelligence that guided EV manufacturing expansion and sourcing.',
      'A locally hosted RAG knowledge base for internal documents, and company web platforms with real-time, region-based stock availability and AI-generated marketing assets.',
    ],
    skills: ['Odoo ERP', 'Workflow automation', 'LLM analytics', 'Smart inventory', 'RAG systems', 'EV strategy'],
  },
  {
    id: 'srm',
    date: '2022 - 2026',
    aircraft: 'B.Tech, Computer Science and Engineering',
    route: 'SRM University (Big Data specialisation)',
    place: ', India',
    hours: 'CGPA 8.61',
    kind: 'study',
    remarks: [
      'Coursework: Big Data Analytics, Machine Learning, Distributed Systems, Cloud Computing, Software Engineering, UI.',
      'Research interests: recommendation systems, commercial aviation systems, adaptive AI, RAG, bio-memory, data science and social network analysis.',
    ],
    skills: ['Big data', 'Machine learning', 'Distributed systems', 'Cloud'],
  },
];

export const leadership = [
  { title: 'Two accepted international papers', text: 'IEEE ICAII 2026 (cognitive bio-memory) and ICAAsT 2024 (4D trajectories).' },
  { title: 'Autonomous delivery rover, Phase I', text: 'World-model learning and real-world beta testing on Nepal’s terrain.' },
  { title: 'EV manufacturing strategy', text: 'Data-driven product intelligence from HS import codes that shaped EV expansion and sourcing.' },
  { title: 'Student Council and Photography Club', text: 'Campus leadership at SRM, event organising, and volunteering at several large events.' },
  { title: 'IELTS band 7.5', text: 'For international research collaboration, scientific writing and presenting.' },
];

// Skills as type ratings. Captain = flies it daily, First officer = solid,
// Type rated = qualified and current.
export const typeRatings = [
  {
    group: 'Languages',
    items: [
      { name: 'Python', level: 'Captain' },
      { name: 'C / C++', level: 'First officer' },
      { name: 'SQL', level: 'First officer' },
      { name: 'JavaScript / TypeScript', level: 'Type rated' },
      { name: 'HTML / CSS', level: 'Type rated' },
    ],
  },
  {
    group: 'AI and LLM systems',
    items: [
      { name: 'RAG and context engineering', level: 'Captain', term: 'rag' },
      { name: 'Continual and bio-inspired learning', level: 'Captain', term: 'continual-learning' },
      { name: 'Vector databases (Chroma, LanceDB)', level: 'Captain', term: 'vector-db' },
      { name: 'LoRA and PEFT fine-tuning', level: 'Captain', term: 'lora' },
      { name: 'LLM inference (Ollama, llama.cpp)', level: 'Captain', term: 'llm' },
      { name: 'Agentic AI and knowledge graphs', level: 'Captain', term: 'knowledge-graph' },
      { name: 'Computer vision (OpenCV, Qwen Vision)', level: 'First officer', term: 'computer-vision' },
    ],
  },
  {
    group: 'Systems',
    items: [
      { name: 'Workflow automation and QR logistics', level: 'Captain' },
      { name: 'Odoo ERP and digital transformation', level: 'Captain', term: 'erp' },
      { name: 'CI/CD (GitHub Actions, Vercel)', level: 'Captain' },
      { name: 'GeoPandas and spatial analytics', level: 'First officer' },
      { name: 'AWS fundamentals', level: 'First officer' },
    ],
  },
];

export const researchDomains = [
  'Artificial general intelligence',
  'Bio-inspired memory architectures',
  'Urban air mobility and eVTOL ATC',
  'Deterministic symbolic processing',
  'Commercial aviation systems',
  'Edge AI',
  'Intelligent transportation and world models',
];
