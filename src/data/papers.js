export const papers = [
  {
    id: 'icaii-2026',
    title: 'Self-Evolving Cognitive Architecture and Bio-Memory Model for Continual Learning',
    venue: 'IEEE 4th International Conference on AI Innovation',
    venueShort: 'IEEE ICAII 2026',
    year: 2026,
    status: 'Accepted for presentation',
    authors: 'Shuvam Singh, et al.',
    affiliation: 'SRM University, India',
    abstract:
      'We propose a modular architecture that combines semantic vector memory, knowledge graphs and LoRA-based parameter-efficient fine-tuning. It incorporates mathematical formulations of the Ebbinghaus forgetting curve and sleep-phase memory consolidation, enabling lifelong personalisation without catastrophic forgetting or full retraining on consumer-grade compute.',
    plain:
      'AI assistants forget you, or they have to be retrained to remember you. This paper gives them a memory that works more like ours: important things get reinforced, unimportant things fade, and "sleep" tidies it all up, cheaply enough to run on a normal gaming GPU.',
    keywords: ['Continual learning', 'Bio-memory', 'LoRA', 'Knowledge graphs', 'Cognitive AI'],
    projectId: 'bio-memory',
    bibKey: 'singh2026bioMemory',
  },
  {
    id: 'icaast-2024',
    title: 'Air Traffic Management and Aerospace Intelligence: 4D Trajectory Conflict Detection',
    venue: 'International Conference on Advances in Aerospace Technologies',
    venueShort: 'ICAAsT 2024',
    year: 2024,
    status: 'Accepted for presentation',
    authors: 'Shuvam Singh, et al.',
    affiliation: 'SRM University, India',
    abstract:
      'We present a spatio-temporal 4D trajectory conflict detection and route optimisation system using GeoPandas and waypoint modelling under weather, congestion and restricted-corridor constraints, integrated with XGBoost risk classifiers and real-time dispatch directives.',
    plain:
      'Planes are described by where they are and when. This system checks every flight’s future path in space and time, spots where two will get too close, and suggests safer routes, while machine learning keeps an eye on risk.',
    keywords: ['Aerospace', '4D trajectory', 'XGBoost', 'Spatial ML', 'Air traffic management'],
    projectId: 'air-traffic-intelligence',
    bibKey: 'singh2024atm',
  },
];

export const bibtex = (p) => `@inproceedings{${p.bibKey},
  author    = {${p.authors.replace(', et al.', ' and others')}},
  title     = {${p.title}},
  booktitle = {${p.venue} (${p.venueShort})},
  year      = {${p.year}},
  note      = {${p.status}}
}`;
