export const personalInfo = {
  name: "Shuvam Singh",
  title: "AI Systems Architect & Big Data Engineer",
  tagline: "Pioneering Adaptive Bio-Memory Architectures, Dynamic RAG Orchestration & Autonomous Aerospace Systems",
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
