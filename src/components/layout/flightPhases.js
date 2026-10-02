export const phases={
 en:[['Departure','The first chapter. Cleared to explore.'],['Climb','Getting to know the person behind the work.'],['Cruise','Projects, experiments and research at altitude.'],['En route','The places, people and little things along the way.'],['Approach','Let’s talk about the next chapter.'],['Destination pending','A possible landing. The real flight plan is still open.']],
 ne:[['प्रस्थान','पहिलो अध्याय। खोज्न अनुमति मिल्यो।'],['उकालो उडान','कामपछाडिको मान्छेसँग परिचय।'],['उचाइमा उडान','परियोजना, प्रयोग र अनुसन्धान।'],['यात्राको बीचमा','बाटाका ठाउँ, मान्छे र साना कुरा।'],['अवतरणतर्फ','अर्को अध्यायबारे कुरा गरौँ।'],['गन्तव्य तय हुन बाँकी','सम्भावित अवतरण। वास्तविक योजना खुलै छ।']],
 mai:[['प्रस्थान','पहिल अध्याय। खोजबाक अनुमति भेटल।'],['ऊपर उड़ान','काजक पाछू मनुष्यसँ परिचय।'],['ऊँचाई पर उड़ान','परियोजना, प्रयोग आ अनुसन्धान।'],['यात्राक बीच','रस्ताक ठाम, मनुष्य आ छोट बात।'],['अवतरण दिस','अगिला अध्याय पर गप्प करू।'],['गन्तव्य तय होयब बाँकी','सम्भावित अवतरण। असली योजना खुलल अछि।']]
};
export const phaseIndex=i=>i===0?0:i===1?1:i<7?2:i<14?3:i===14?4:5;
