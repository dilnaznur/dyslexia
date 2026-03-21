// MindStep - Age-Appropriate Reading Texts
// 3 Age Categories × 3 Languages = 9 texts total

const READING_TEXTS = {
  // ========== AGES 5-6: EMERGENT READERS ==========
  "5-6": {
    reading_level: "Emergent Reader",
    target_duration: "15-20 seconds",

    en: {
      title: "My Dog",
      content: "I have a dog. My dog is big. My dog is brown. I play with my dog. We run in the park. My dog is happy. I love my dog.",
      word_count: 31,
      difficulty: "Simple SVO, sight words, 3-5 words per sentence"
    },

    ru: {
      title: "Моя собака",
      content: "У меня есть собака. Моя собака большая. Моя собака коричневая. Я играю с собакой. Мы бегаем в парке. Моя собака радуется. Я люблю собаку.",
      word_count: 26,
      difficulty: "Простые предложения, повторяющаяся структура, знакомые слова"
    },

    kz: {
      title: "Менің итім",
      content: "Менің итім бар. Менің итім үлкен. Менің итім қоңыр. Мен итпен ойнаймын. Біз саябақта жүгіреміз. Менің итім қуанышты. Мен итті жақсы көремін.",
      word_count: 25,
      difficulty: "Қарапайым сөйлемдер, қайталанатын құрылым, таныс сөздер"
    }
  },

  // ========== AGES 7-8: EARLY READERS ==========
  "7-8": {
    reading_level: "Early Reader",
    target_duration: "20-25 seconds",

    en: {
      title: "My Best Friend",
      content: "My best friend is named Dana. She sits next to me in class. We like to read books together. Dana has a cat and two fish. On Saturday, we went to the park. We played on the swings and ate ice cream. Dana is kind and funny. I am lucky to have such a good friend.",
      word_count: 58,
      difficulty: "Simple past tense, 5-8 words per sentence, familiar topics"
    },

    ru: {
      title: "Моя лучшая подруга",
      content: "Мою лучшую подругу зовут Дана. Она сидит рядом со мной в классе. Мы любим читать книги вместе. У Даны есть кошка и две рыбки. В субботу мы ходили в парк. Мы качались на качелях и ели мороженое. Дана добрая и весёлая. Мне повезло иметь такую хорошую подругу.",
      word_count: 53,
      difficulty: "Прошедшее время, знакомая лексика, школьный контекст"
    },

    kz: {
      title: "Менің ең жақын досым",
      content: "Менің ең жақын досымның аты Дана. Ол сыныпта менің қасымда отырады. Біз кітап оқуды ұнатамыз. Данада мысық және екі балық бар. Сенбіде біз саябаққа бардық. Біз атқа мініп, балмұздақ жедік. Дана мейірімді және күлкілі. Мен мұндай жақсы досым бар екеніме бақыттымын.",
      word_count: 47,
      difficulty: "Өткен шақ, таныс лексика, мектеп контексті"
    }
  },

  // ========== AGES 9-10: FLUENT READERS ==========
  "9-10": {
    reading_level: "Fluent Reader",
    target_duration: "25-30 seconds",

    en: {
      title: "The School Project",
      content: "Last month, our teacher asked us to work on a science project about renewable energy. My partner Arman and I decided to build a small solar panel. We researched how solar cells convert sunlight into electricity. It was challenging because we had never done anything like this before. We spent three weeks gathering materials and assembling the parts carefully. When we finally tested our project, the small light bulb turned on! Our hard work had paid off. During the presentation, our classmates asked many questions. We felt proud because we learned so much and created something useful. This experience taught me that with patience and teamwork, you can achieve difficult goals.",
      word_count: 119,
      difficulty: "Complex sentences, past perfect, abstract concepts, 8-12 words per sentence"
    },

    ru: {
      title: "Школьный проект",
      content: "В прошлом месяце наша учительница попросила нас поработать над научным проектом о возобновляемой энергии. Мы с моим партнёром Арманом решили построить небольшую солнечную панель. Мы изучали, как солнечные батареи преобразуют солнечный свет в электричество. Это было сложно, потому что мы никогда раньше не делали ничего подобного. Мы потратили три недели на сбор материалов и тщательную сборку деталей. Когда мы наконец протестировали наш проект, маленькая лампочка загорелась! Наши усилия окупились. Во время презентации одноклассники задавали много вопросов. Мы чувствовали гордость, потому что так многому научились и создали нечто полезное. Этот опыт научил меня, что с терпением и командной работой можно достичь сложных целей.",
      word_count: 106,
      difficulty: "Сложные предложения, прошедшее время, абстрактные понятия"
    },

    kz: {
      title: "Мектеп жобасы",
      content: "Өткен айда мұғаліміміз бізден жаңартылатын энергия туралы ғылыми жобамен жұмыс істеуді сұрады. Біз серіктесім Арманмен кішкентай күн панелін жасауды шештік. Біз күн батареялары күн сәулесін электр энергиясына қалай түрлендіретінін зерттедік. Бұл қиын болды, өйткені біз бұрын мұндай ештеңе жасамаған едік. Біз үш апта бойы материалдарды жинап, бөлшектерді мұқият құрастырдық. Біз жобамызды сынағанда, кішкентай шам жанды! Біздің еңбегіміз өз нәтижесін берді. Презентация кезінде сыныптастарымыз көп сұрақ қойды. Біз мақтанышпен сезіндік, өйткені көп нәрсе үйрендік және пайдалы зат жасадық. Бұл тәжірибе маған шыдамдылық пен командалық жұмыспен қиын мақсаттарға жетуге болатынын үйретті.",
      word_count: 99,
      difficulty: "Күрделі сөйлемдер, өткен шақ, абстрактылы ұғымдар"
    }
  }
};

// Helper function to get appropriate text based on age
function getReadingText(age, language) {
  let ageGroup;
  if (age <= 6) {
    ageGroup = "5-6";
  } else if (age <= 8) {
    ageGroup = "7-8";
  } else {
    ageGroup = "9-10";
  }

  return READING_TEXTS[ageGroup][language];
}

export { READING_TEXTS, getReadingText };
export default READING_TEXTS;
