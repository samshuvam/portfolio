// Projects overlay, part B. See src/i18n/README.md for the overlay shape.
// Keys are project ids from src/data/projects.js. Arrays merge by index.

export default {
  ne: {
    'hallucination-mitigation': {
      title: 'AI Hallucination न्यूनीकरण र प्रमाणीकरण तहहरू',
      short: 'Hallucination न्यूनीकरण',
      subtitle: 'भरपर्दो generative प्रणालीका लागि consistency filter',
      category: 'AI र LLM प्रणाली',
      date: 'डिसेम्बर 2025',
      highlight: 'स्नातक तहको अनुसन्धान',
      status: 'सम्पन्न',
      summary:
        'राम्रो query प्रशोधन, page-ranking heuristic र multimodal cross-check मार्फत LLM को hallucination घटाउने अनुसन्धान।',
      intro:
        'केही निश्चित (deterministic) प्रमाणीकरण तहहरूले बाझिने वा आधारविहीन उत्तरलाई प्रयोगकर्तासम्म पुग्नुअघि नै छानेर रोक्छन्।',
      points: [
        {
          title: 'Query पुनर्लेखन',
          text: 'अस्पष्ट prompt लाई retrieval अघि नै आधिकारिक सन्दर्भ समूहसँग जोडिदिन्छ।',
        },
        {
          title: 'विश्वास अंक (confidence scoring)',
          text: 'कमजोर आधार भएका अंशमा झन्डा लगाउँछ, ताकि तिनलाई जाँच्न वा हटाउन सकियोस्।',
        },
      ],
      caseStudy: {
        challenge: 'मोडेललाई पूरै आत्मविश्वासका साथ कुरा बनाउनबाट रोक्नु।',
        steps: ['Query पुनर्लेखन गर्ने', 'सन्दर्भ पेजहरूको क्रम मिलाउने', 'विभिन्न modality मा cross-check गर्ने', 'उत्तरलाई अंक दिएर छान्ने'],
      },
      metrics: [{ label: 'Hallucination' }, { label: 'प्रमाणीकरण latency' }],
    },

    'multimodal-rag': {
      title: 'Policy-Based Access सहितको उन्नत Multi-Modal RAG',
      short: 'Multi-Modal RAG',
      subtitle: 'Whisper, Qwen Vision र LanceDB सहित web-स्तरको ज्ञान',
      category: 'AI र LLM प्रणाली',
      date: 'सेप्टेम्बर 2025',
      highlight: 'Policy-based access control',
      status: 'सम्पन्न',
      summary:
        'वेबलाई नै आफ्नो database मान्ने स्मार्ट RAG प्रणाली: अडियोका लागि Whisper, diagram र OCR का लागि Qwen Vision, र vector store भित्रै policy-based access control।',
      intro:
        'पाठ, अडियो र तस्बिर सबै एउटै retrieval तहमा आउँछन्, र कसले के हेर्न पाउँछ भन्ने नियम vector store आफैँले लागू गर्छ।',
      points: [
        {
          title: 'हरेक modality',
          text: 'Whisper ले अडियो stream सम्हाल्छ; Qwen Vision ले प्राविधिक diagram र scan गरिएका पेज पढ्छ।',
        },
        {
          title: 'Vector तहमै access control',
          text: 'LanceDB भित्रको policy-based access control ले context भड्किन र अनधिकृत कागजातसम्म पुग्न दिँदैन।',
        },
      ],
      caseStudy: {
        challenge: 'पाठ, अडियो र तस्बिरमा खोज्ने, तर प्रयोगकर्ताले हेर्न नपाउने कागजात कहिल्यै नचुहाउने।',
        steps: ['पाठ, अडियो र तस्बिर भित्र्याउने', 'LanceDB मा embed गर्ने', 'Query गर्दा policy अनुसार छान्ने', 'आधारसहितको उत्तर तयार गर्ने'],
      },
      metrics: [
        { label: 'Modality', value: 'पाठ, अडियो, तस्बिर' },
        { label: 'Vector DB' },
      ],
    },

    'autonomous-delivery': {
      title: 'स्वचालित डेलिभरी सवारी, चरण I',
      short: 'स्वचालित डेलिभरी रोभर',
      subtitle: 'World-model learning, नेपालकै भूगोलमा परीक्षण गरिएको',
      category: 'एरोस्पेस र स्वायत्तता',
      highlight: 'नेपालमा फिल्ड परीक्षण',
      status: 'चरण I सम्पन्न',
      summary:
        'नेपालको भूबनोटअनुसार ढालिएको world-model learning सहितको आफैँ चल्ने डेलिभरी रोभरको चरण I पूरा गर्न सहयोग गरेँ।',
      intro:
        'असंरचित सडक, ठाडा उकाला र अनपेक्षित अवरोध: नेपाल कठोर परीक्षण ट्र्याक हो, र ठ्याक्कै त्यसैले यसलाई रोजिएको थियो।',
      points: [
        {
          title: 'दृष्टि र बाटो योजना',
          text: 'असंरचित सडक, भिरालो र बदलिरहने अवरोधका लागि मिलाइएका computer vision र planning algorithm, जसको beta परीक्षण नेपालकै वास्तविक भूभागमा भयो।',
        },
      ],
      caseStudy: {
        challenge: 'सडक विरलै समतल, चिन्ह लगाइएको वा अनुमान गर्न सकिने हुने ठाउँमा आफैँ गाडी चलाउनु।',
        steps: ['World model सिक्ने', 'भूभाग र अवरोध चिन्ने', 'सुरक्षित बाटो योजना गर्ने', 'फिल्डमा beta परीक्षण गर्ने'],
      },
      metrics: [
        { label: 'भूभाग', value: 'पहाडी, असंरचित' },
        { label: 'चरण', value: 'चरण I सम्पन्न' },
      ],
    },

    'hospital-erp': {
      title: 'LLM एकीकरणसहितको स्मार्ट अस्पताल ERP',
      short: 'स्मार्ट अस्पताल ERP',
      subtitle: 'बिरामीका प्रश्न र रेकर्ड सारांश, स्वचालित रूपमा',
      category: 'प्रणाली र ERP',
      date: 'अप्रिल 2025',
      highlight: 'स्वास्थ्य प्रणाली',
      status: 'सम्पन्न',
      summary:
        'क्लिनिकल दर्ता, बिरामीका प्रश्नको routing र मेडिकल रेकर्डको सारांशका लागि LLM agent भएको अस्पताल व्यवस्थापन प्रणाली।',
      intro:
        'कर्मचारीले बिरामीको इतिहास सामान्य भाषामा सोध्न सक्छन् र केही सेकेन्डमै सारांश पाउँछन्, गोपनीयताका नियम पनि जस्ताको तस्तै रहन्छन्।',
      points: [
        {
          title: 'छिटो क्लिनिकल काम',
          text: 'स्वचालित दर्ता, routing र रेकर्ड सारांशले मेडिकल कर्मचारी र बिरामी दुवैको प्रशासनिक झन्झट घटाउँछ।',
        },
      ],
      caseStudy: {
        challenge: 'गोपनीयतामा सम्झौता नगरी बिरामीको रेकर्ड छिटो खोज्न मिल्ने बनाउनु।',
        steps: ['दर्तालाई डिजिटल बनाउने', 'बिरामीका प्रश्न सही ठाउँ पठाउने', 'LLM ले रेकर्डको सारांश बनाउने', 'पहुँचलाई नीतिभित्रै राख्ने'],
      },
      metrics: [{ label: 'Query समय' }, { label: 'कार्य दक्षता' }],
    },

    'gesture-attendance': {
      title: 'हातको इशारा र भावनामा आधारित स्मार्ट हाजिरी',
      short: 'इशारा हाजिरी',
      subtitle: 'हातको इशारा र अनुहारको भाव, real time मा',
      category: 'AI र LLM प्रणाली',
      date: 'फेब्रुअरी 2025',
      highlight: 'Computer vision',
      status: 'सम्पन्न',
      summary:
        'OpenCV र deep learning मा बनेको छुनै नपर्ने हाजिरी प्रणाली, जसले हातको इशाराले पहिचान पुष्टि गर्छ र अनुहारको भावबाट उत्पादकत्वको मौन प्रतिक्रिया पढ्छ।',
      intro:
        'धेरै तहका प्रमाणीकरणले नक्कली पहिचान (spoofing) रोक्छन्, र इशाराका आदेशले कक्षाका झर्को लाग्ने काम आफैँ गरिदिन्छन्।',
      points: [
        {
          title: 'बहु-तह प्रमाणीकरण',
          text: 'Anti-spoofing जाँचसहित इशारा र भावना पहिचान, साथै इशाराले चल्ने कक्षाकोठा स्वचालन।',
        },
      ],
      caseStudy: {
        challenge: 'केही नछोई हाजिरी लिने, र फोटो देखाएर कसैले झुक्याउन नपाउने।',
        steps: ['हातको इशारा पत्ता लगाउने', 'अनुहार जीवित हो कि होइन पुष्टि गर्ने', 'भाव पढ्ने', 'हाजिरी र प्रतिक्रिया दर्ता गर्ने'],
      },
      metrics: [{ label: 'पहिचान शुद्धता' }, { label: 'Frame rate' }],
    },

    'smart-bus': {
      title: 'स्मार्ट बस ट्र्याकिङ र बुकिङ प्रणाली',
      short: 'स्मार्ट बस',
      subtitle: 'Dynamic pricing र मनपर्ने सिटसहितको पहिलो वर्षको यातायात प्लेटफर्म',
      category: 'प्रणाली र ERP',
      date: 'पहिलो वर्ष',
      highlight: 'Tracking API बिनै बनाइएको',
      status: 'सम्पन्न',
      summary:
        'तेस्रो पक्षको tracking API बिना बस ट्र्याकिङ र बुकिङ: रुट, मनपर्ने सिट, उपलब्धता र dynamic pricing, MongoDB Atlas मा।',
      intro:
        'साधारण बस यात्रा योजना गर्न सजिलो बनाउने सुरुआती full-stack प्रोजेक्ट। Live tracking API छैन? मैले वास्तविक latitude र longitude बिन्दुहरू stream गरेँ र Google Maps को एउटा loophole प्रयोग गरेर बसको स्थान कोर्ने र अपडेट गर्ने काम गरेँ।',
      points: [
        {
          title: 'रुट र ट्र्याकिङ मोडेल',
          text: 'संरचित रुट डेटा र live coordinate बाट यात्रा कहाँ पुग्यो भन्ने हिसाब।',
        },
        {
          title: 'सिट हेरेर बुकिङ',
          text: 'यात्रुले मनपर्ने सिट छान्छन्, र बुकिङ बदलिँदा पनि उपलब्धता मिलिरहन्छ।',
        },
        {
          title: 'Dynamic pricing',
          text: 'भाडा उपलब्धता र यात्राको अवस्थाअनुसार बदलिन्छ, डेटा तहका रूपमा MongoDB Atlas।',
        },
      ],
      caseStudy: {
        challenge: 'Live यातायात API नै नभएको अवस्थामा काम लाग्ने ट्र्याकिङ र बुकिङ बनाउनु।',
        steps: ['रुट र बिसौनी मोडेल गर्ने', 'मनपर्ने सिट आरक्षण गर्ने', 'भाडा हिसाब गर्ने', 'बुकिङ Atlas मा सुरक्षित राख्ने'],
      },
      metrics: [
        { label: 'ट्र्याकिङ', value: 'Live coordinate' },
        { label: 'बुकिङ', value: 'सिट हेरेर' },
        { label: 'भण्डारण' },
      ],
    },
  },

  mai: {
    'hallucination-mitigation': {
      title: 'AI Hallucination न्यूनीकरण आ सत्यापन परत',
      short: 'Hallucination न्यूनीकरण',
      subtitle: 'भरोसा योग्य generative प्रणाली लेल consistency filter',
      category: 'AI आ LLM प्रणाली',
      date: 'दिसम्बर 2025',
      highlight: 'स्नातक स्तरक शोध',
      status: 'पूर्ण',
      summary:
        'नीक query प्रसंस्करण, page-ranking heuristic आ multimodal cross-check सँ LLM केर hallucination कम करबाक शोध।',
      intro:
        'किछु निश्चित (deterministic) सत्यापन परत आपसमे टकराबय बला वा बिना आधारक उत्तरकेँ प्रयोगकर्ता धरि पहुँचबा सँ पहिनहि छानि कऽ रोकि दैत अछि।',
      points: [
        {
          title: 'Query पुनर्लेखन',
          text: 'अस्पष्ट prompt केँ retrieval सँ पहिनहि आधिकारिक सन्दर्भ समूह सँ जोड़ि दैत अछि।',
        },
        {
          title: 'भरोसा अंक (confidence scoring)',
          text: 'कमजोर आधार बला अंश पर निशान लगबैत अछि, जाहि सँ ओकरा जाँचल वा हटाओल जा सकय।',
        },
      ],
      caseStudy: {
        challenge: 'मॉडलकेँ पूरा भरोसा सँ बात गढ़बा सँ रोकब।',
        steps: ['Query पुनर्लेखन करब', 'सन्दर्भ पन्नाक क्रम लगाएब', 'अलग अलग modality मे cross-check करब', 'उत्तरकेँ अंक दऽ कऽ छानब'],
      },
      metrics: [{ label: 'Hallucination' }, { label: 'सत्यापन latency' }],
    },

    'multimodal-rag': {
      title: 'Policy-Based Access सहित उन्नत Multi-Modal RAG',
      short: 'Multi-Modal RAG',
      subtitle: 'Whisper, Qwen Vision आ LanceDB संग web-स्तरक ज्ञान',
      category: 'AI आ LLM प्रणाली',
      date: 'सितम्बर 2025',
      highlight: 'Policy-based access control',
      status: 'पूर्ण',
      summary:
        'एकटा स्मार्ट RAG प्रणाली जे वेबहि केँ अपन database मानैत अछि: ऑडियो लेल Whisper, diagram आ OCR लेल Qwen Vision, आ vector store केर भीतरे policy-based access control।',
      intro:
        'पाठ, ऑडियो आ चित्र सभ एकहि retrieval परत मे अबैत अछि, आ के की देखि सकैत अछि, से नियम vector store अपनहि लागू करैत अछि।',
      points: [
        {
          title: 'सभ modality',
          text: 'Whisper ऑडियो stream सम्हारैत अछि; Qwen Vision तकनीकी diagram आ scan कएल पन्ना पढ़ैत अछि।',
        },
        {
          title: 'Vector परत पर access control',
          text: 'LanceDB मे policy-based access control context केँ भटकए नहि दैत अछि आ अनधिकृत दस्तावेज धरि पहुँच रोकैत अछि।',
        },
      ],
      caseStudy: {
        challenge: 'पाठ, ऑडियो आ चित्र मे खोजब, मुदा जे दस्तावेज प्रयोगकर्ताकेँ नहि देखबाक चाही से कहियो बाहर नहि जाए।',
        steps: ['पाठ, ऑडियो आ चित्र भीतर आनब', 'LanceDB मे embed करब', 'Query काल policy सँ छानब', 'आधार सहित उत्तर बनाएब'],
      },
      metrics: [
        { label: 'Modality', value: 'पाठ, ऑडियो, चित्र' },
        { label: 'Vector DB' },
      ],
    },

    'autonomous-delivery': {
      title: 'स्वचालित डिलिवरी वाहन, चरण I',
      short: 'स्वचालित डिलिवरी रोवर',
      subtitle: 'World-model learning, नेपालक भूगोल पर परीक्षण कएल',
      category: 'एयरोस्पेस आ स्वायत्तता',
      highlight: 'नेपाल मे फील्ड परीक्षण',
      status: 'चरण I पूर्ण',
      summary:
        'नेपालक भू-बनावट अनुसार ढालल world-model learning संग अपने चलय बला डिलिवरी रोवरक चरण I पूरा करबा मे हम सहयोग केलहुँ।',
      intro:
        'बेतरतीब सड़क, ठाढ़ चढ़ाई आ अचानक आबय बला बाधा: नेपाल एकटा कठोर परीक्षण ट्रैक अछि, आ ठीक तेँ एकरा चुनल गेल छल।',
      points: [
        {
          title: 'दृष्टि आ बाट योजना',
          text: 'बेतरतीब सड़क, ढलान आ बदलैत बाधा लेल मिलाओल computer vision आ planning algorithm, जकर beta परीक्षण नेपालक असली भूभाग पर भेल।',
        },
      ],
      caseStudy: {
        challenge: 'जतय सड़क कमे समतल, चिन्हित वा अनुमान योग्य होइत अछि, ओतय अपने गाड़ी चलाएब।',
        steps: ['World model सिखब', 'भूभाग आ बाधा चिन्हब', 'सुरक्षित बाट योजना बनाएब', 'फील्ड मे beta परीक्षण करब'],
      },
      metrics: [
        { label: 'भूभाग', value: 'पहाड़ी, बेतरतीब' },
        { label: 'चरण', value: 'चरण I पूर्ण' },
      ],
    },

    'hospital-erp': {
      title: 'LLM एकीकरण सहित स्मार्ट अस्पताल ERP',
      short: 'स्मार्ट अस्पताल ERP',
      subtitle: 'रोगीक प्रश्न आ रिकॉर्डक सारांश, अपने आप',
      category: 'प्रणाली आ ERP',
      date: 'अप्रैल 2025',
      highlight: 'स्वास्थ्य प्रणाली',
      status: 'पूर्ण',
      summary:
        'क्लिनिकल पंजीकरण, रोगीक प्रश्नक routing आ मेडिकल रिकॉर्डक सारांश लेल LLM agent बला अस्पताल प्रबन्धन प्रणाली।',
      intro:
        'कर्मचारी रोगीक इतिहास सामान्य भाषा मे पूछि सकैत छथि आ किछुए सेकेंड मे सारांश पाबि लैत छथि, गोपनीयताक नियम सेहो जहिनाक तहिना रहैत अछि।',
      points: [
        {
          title: 'तेज क्लिनिकल काज',
          text: 'स्वचालित पंजीकरण, routing आ रिकॉर्ड सारांश मेडिकल कर्मचारी आ रोगी दुनूक प्रशासनिक झंझट कम करैत अछि।',
        },
      ],
      caseStudy: {
        challenge: 'गोपनीयता सँ समझौता कएने बिना रोगीक रिकॉर्ड जल्दी खोजबा योग्य बनाएब।',
        steps: ['पंजीकरणकेँ डिजिटल बनाएब', 'रोगीक प्रश्न सही ठाम पठाएब', 'LLM सँ रिकॉर्डक सारांश बनाएब', 'पहुँचकेँ नीतिक भीतर राखब'],
      },
      metrics: [{ label: 'Query समय' }, { label: 'काजक दक्षता' }],
    },

    'gesture-attendance': {
      title: 'हाथक इशारा आ भावना पर आधारित स्मार्ट हाजिरी',
      short: 'इशारा हाजिरी',
      subtitle: 'हाथक इशारा आ मुँहक भाव, real time मे',
      category: 'AI आ LLM प्रणाली',
      date: 'फरवरी 2025',
      highlight: 'Computer vision',
      status: 'पूर्ण',
      summary:
        'OpenCV आ deep learning सँ बनल बिना छूने हाजिरी प्रणाली, जे हाथक इशारा सँ पहचान पक्का करैत अछि आ मुँहक भाव सँ उत्पादकताक चुप्प प्रतिक्रिया पढ़ैत अछि।',
      intro:
        'कतेको परतक सत्यापन नकली पहचान (spoofing) रोकैत अछि, आ इशाराक आदेश कक्षाक उबाऊ काज अपने कऽ दैत अछि।',
      points: [
        {
          title: 'बहु-परत सत्यापन',
          text: 'Anti-spoofing जाँच संग इशारा आ भावना पहचान, आ संगहि इशारा सँ चलय बला कक्षाक स्वचालन।',
        },
      ],
      caseStudy: {
        challenge: 'किछु छूने बिना हाजिरी लेब, आ फोटो देखा कऽ केओ ठकि नहि सकय।',
        steps: ['हाथक इशारा पकड़ब', 'मुँह जीवित अछि कि नहि, से पक्का करब', 'भाव पढ़ब', 'हाजिरी आ प्रतिक्रिया दर्ज करब'],
      },
      metrics: [{ label: 'पहचानक शुद्धता' }, { label: 'Frame rate' }],
    },

    'smart-bus': {
      title: 'स्मार्ट बस ट्रैकिंग आ बुकिंग प्रणाली',
      short: 'स्मार्ट बस',
      subtitle: 'Dynamic pricing आ पसिनक सीट संग पहिल वर्षक यातायात प्लेटफॉर्म',
      category: 'प्रणाली आ ERP',
      date: 'पहिल वर्ष',
      highlight: 'Tracking API बिनहि बनाओल',
      status: 'पूर्ण',
      summary:
        'तेसर पक्षक tracking API बिना बस ट्रैकिंग आ बुकिंग: रूट, पसिनक सीट, उपलब्धता आ dynamic pricing, MongoDB Atlas पर।',
      intro:
        'साधारण बस यात्राक योजना सहज बनाबय बला एकटा शुरुआती full-stack प्रोजेक्ट। Live tracking API नहि अछि? हम असली latitude आ longitude बिन्दु stream केलहुँ आ Google Maps केर एकटा loophole सँ बसक स्थान खींचलहुँ आ अपडेट केलहुँ।',
      points: [
        {
          title: 'रूट आ ट्रैकिंग मॉडल',
          text: 'संरचित रूट डेटा आ live coordinate सँ यात्रा कतय धरि पहुँचल, तकर हिसाब।',
        },
        {
          title: 'सीट देखि कऽ बुकिंग',
          text: 'यात्री अपन पसिनक सीट चुनैत छथि, आ बुकिंग बदललो पर उपलब्धता ठीक रहैत अछि।',
        },
        {
          title: 'Dynamic pricing',
          text: 'भाड़ा उपलब्धता आ यात्राक स्थिति अनुसार बदलैत अछि, डेटा परतक रूप मे MongoDB Atlas।',
        },
      ],
      caseStudy: {
        challenge: 'जखन live यातायात API छहिए नहि, तखन काजक ट्रैकिंग आ बुकिंग बनाएब।',
        steps: ['रूट आ पड़ाव मॉडल करब', 'पसिनक सीट आरक्षित करब', 'भाड़ाक हिसाब करब', 'बुकिंग Atlas मे सुरक्षित राखब'],
      },
      metrics: [
        { label: 'ट्रैकिंग', value: 'Live coordinate' },
        { label: 'बुकिंग', value: 'सीट देखि कऽ' },
        { label: 'भंडारण' },
      ],
    },
  },
};
