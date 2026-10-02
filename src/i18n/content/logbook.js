// Nepali (ne) and Maithili (mai) overlays for src/data/logbook.js.
// Keys: 'satyadip' and 'srm' (logbook entries), 'leadership' (array, by index),
// 'typeRatings' (array of { group, items[{ name }] }, by index),
// 'researchDomains' (array of strings, by index) and 'levels' (the three skill
// ranks used in src/components/sections/Logbook.jsx: { label, text }).
// Only translated fields are listed; everything else falls back to English.
// An empty {} in an array keeps the English entry at that index.
export default {
  ne: {
    satyadip: {
      date: 'मे - जुन 2024, डिसेम्बर 2025 - अहिले',
      aircraft: 'सिस्टम्स इन्टर्न, त्यसपछि Technical Associate',
      place: 'ललितपुर, नेपाल',
      hours: 'हाल कार्यरत',
      remarks: [
        'डिजिटल रूपान्तरण र पुरानो CRM बाट Odoo मा पूरा ERP माइग्रेसन, साथै धेरै शाखामा फैलिएको कामका लागि IT पूर्वाधार, नेटवर्किङ र workflow automation।',
        'उत्पादनका हरेक चरणमा QR बाट स्टक ट्र्याक गर्ने केन्द्रीकृत स्मार्ट इन्भेन्टरी प्रणाली, जसले कारखानाको भुइँ र हिसाबकिताबलाई जोड्छ।',
        '100+ HS आयात कोड र खुद्रा बिक्री डेटामाथि LLM र डेटा एनालिटिक्स, जसबाट बनेको product intelligence ले EV उत्पादन विस्तार र सोर्सिङलाई दिशा दियो।',
        'आन्तरिक कागजातका लागि स्थानीय रूपमा होस्ट गरिएको RAG ज्ञानकोष, र क्षेत्रअनुसार real-time स्टक उपलब्धता तथा AI ले बनाएका मार्केटिङ सामग्री भएका कम्पनी वेब प्लेटफर्म।',
      ],
      skills: ['Odoo ERP', 'Workflow automation', 'LLM एनालिटिक्स', 'स्मार्ट इन्भेन्टरी', 'RAG प्रणाली', 'EV रणनीति'],
    },
    srm: {
      aircraft: 'B.Tech, कम्प्युटर साइन्स एन्ड इन्जिनियरिङ',
      route: 'SRM University (Big Data विशेषज्ञता)',
      place: ', भारत',
      remarks: [
        'पाठ्यक्रम: Big Data Analytics, Machine Learning, Distributed Systems, Cloud Computing, Software Engineering, UI।',
        'अनुसन्धान रुचि: recommendation systems, व्यावसायिक उड्डयन प्रणाली, adaptive AI, RAG, bio-memory, डेटा साइन्स र social network analysis।',
      ],
      skills: ['Big data', 'Machine learning', 'Distributed systems', 'Cloud'],
    },
    leadership: [
      { title: 'स्वीकृत दुई अन्तर्राष्ट्रिय पेपर', text: 'IEEE ICAII 2026 (cognitive bio-memory) र ICAAsT 2024 (4D trajectories)।' },
      { title: 'स्वचालित डेलिभरी रोभर, चरण I', text: 'World-model learning र नेपालको भूभागमा वास्तविक बिटा परीक्षण।' },
      { title: 'EV उत्पादन रणनीति', text: 'HS आयात कोडबाट डेटामा आधारित product intelligence, जसले EV विस्तार र सोर्सिङलाई आकार दियो।' },
      { title: 'विद्यार्थी परिषद् र फोटोग्राफी क्लब', text: 'SRM मा क्याम्पस नेतृत्व, कार्यक्रम आयोजना, र धेरै ठूला कार्यक्रममा स्वयंसेवा।' },
      { title: 'IELTS ब्यान्ड 7.5', text: 'अन्तर्राष्ट्रिय अनुसन्धान सहकार्य, वैज्ञानिक लेखन र प्रस्तुतिका लागि।' },
    ],
    typeRatings: [
      {
        group: 'भाषाहरू',
        items: [{}, {}, {}, {}, {}],
      },
      {
        group: 'AI र LLM प्रणाली',
        items: [
          { name: 'RAG र context engineering' },
          { name: 'Continual र bio-inspired learning' },
          { name: 'Vector databases (Chroma, LanceDB)' },
          { name: 'LoRA र PEFT fine-tuning' },
          { name: 'LLM inference (Ollama, llama.cpp)' },
          { name: 'Agentic AI र knowledge graphs' },
          { name: 'Computer vision (OpenCV, Qwen Vision)' },
        ],
      },
      {
        group: 'प्रणालीहरू',
        items: [
          { name: 'Workflow automation र QR लजिस्टिक्स' },
          { name: 'Odoo ERP र डिजिटल रूपान्तरण' },
          { name: 'CI/CD (GitHub Actions, Vercel)' },
          { name: 'GeoPandas र spatial analytics' },
          { name: 'AWS का आधारभूत कुरा' },
        ],
      },
    ],
    researchDomains: [
      'Artificial general intelligence',
      'जैविक प्रेरणाको मेमोरी आर्किटेक्चर',
      'शहरी हवाई यातायात र eVTOL ATC',
      'निर्धारित (deterministic) symbolic processing',
      'व्यावसायिक उड्डयन प्रणाली',
      'Edge AI',
      'स्मार्ट यातायात र world models',
    ],
    levels: {
      Captain: { label: 'क्याप्टेन', text: 'दिनहुँ उडाउँछु, सिकाउन पनि सक्छु' },
      'First officer': { label: 'फर्स्ट अफिसर', text: 'बलियो, वास्तविक प्रोजेक्टमा प्रयोग गरेको' },
      'Type rated': { label: 'टाइप रेटेड', text: 'योग्य र अद्यावधिक' },
    },
  },
  mai: {
    satyadip: {
      date: 'मई - जून 2024, दिसम्बर 2025 - एखन',
      aircraft: 'सिस्टम्स इन्टर्न, तकर बाद Technical Associate',
      place: 'ललितपुर, नेपाल',
      hours: 'एखन कार्यरत',
      remarks: [
        'डिजिटल रूपान्तरण आ पुरान CRM सँ Odoo मे पूरा ERP माइग्रेसन, संगहि कतेको शाखा मे पसरल काज लेल IT पूर्वाधार, नेटवर्किङ आ workflow automation।',
        'उत्पादनक हर चरण मे QR सँ स्टक ट्र्याक करय बला केन्द्रीकृत स्मार्ट इन्भेन्टरी प्रणाली, जे कारखानाक फर्श आ हिसाब किताब केँ जोड़ैत अछि।',
        '100+ HS आयात कोड आ खुदरा बिक्री डेटा पर LLM आ डेटा एनालिटिक्स, जाहि सँ बनल product intelligence EV उत्पादन विस्तार आ सोर्सिङ केँ दिशा देलक।',
        'भीतरी दस्तावेज लेल स्थानीय रूप सँ होस्ट कयल RAG ज्ञानकोष, आ क्षेत्र अनुसार real-time स्टक उपलब्धता तथा AI सँ बनल मार्केटिङ सामग्री बला कम्पनी वेब प्लेटफर्म।',
      ],
      skills: ['Odoo ERP', 'Workflow automation', 'LLM एनालिटिक्स', 'स्मार्ट इन्भेन्टरी', 'RAG प्रणाली', 'EV रणनीति'],
    },
    srm: {
      aircraft: 'B.Tech, कम्प्युटर साइन्स एन्ड इन्जिनियरिङ',
      route: 'SRM University (Big Data विशेषज्ञता)',
      place: ', भारत',
      remarks: [
        'पाठ्यक्रम: Big Data Analytics, Machine Learning, Distributed Systems, Cloud Computing, Software Engineering, UI।',
        'अनुसन्धानक रुचि: recommendation systems, व्यावसायिक उड्डयन प्रणाली, adaptive AI, RAG, bio-memory, डेटा साइन्स आ social network analysis।',
      ],
      skills: ['Big data', 'Machine learning', 'Distributed systems', 'Cloud'],
    },
    leadership: [
      { title: 'दूटा स्वीकृत अन्तर्राष्ट्रीय पेपर', text: 'IEEE ICAII 2026 (cognitive bio-memory) आ ICAAsT 2024 (4D trajectories)।' },
      { title: 'स्वचालित डेलिभरी रोवर, चरण I', text: 'World-model learning आ नेपालक भूभाग पर असली बिटा परीक्षण।' },
      { title: 'EV उत्पादन रणनीति', text: 'HS आयात कोड सँ डेटा पर आधारित product intelligence, जे EV विस्तार आ सोर्सिङ केँ आकार देलक।' },
      { title: 'छात्र परिषद आ फोटोग्राफी क्लब', text: 'SRM मे क्याम्पस नेतृत्व, कार्यक्रम आयोजन, आ कतेको पैघ कार्यक्रम मे स्वयंसेवा।' },
      { title: 'IELTS ब्यान्ड 7.5', text: 'अन्तर्राष्ट्रीय अनुसन्धान सहकार्य, वैज्ञानिक लेखन आ प्रस्तुति लेल।' },
    ],
    typeRatings: [
      {
        group: 'भाषा सभ',
        items: [{}, {}, {}, {}, {}],
      },
      {
        group: 'AI आ LLM प्रणाली',
        items: [
          { name: 'RAG आ context engineering' },
          { name: 'Continual आ bio-inspired learning' },
          { name: 'Vector databases (Chroma, LanceDB)' },
          { name: 'LoRA आ PEFT fine-tuning' },
          { name: 'LLM inference (Ollama, llama.cpp)' },
          { name: 'Agentic AI आ knowledge graphs' },
          { name: 'Computer vision (OpenCV, Qwen Vision)' },
        ],
      },
      {
        group: 'प्रणाली सभ',
        items: [
          { name: 'Workflow automation आ QR लजिस्टिक्स' },
          { name: 'Odoo ERP आ डिजिटल रूपान्तरण' },
          { name: 'CI/CD (GitHub Actions, Vercel)' },
          { name: 'GeoPandas आ spatial analytics' },
          { name: 'AWS केर आधारभूत बात' },
        ],
      },
    ],
    researchDomains: [
      'Artificial general intelligence',
      'जैविक प्रेरणा बला मेमोरी आर्किटेक्चर',
      'शहरी हवाई यातायात आ eVTOL ATC',
      'निर्धारित (deterministic) symbolic processing',
      'व्यावसायिक उड्डयन प्रणाली',
      'Edge AI',
      'स्मार्ट यातायात आ world models',
    ],
    levels: {
      Captain: { label: 'कप्तान', text: 'रोज उड़बैत छी, सिखा सेहो सकैत छी' },
      'First officer': { label: 'फर्स्ट अफिसर', text: 'मजगूत, असली प्रोजेक्ट मे प्रयोग कयल' },
      'Type rated': { label: 'टाइप रेटेड', text: 'योग्य आ अद्यतन' },
    },
  },
};
