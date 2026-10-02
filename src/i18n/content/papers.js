// Nepali (ne) and Maithili (mai) overlays for src/data/papers.js, keyed by paper id.
// Only translated fields are listed (status, abstract, plain, keywords); title and
// venue stay English because they are official. See src/i18n/README.md.
export default {
  ne: {
    'icaii-2026': {
      status: 'प्रस्तुतिका लागि स्वीकृत',
      abstract:
        'हामी semantic vector मेमोरी, knowledge graph र LoRA मा आधारित parameter-efficient fine-tuning जोड्ने एउटा modular संरचना प्रस्ताव गर्छौं। यसमा Ebbinghaus को बिर्सने वक्र (forgetting curve) र निद्राको चरणमा हुने मेमोरी सुदृढीकरणका गणितीय सूत्रहरू समेटिएका छन्, जसले catastrophic forgetting वा पूरै पुनः तालिमबिना, सामान्य उपभोक्ता स्तरको कम्प्युटरमै जीवनभरको व्यक्तिगतकरण सम्भव बनाउँछ।',
      plain:
        'AI सहायकहरूले तपाईंलाई बिर्सिन्छन्, नत्र तपाईंलाई सम्झन फेरि तालिम दिनुपर्छ। यो पेपरले तिनलाई हाम्रै जस्तो काम गर्ने मेमोरी दिन्छ: महत्त्वपूर्ण कुरा झन् बलियो हुन्छ, सामान्य कुरा बिस्तारै धमिलिन्छ, र "निद्रा" ले सबै मिलाइदिन्छ, त्यो पनि साधारण gaming GPU मा चल्ने गरी सस्तोमा।',
      keywords: ['निरन्तर सिकाइ (continual learning)', 'Bio-memory', 'LoRA', 'Knowledge graph', 'संज्ञानात्मक AI'],
    },
    'icaast-2024': {
      status: 'प्रस्तुतिका लागि स्वीकृत',
      abstract:
        'हामी GeoPandas र waypoint modelling प्रयोग गरेर मौसम, भीडभाड र प्रतिबन्धित corridor का सीमाभित्र काम गर्ने spatio-temporal 4D trajectory टकराव पहिचान र रुट अनुकूलन प्रणाली प्रस्तुत गर्छौं, जुन XGBoost risk classifier र real-time dispatch निर्देशनसँग जोडिएको छ।',
      plain:
        'विमानलाई ऊ कहाँ छ र कहिले छ भन्ने आधारमा बुझिन्छ। यो प्रणालीले हरेक उडानको आगामी बाटो ठाउँ र समय दुवैमा जाँच्छ, कुन ठाउँमा दुई विमान धेरै नजिक पुग्छन् भनेर पत्ता लगाउँछ, र सुरक्षित रुट सुझाउँछ, अनि machine learning ले जोखिममाथि निगरानी राख्छ।',
      keywords: ['एरोस्पेस', '4D trajectory', 'XGBoost', 'Spatial ML', 'हवाई यातायात व्यवस्थापन'],
    },
  },
  mai: {
    'icaii-2026': {
      status: 'प्रस्तुति लेल स्वीकृत',
      abstract:
        'हम सभ एकटा modular संरचना प्रस्तावित करैत छी जे semantic vector मेमोरी, knowledge graph आ LoRA पर आधारित parameter-efficient fine-tuning केँ जोड़ैत अछि। एहि मे Ebbinghaus केर बिसरबाक वक्र (forgetting curve) आ नींदक चरण मे होमय बला मेमोरी सुदृढ़ीकरणक गणितीय सूत्र समाहित अछि, जाहि सँ catastrophic forgetting वा पूरा पुनः प्रशिक्षण बिना, साधारण उपभोक्ता स्तरक कम्प्यूटरे पर जीवन भरिक व्यक्तिगतकरण सम्भव होइत अछि।',
      plain:
        'AI सहायक अहाँकेँ बिसरि जाइत अछि, नहि तँ अहाँकेँ मोन राखबा लेल ओकरा फेर सँ प्रशिक्षण देबए पड़ैत अछि। ई पेपर ओकरा हमरे सभ जकाँ काज करय बला मोन दैत अछि: जरूरी बात आर पक्का होइत जाइत अछि, फालतू बात धीरे धीरे झाँपल होइत जाइत अछि, आ "नींद" सभ किछु सरिया दैत अछि, सेहो एतेक सस्ता मे जे साधारण gaming GPU पर चलि जाए।',
      keywords: ['निरन्तर सिखब (continual learning)', 'Bio-memory', 'LoRA', 'Knowledge graph', 'संज्ञानात्मक AI'],
    },
    'icaast-2024': {
      status: 'प्रस्तुति लेल स्वीकृत',
      abstract:
        'हम सभ GeoPandas आ waypoint modelling सँ मौसम, भीड़ आ प्रतिबन्धित corridor केर सीमा मे काज करय बला spatio-temporal 4D trajectory टकराव पहचान आ रूट अनुकूलन प्रणाली प्रस्तुत करैत छी, जे XGBoost risk classifier आ real-time dispatch निर्देश संग जुड़ल अछि।',
      plain:
        'विमानकेँ ओ कतय अछि आ कखन अछि, ताहि सँ बुझल जाइत अछि। ई प्रणाली प्रत्येक उड़ानक आगाँक बाट केँ स्थान आ समय दुनू मे जाँचैत अछि, कतय दू टा विमान बेसी लग आबि जाएत से पकड़ैत अछि, आ सुरक्षित रूट सुझबैत अछि, आ machine learning जोखिम पर नजरि रखैत अछि।',
      keywords: ['एयरोस्पेस', '4D trajectory', 'XGBoost', 'Spatial ML', 'हवाई यातायात प्रबन्धन'],
    },
  },
};
