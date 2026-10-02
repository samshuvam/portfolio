// Nepali (ne) and Maithili (mai) overlays for src/data/profile.js.
// Keys: 'profile' ({ tagline, heroLine, home, university, current, born{place} })
// and 'stats' (array of { label, detail }, merged by index).
// Only translated fields are listed; everything else falls back to English.
export default {
  ne: {
    profile: {
      tagline: 'AI, उड्डयन र बीचका सबै कुरा।',
      heroLine: 'AI, उड्डयन र बीचका सबै कुरा। म सम्झने AI र सोच्ने आकाश बनाउँछु।',
      born: { place: 'जनकपुरधाम, मधेश, नेपाल', date: '25 अप्रिल 2003', bs: '12 बैशाख 2060' },
      home: 'ललितपुर, नेपाल',
      university: 'SRM University, भारत',
      languages: ['मैथिली', 'नेपाली', 'अंग्रेजी'],
      current: 'United Lubricants & SatyaDip International, ललितपुरमा Technical Associate',
    },
    stats: [
      { label: 'स्वीकृत पेपर', detail: 'IEEE ICAII 2026 र ICAAsT 2024' },
      { label: 'साधारण RAG भन्दा बढी', detail: '500 प्रश्नको बेन्चमार्कमा मापन गरिएको' },
      { label: 'CGPA', detail: 'B.Tech CSE, Big Data, SRM University' },
      { label: 'IELTS ब्यान्ड', detail: 'वैज्ञानिक लेखन र बोलाइ' },
    ],
  },
  mai: {
    profile: {
      tagline: 'AI, उड्डयन आ बीच केर सभ किछु।',
      heroLine: 'AI, उड्डयन आ बीच केर सभ किछु। हम मोन राखय बला AI आ सोचय बला आकाश बनबैत छी।',
      born: { place: 'जनकपुरधाम, मधेश, नेपाल', date: '25 अप्रैल 2003', bs: '12 बैशाख 2060' },
      home: 'ललितपुर, नेपाल',
      university: 'SRM University, भारत',
      languages: ['मैथिली', 'नेपाली', 'अंग्रेजी'],
      current: 'United Lubricants & SatyaDip International, ललितपुर मे Technical Associate',
    },
    stats: [
      { label: 'स्वीकृत पेपर', detail: 'IEEE ICAII 2026 आ ICAAsT 2024' },
      { label: 'साधारण RAG सँ बेसी', detail: '500 प्रश्नक बेन्चमार्क पर मापल गेल' },
      { label: 'CGPA', detail: 'B.Tech CSE, Big Data, SRM University' },
      { label: 'IELTS ब्यान्ड', detail: 'वैज्ञानिक लेखन आ बाजब' },
    ],
  },
};
