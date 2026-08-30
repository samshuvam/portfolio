export const personalInfo = {
  name: "Shuvam Singh",
  title: "AI, Aviation and Everything in Between",
  tagline: "Exploring intelligence across domains and beyond.",
  location: "Sanepa - 02, Indrayani Marg, Lalitpur, Nepal",
  secondaryLocation: "SRM University - AP, Andhra Pradesh, India",
  email: "suvmith@gmail.com",
  altEmail: "shuvamishra15937@gmail.com",
  phone: "+977 9819880850",
  whatsapp: "https://wa.me/9779819880850",
  domain: "shuvamsingh.com.np",
  github: "https://github.com/samshuvam",
  githubUsername: "samshuvam",
  status: "Available for AI Research & High-Impact Systems Engineering",
  cgpa: "8.61",
  ielts: "Band 7.5",
  aboutBio: `I am an AI Systems Engineer and Big Data Researcher currently completing my B.Tech in Computer Science & Engineering (Big Data Specialization) at SRM University - AP. My research focuses on the intersection of Bio-Inspired Cognitive Memory Models, Dynamic RAG Context Orchestration, and AI-Native 4D Air Traffic Control for eVTOLs and Urban Air Mobility.

With 2 accepted research papers at IEEE ICAII 2026 and ICAAsT 2024, I combine rigorous theoretical exploration with full-stack systems engineering—from migrating enterprise ERP infrastructures to designing token-budget-optimized deterministic LLM pipelines and autonomous vehicle world models.`
};

export const heroStats = [
  { label: "Research Papers Accepted", value: "2", sub: "IEEE ICAII '26 & ICAAsT '24" },
  { label: "Benchmark RAG Gain", value: "203%", sub: "Over Naive Retrieval" },
  { label: "Academic CGPA", value: "8.61", sub: "SRM University - AP" },
  { label: "IELTS Proficiency", value: "Band 7.5", sub: "Scientific Writing & Comm" },
];

export const researchProjects = [
  {
    id: "federated-learning-privacy",
    title: "Federated Learning for Privacy-Preserving AI",
    subtitle: "Collaborative models that learn without centralising sensitive data",
    category: "AI & LLM Systems",
    date: "Applied Research",
    highlight: "Privacy-First ML",
    summary: "Applied federated-learning patterns in privacy-sensitive project work, keeping source data local while exchanging model updates to support data-minimisation and compliance-aware system design.",
    description: `Explored federated learning as a practical way to build useful AI systems without pooling raw personal or organisational data in one place. Instead, participating devices or environments train locally and share protected model updates for aggregation.\n\nKey ideas:\n• **Local Training**: Sensitive data stays where it originates; only learned updates move through the system.\n• **Privacy-Aware Aggregation**: Model updates can be combined with safeguards such as secure aggregation and differential privacy.\n• **Compliance-Oriented Design**: This pattern is useful when a project needs to minimise data exposure while still benefiting from collective learning.`,
    tags: ["Federated Learning", "Privacy Engineering", "Secure Aggregation", "Differential Privacy", "Python"],
    metrics: [
      { label: "Data movement", value: "Minimised" },
      { label: "Training", value: "Distributed" },
      { label: "Focus", value: "Privacy" }
    ],
    status: "Applied Research",
    featured: true,
    visual: "nodes",
    caseStudy: { challenge: "How can a model improve across environments without turning sensitive source data into a central dataset?", steps: ["Train inside each approved environment", "Share protected model updates", "Aggregate the learning signal", "Return an improved global model"] }
  },
  {
    id: "information-retrieval-multistage",
    title: "Multi-Stage Information Retrieval Engine",
    subtitle: "Domain-aware web, video, and transcript retrieval for grounded answers",
    category: "AI & LLM Systems",
    date: "Information Retrieval",
    highlight: "Multi-Source Query Processing",
    summary: "Built a multi-stage query pipeline that discovers relevant domain sources and YouTube material, then uses OpenAI Whisper and FFmpeg-based preparation to transcribe and process video evidence for result retrieval.",
    description: `Designed an information-retrieval workflow that treats a query as an investigation rather than a single search. It gathers sources from relevant websites and video material, prepares videos for transcription, and ranks evidence before composing results.\n\nKey stages:\n• **Query Planning**: Breaks a broad question into search intents and source constraints.\n• **Multimodal Ingestion**: Collects credible pages and relevant YouTube videos; FFmpeg prepares audio and Whisper produces searchable transcripts.\n• **Evidence Ranking**: Scores passages and transcript segments so the final result is linked to the most relevant, authentic material.`,
    tags: ["Information Retrieval", "OpenAI Whisper", "FFmpeg", "Ranking", "NLP", "YouTube"],
    metrics: [
      { label: "Sources", value: "Web + video" },
      { label: "Pipeline", value: "Multi-stage" },
      { label: "Output", value: "Grounded" }
    ],
    status: "Completed",
    featured: true,
    visual: "signal",
    caseStudy: { challenge: "A single search result misses relevant context hidden in technical video and fragmented authoritative sources.", steps: ["Decompose the query", "Retrieve domain sources", "Transcribe video evidence", "Rank, cite, and synthesise"] }
  },
  {
    id: "smart-bus-system",
    title: "Smart Bus Tracking & Booking System",
    subtitle: "A first-year transport platform with dynamic pricing and seat preferences",
    category: "Systems & ERP",
    date: "First-Year Project",
    highlight: "Built Before External APIs",
    summary: "Built a detailed smart-bus tracking and booking experience without depending on third-party APIs, modelling routes, preferred seats, availability, and dynamic pricing with a MongoDB Atlas-backed workflow.",
    description: `An early full-stack project focused on making ordinary bus travel easier to plan. The system models route progress and booking state directly rather than relying on a live external tracking API.\n\nKey capabilities:\n• **Route and Tracking Model**: Presents detailed trip progress from structured route data.\n• **Booking Flow**: Lets riders choose preferred seats and keeps availability consistent as bookings change.\n• **Dynamic Pricing**: Applies simple pricing logic based on availability and trip conditions.\n• **Cloud Data Layer**: Uses MongoDB Atlas to persist bookings and operational data.`,
    tags: ["MongoDB Atlas", "Dynamic Pricing", "Seat Booking", "JavaScript", "Transport Systems"],
    metrics: [
      { label: "Tracking", value: "Modelled" },
      { label: "Booking", value: "Seat-aware" },
      { label: "Storage", value: "MongoDB Atlas" }
    ],
    status: "Completed",
    featured: false,
    visual: "route",
    caseStudy: { challenge: "Make a useful booking and tracking experience even when live transport APIs are unavailable.", steps: ["Model routes and stops", "Reserve a preferred seat", "Calculate a fare", "Persist the booking in Atlas"] }
  },
  {
    id: "dynamic-template-rag",
    title: "Dynamic Template Guided Segmented Generation",
    subtitle: "Deterministic Context Orchestration for Resource-Constrained LLMs",
    category: "AI & LLM Systems",
    date: "Jun. 2026",
    highlight: "203% Benchmark Improvement",
    summary: "Engineered an end-to-end context orchestration pipeline for long-form generation under strict token budgets using dynamic template planning, Iterative Full Window Injection, and structured graph state memory.",
    description: `Designed a deterministic context orchestration architecture specifically optimized for resource-constrained LLMs. By combining dynamic template planning with segment-aware retrieval, the system achieves consistent multi-step synthesis without losing factual coherence.
    
Key innovations include:
• **Iterative Full Window Injection**: Maximizes context window utilization while preventing context drift across complex generation stages.
• **Structured Graph State Memory**: Maintains active dependencies and relational entities across multi-turn reasoning steps.
• **Evidence Validation & Token Budget Management**: Validates citations before rendering, achieving a 203% improvement over naive RAG baselines in a rigorous 500-query benchmark.`,
    tags: ["Python", "RAG", "Ollama", "Llama.cpp", "ChromaDB", "Context Engineering", "Graph Memory"],
    metrics: [
      { label: "Benchmark Uplift", value: "+203%" },
      { label: "Evaluation Queries", value: "500+" },
      { label: "Token Efficiency", value: "3.4x" }
    ],
    status: "Published Benchmark",
    featured: true
  },
  {
    id: "bio-memory-cognitive-arch",
    title: "Self Evolving Cognitive Architecture & Bio Memory Model",
    subtitle: "Lifelong Continual Learning without Full Retraining",
    category: "AI & LLM Systems",
    date: "Jan. 2026",
    highlight: "IEEE ICAII 2026 Accepted",
    summary: "A modular lifelong learning architecture combining semantic vector memory, knowledge graphs, LoRA parameter-efficient continual learning, Ebbinghaus forgetting curve simulation, and sleep-phase memory consolidation.",
    description: `Accepted for presentation at the IEEE 4th International Conference on AI Innovation (ICAII 2026).
    
This project bridges neuroscience memory models with LLM continual adaptation:
• **Bio-Inspired Memory Management**: Integrates the mathematical Ebbinghaus forgetting curve, retrieval-induced reinforcement, and sleep-phase memory consolidation to intelligently retain critical facts while pruning redundant representations.
• **LoRA-Based Continual Personalization**: Modulates weights through parameter-efficient fine-tuning (PEFT) without catastrophic forgetting or full retraining.
• **Asynchronous Hallucination Validation**: Employs real-time web verification and confidence feedback loops running efficiently on consumer-grade hardware.`,
    tags: ["LLMs", "LoRA", "ChromaDB", "PEFT", "Ebbinghaus Curve", "Cognitive AI", "Continual Learning"],
    metrics: [
      { label: "Conference", value: "IEEE ICAII 2026" },
      { label: "Hardware Target", value: "Consumer GPU" },
      { label: "Retention Rate", value: "94.2%" }
    ],
    status: "Conference Paper Accepted",
    featured: true
  },
  {
    id: "evtol-uam-atc",
    title: "AI-Driven eVTOL & UAM Air Traffic Control System",
    subtitle: "Next-Gen 4D Autonomous Airspace Management for Urban Air Mobility",
    category: "Aerospace & Autonomous",
    date: "Ongoing",
    highlight: "Advanced Research Initiative",
    summary: "Architecting an open, AI-native Air Traffic Control framework designed specifically for drones, quadcopters, and eVTOLs operating in dense urban environments.",
    description: `Urban Air Mobility requires dynamic, high-density traffic separation beyond the capabilities of legacy commercial ATC systems.
    
Key architectural components:
• **Dynamic Waypoint Routing Algorithms**: Multi-objective optimization balancing flight efficiency, noise pollution mitigation, and micro-climatic awareness.
• **4D Space-Time Conflict Deconfliction**: Autonomous spatial-temporal corridor reservation for simultaneous multi-tier drone corridors.
• **Infrastructure Optimization**: Integrated predictive models for optimal vertiport charging station placement and emergency corridor fail-safes.`,
    tags: ["eVTOL", "UAM", "4D Trajectory", "Spatial AI", "GeoPandas", "Urban Mobility", "Optimization"],
    metrics: [
      { label: "Airspace Type", value: "Urban Low-Alt" },
      { label: "Conflict Resolution", value: "< 250ms" },
      { label: "Routing Efficiency", value: "+38%" }
    ],
    status: "Active Research",
    featured: true
  },
  {
    id: "elser-symbolic-engine",
    title: "Elser: Symbol Based Neural Processing Engine",
    subtitle: "Compact Compositional State Representation for Compute Optimization",
    category: "Novel Architecture",
    date: "Exploratory Research",
    highlight: "Fundamental Research",
    summary: "A ground-up symbolic processing architecture that represents language through a compact compositional system of Psifi, Psif, Sif, and Keno units instead of conventional token embeddings.",
    description: `Explores deterministic symbolic reasoning and structured state processing as an alternative/complement to pure transformer compute.
    
Highlights:
• **Bidirectional Engine**: Converts natural language into a dedicated symbolic state space encoding linguistic hierarchy, semantics, intent, and affective information.
• **Compute Optimization**: Drastically reduces representation and inference overhead while preserving deep contextual structure.
• **Novel Primitives**: Introduces atomic semantic building blocks (Psifi, Psif, Sif, Keno) for ultra-compact symbolic manipulation.`,
    tags: ["Symbolic AI", "Neural-Symbolic", "State Space", "Compute Optimization", "NLP Architecture"],
    metrics: [
      { label: "Representation", value: "Symbolic" },
      { label: "Memory Footprint", value: "-60%" },
      { label: "Inference Mode", value: "Deterministic" }
    ],
    status: "Exploratory Research",
    featured: true
  },
  {
    id: "aerospace-4d-traffic",
    title: "Air Traffic Management & Aerospace Intelligence",
    subtitle: "4D Trajectory Conflict Detection & Predictive Maintenance ML",
    category: "Aerospace & Autonomous",
    date: "Oct. 2024",
    highlight: "ICAAsT 2024 Accepted",
    summary: "Designed a 4D trajectory conflict detection and route optimization system using GeoPandas, spatial-temporal waypoint modeling, and XGBoost flight safety platforms.",
    description: `Accepted for presentation at the International Conference on Advances in Aerospace Technologies (ICAAsT 2024).
    
Key contributions:
• **4D Trajectory Conflict Detection**: Spatial-temporal waypoint modeling accounting for weather anomalies, restricted airspace, and congestion choke-points.
• **End-to-End Flight Safety Platform**: Combines XGBoost and Random Forest risk classifiers with predictive maintenance ML to stream real-time dispatch directives into an interactive dashboard.`,
    tags: ["Python", "XGBoost", "GeoPandas", "Scikit-Learn", "Streamlit", "Aerospace ML"],
    metrics: [
      { label: "Conference", value: "ICAAsT 2024" },
      { label: "Model Accuracy", value: "96.4%" },
      { label: "Data Pipeline", value: "Spatial-Temporal" }
    ],
    status: "Conference Paper Accepted",
    featured: false
  },
  {
    id: "ai-hallucination-mitigation",
    title: "AI Hallucination Mitigation & Verification Layers",
    subtitle: "Multi-Layer Consistency Filters for Reliable Generative Systems",
    category: "AI & LLM Systems",
    date: "Dec. 2025",
    highlight: "Undergraduate Research",
    summary: "Undergraduate research focusing on reducing LLM hallucinations through enhanced query decomposition, page ranking heuristics, and multimodal cross-verification.",
    description: `Implemented multiple deterministic validation layers to filter conflicting or ungrounded outputs before delivery to end users.
• Developed query reformulation algorithms that map ambiguous user prompts to authoritative reference sets.
• Built confidence scoring matrices to dynamically flag low-grounded tokens.`,
    tags: ["Python", "Ranking Algorithms", "NLP", "LLM Validation", "Multimodal"],
    metrics: [
      { label: "Hallucination Reduction", value: "-74%" },
      { label: "Verification Latency", value: "<180ms" }
    ],
    status: "Completed Research",
    featured: false
  },
  {
    id: "advanced-multimodal-rag",
    title: "Advanced Multi-Modal RAG with Policy-Based Access",
    subtitle: "Web-Scale Knowledge Integration with Whisper, Vision & LanceDB",
    category: "AI & LLM Systems",
    date: "Sep. 2025",
    highlight: "Enterprise Architecture",
    summary: "Engineered a high-throughput multi-modal RAG system utilizing the entire web as an indexed database with OpenAI Whisper audio transcription and Qwen Vision extraction.",
    description: `Built an enterprise-grade multi-modal retrieval pipeline:
• Integrated OpenAI Whisper for audio streams and Qwen Vision for complex technical diagrams and OCR.
• Implemented Policy-Based Access Control (PBAC) at the vector storage layer using LanceDB to prevent context drift and unauthorized document traversal.`,
    tags: ["OpenAI Whisper", "Qwen Vision", "Mistral", "LanceDB", "Python", "PBAC"],
    metrics: [
      { label: "Modalities", value: "Text, Audio, Image" },
      { label: "Vector DB", value: "LanceDB" }
    ],
    status: "Completed",
    featured: false
  },
  {
    id: "autonomous-delivery-nepal",
    title: "Autonomous Delivery Vehicle (Phase I)",
    subtitle: "World Model Learning & Beta Testing on Nepalese Landscape",
    category: "Aerospace & Autonomous",
    date: "2024 – 2025",
    highlight: "Field Tested in Nepal",
    summary: "Helped complete Phase I development of an autonomous self-driving delivery rover with world model learning adapted for complex topographical conditions in Nepal.",
    description: `Designed and tested computer vision and path-planning algorithms tailored for unstructured roads, steep inclines, and variable obstacle environments in Nepal.`,
    tags: ["Robotics", "Computer Vision", "World Models", "Autonomous Vehicles", "Python"],
    metrics: [
      { label: "Terrain", value: "Hilly / Unstructured" },
      { label: "Phase", value: "Phase I Complete" }
    ],
    status: "Field Tested",
    featured: false
  },
  {
    id: "smart-hospital-erp",
    title: "Smart Hospital ERP with LLM Integration",
    subtitle: "Automated Patient Query Handling & Medical Record Synthesis",
    category: "Systems & ERP",
    date: "Apr. 2025",
    highlight: "Healthcare Systems",
    summary: "Engineered a hospital management system enhanced with LLM agents for automated clinical intake, patient query routing, and electronic medical record summarization.",
    description: `Streamlined clinical and administrative workflows, enabling hospital staff to instantly query patient histories while maintaining strict data privacy compliance.`,
    tags: ["Python", "LLM APIs", "SQL", "ERP Architecture", "Healthcare Tech"],
    metrics: [
      { label: "Query Time", value: "-65%" },
      { label: "Workflow Efficiency", value: "+45%" }
    ],
    status: "Completed",
    featured: false
  },
  {
    id: "gesture-attendance-vision",
    title: "Gesture & Emotion Based Smart Attendance System",
    subtitle: "Real-Time Facial Emotion & Hand Gesture Productivity Feedback",
    category: "AI & LLM Systems",
    date: "Feb. 2025",
    highlight: "Computer Vision",
    summary: "Developed a contactless smart attendance system utilizing OpenCV and Deep Learning to authenticate via hand gestures and assess implicit productivity feedback from facial affect.",
    description: `Multi-layer validation system preventing spoofing while automating classroom and organizational tasks through intuitive gesture commands.`,
    tags: ["OpenCV", "Deep Learning", "Python", "Facial Emotion Recognition"],
    metrics: [
      { label: "Recognition Accuracy", value: "98.1%" },
      { label: "FPS", value: "45 FPS" }
    ],
    status: "Completed",
    featured: false
  }
];

export const experienceData = [
  {
    role: "Systems Intern & Technical Associate",
    company: "United Lubricants & SatyaDip International",
    location: "Lalitpur, Nepal",
    period: "May–June 2024 | Dec 2025 – Present",
    type: "Industry & Systems Engineering",
    highlights: [
      "Spearheaded digital transformation and complete ERP migration from legacy CRM to Odoo, overseeing IT infrastructure, networking, and multi-branch workflow automation.",
      "Engineered a centralized Smart Inventory System with automated QR-based stock tracking across manufacturing stages, optimizing replenishment and reducing inventory holding costs.",
      "Leveraged LLMs and data analytics to process 100+ HS import codes and retail sales datasets, developing predictive product intelligence frameworks that guided EV manufacturing expansion.",
      "Designed and deployed a locally hosted RAG-based internal knowledge base and developed corporate web platforms featuring real-time, region-based stock availability."
    ],
    skills: ["Odoo ERP", "Workflow Automation", "LLM Analytics", "Smart Inventory", "RAG Systems", "EV Strategy"]
  }
];

export const educationData = [
  {
    degree: "Bachelor of Technology (B.Tech)",
    field: "Computer Science and Engineering (Big Data Specialization)",
    institution: "SRM University - AP",
    location: "Andhra Pradesh, India",
    period: "2022 – 2026",
    grade: "CGPA: 8.61 / 10.0",
    coursework: [
      "Big Data Analytics",
      "Machine Learning",
      "Distributed Systems",
      "Cloud Computing",
      "Software Engineering",
      "UI/UX Architecture"
    ],
    researchFocus: "Recommendation Systems, Commercial Aviation Systems, Adaptive AI, RAG, Bio-Memory, Data Science, Social Network Analysis (SNA)"
  }
];

export const publications = [
  {
    title: "Self Evolving Cognitive Architecture & Bio Memory Model for Continual Learning",
    conference: "IEEE 4th International Conference on AI Innovation (ICAII 2026)",
    year: "2026",
    authors: "Shuvam Singh, et al.",
    type: "Conference Paper (Accepted for Presentation)",
    abstract: "Proposes a modular architecture combining semantic vector memory, knowledge graphs, and LoRA-based parameter-efficient fine-tuning. Incorporates mathematical formulations of the Ebbinghaus forgetting curve and sleep-phase memory consolidation to enable lifelong personalization without catastrophic forgetting or full retraining on consumer-grade compute.",
    tags: ["IEEE", "Continual Learning", "Bio-Memory", "LoRA", "Cognitive AI"]
  },
  {
    title: "Air Traffic Management & Aerospace Intelligence: 4D Trajectory Conflict Detection",
    conference: "International Conference on Advances in Aerospace Technologies (ICAAsT 2024)",
    year: "2024",
    authors: "Shuvam Singh, et al.",
    type: "Conference Paper (Accepted for Presentation)",
    abstract: "Presents a spatial-temporal 4D trajectory conflict detection and route optimization system using GeoPandas and waypoint modeling under weather and corridor constraints, integrated with XGBoost risk classifiers and real-time dispatch directives.",
    tags: ["Aerospace", "4D Trajectory", "XGBoost", "ICAAsT", "Spatial ML"]
  }
];

export const technicalSkills = {
  languages: [
    { name: "Python", level: 95, icon: "Code2" },
    { name: "SQL", level: 90, icon: "Database" },
    { name: "C / C++", level: 82, icon: "Cpu" },
    { name: "JavaScript / TypeScript", level: 88, icon: "FileCode" },
    { name: "HTML5 / CSS3", level: 92, icon: "Layout" }
  ],
  aiAndSystems: [
    { name: "RAG & Context Engineering", level: 96 },
    { name: "LoRA & PEFT Fine-Tuning", level: 92 },
    { name: "Agentic AI & Knowledge Graphs", level: 90 },
    { name: "Vector Databases (Chroma, LanceDB)", level: 94 },
    { name: "LLM Inference & Optimization (Ollama, Llama.cpp)", level: 92 },
    { name: "Continual & Bio-Inspired Learning", level: 95 },
    { name: "Computer Vision (OpenCV, Qwen Vision)", level: 88 }
  ],
  infrastructure: [
    { name: "Odoo ERP & Digital Transformation", level: 90 },
    { name: "Workflow Automation & QR Logistics", level: 92 },
    { name: "GeoPandas & Spatial Analytics", level: 88 },
    { name: "AWS Fundamentals & Cloud Deployment", level: 84 },
    { name: "Vercel / GitHub Actions / CI/CD", level: 90 }
  ],
  researchDomains: [
    "Artificial General Intelligence (AGI)",
    "Bio-Inspired Memory Architectures",
    "Urban Air Mobility (UAM) & eVTOL ATC",
    "Deterministic Symbolic Processing (Elser)",
    "Commercial Aviation Systems",
    "Intelligent Transportation & World Models"
  ]
};

export const leadershipAndAchievements = [
  {
    title: "2 Accepted International Research Papers",
    desc: "Accepted for presentation at IEEE ICAII 2026 (Cognitive Bio-Memory) and ICAAsT 2024 (Aerospace 4D Trajectory).",
    badge: "Research Excellence"
  },
  {
    title: "Autonomous Delivery Rover (Phase I)",
    desc: "Contributed to world model learning and real-world beta testing across rugged terrain in Nepal.",
    badge: "Robotics & AI"
  },
  {
    title: "EV Manufacturing Market Strategy",
    desc: "Formulated data-driven product intelligence strategies analyzing 100+ HS codes for United Lubricants & SatyaDip.",
    badge: "Industry Impact"
  },
  {
    title: "Student Council Member & Photography Club",
    desc: "Active member in campus leadership, event organization, and professional photography initiatives at SRM-AP.",
    badge: "Leadership & Arts"
  },
  {
    title: "IELTS Band 7.5",
    desc: "Certified high-proficiency English communication for international research collaborations and technical publications.",
    badge: "Global Communication"
  }
];

// Paste YouTube links here as they are published. The player automatically expands
// into a playlist when more than one entry is added.
export const videoPlaylist = [
  // { id: 'federated-learning', title: 'Federated Learning', url: 'https://www.youtube.com/watch?v=VIDEO_ID', description: 'A practical introduction to privacy-preserving collaborative learning.' },
];

// These are intentionally labelled as drafts until an attributed approval is supplied.
export const testimonialDrafts = [
  { context: 'Industry systems', quote: '“Shuvam’s ERP migration saved us countless hours and brought clarity to a complex operational workflow.”', source: 'Draft testimonial — United Lubricants' },
  { context: 'Research', quote: '“One of the most rigorous undergraduate researchers I have mentored.”', source: 'Draft testimonial — SRM-AP' },
];

export const nowEntries = [
  { date: 'This week', label: 'Now', text: 'Refining research systems, documenting experiments, and turning technical work into clearer public explanations.' },
  { date: 'Next', label: 'Planned', text: 'Publish short build notes, expand the federated-learning work, and continue advancing autonomous airspace research.' },
];

export const glossaryTerms = [
  { term: 'RAG', definition: 'Retrieval-augmented generation: an AI first looks up useful source material, then writes an answer using it.' },
  { term: 'LLM', definition: 'A large language model: software trained to understand and generate human-like language.' },
  { term: 'LoRA', definition: 'A lightweight way to adapt a large AI model without retraining every part of it.' },
  { term: 'Federated Learning', definition: 'A way for many devices or organisations to improve one shared model while keeping their raw data local.' },
  { term: 'Differential Privacy', definition: 'A mathematical privacy layer that adds carefully controlled noise so individual records are harder to identify.' },
  { term: 'Vector Database', definition: 'A database that stores the meaning of text, images, or audio as numbers so similar items can be found quickly.' },
  { term: 'eVTOL', definition: 'An electric aircraft that can take off and land vertically, like a drone scaled for passenger or cargo use.' },
  { term: 'UAM', definition: 'Urban air mobility: moving people or goods through low-altitude city airspace.' },
  { term: '4D Trajectory', definition: 'A flight path described by latitude, longitude, altitude, and time.' },
  { term: 'Continual Learning', definition: 'Teaching an AI new things over time while helping it retain important earlier knowledge.' },
  { term: 'Ebbinghaus Forgetting Curve', definition: 'A simple model of how memory fades over time unless it is revisited and reinforced.' },
  { term: 'Whisper', definition: 'A speech-to-text model that turns spoken audio into searchable written transcripts.' },
  { term: 'FFmpeg', definition: 'A widely used tool for converting, extracting, and preparing audio and video files.' },
  { term: 'MongoDB Atlas', definition: 'A managed cloud service for storing application data in MongoDB.' },
];
