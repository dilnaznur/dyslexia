/**
 * Exercise Data and Content
 * All exercise content for the dyslexia practice section
 * Evidence-based exercises designed for children ages 5-10
 */

export type ExerciseLanguage = 'en' | 'ru' | 'kz';

export function getExerciseLanguage(language: string | undefined): ExerciseLanguage {
  const base = (language || 'en').split('-')[0].toLowerCase();
  if (base === 'ru') return 'ru';
  if (base === 'kk' || base === 'kz') return 'kz';
  return 'en';
}

/**
 * Word Flash Exercise Data
 * Evidence: Rapid Automatized Naming (RAN) improves reading fluency
 * Source: Shaywitz, S. (2003). Overcoming Dyslexia
 */
export const WORD_FLASH_WORDS = {
  easy: ['the', 'and', 'cat', 'dog', 'run', 'big', 'red', 'sun', 'fun', 'hat'],
  medium: ['happy', 'jump', 'blue', 'green', 'small', 'fast', 'play', 'read', 'book', 'tree'],
  hard: ['butterfly', 'elephant', 'rainbow', 'beautiful', 'wonderful', 'adventure', 'together', 'important', 'different', 'remember'],
};

/**
 * Syllable Segmentation Exercise Data
 * Evidence: Phonological awareness is crucial for reading development
 * Source: Goswami, U. (2002). Phonology, reading, and dyslexia
 */
export const SYLLABLE_WORDS = [
  { word: 'cat', syllables: ['cat'], difficulty: 'easy' },
  { word: 'rabbit', syllables: ['rab', 'bit'], difficulty: 'easy' },
  { word: 'butterfly', syllables: ['but', 'ter', 'fly'], difficulty: 'medium' },
  { word: 'elephant', syllables: ['el', 'e', 'phant'], difficulty: 'medium' },
  { word: 'rainbow', syllables: ['rain', 'bow'], difficulty: 'easy' },
  { word: 'watermelon', syllables: ['wa', 'ter', 'mel', 'on'], difficulty: 'hard' },
  { word: 'banana', syllables: ['ba', 'na', 'na'], difficulty: 'easy' },
  { word: 'dinosaur', syllables: ['di', 'no', 'saur'], difficulty: 'medium' },
  { word: 'helicopter', syllables: ['hel', 'i', 'cop', 'ter'], difficulty: 'hard' },
  { word: 'umbrella', syllables: ['um', 'brel', 'la'], difficulty: 'medium' },
  { word: 'crocodile', syllables: ['croc', 'o', 'dile'], difficulty: 'medium' },
  { word: 'caterpillar', syllables: ['cat', 'er', 'pil', 'lar'], difficulty: 'hard' },
];

/**
 * Reading Tracker Content
 * Evidence: Line tracking reduces skipping lines and improves comprehension
 * Source: Schneps et al. (2013). Reading and visual processing study
 */
export const READING_PASSAGES = [
  {
    id: 'story-1',
    title: 'The Happy Dog',
    lines: [
      'Max was a happy little dog.',
      'He loved to play in the park.',
      'Every day, he would run and jump.',
      'His favorite toy was a red ball.',
      'Max had many friends at the park.',
      'They would play together all day long.',
    ],
    difficulty: 'easy',
  },
  {
    id: 'story-2',
    title: 'The Magic Garden',
    lines: [
      'Once upon a time, there was a garden.',
      'In this garden, flowers could talk.',
      'The roses were red and very kind.',
      'The sunflowers were tall and brave.',
      'A little girl named Lily found this garden.',
      'She visited every day to hear their stories.',
      'The flowers taught her about being a good friend.',
      'Lily grew up to be kind, just like her flower friends.',
    ],
    difficulty: 'medium',
  },
  {
    id: 'story-3',
    title: 'Space Adventure',
    lines: [
      'Captain Luna looked out the window of her spaceship.',
      'The stars sparkled like diamonds in the darkness.',
      'Today was a special day for the whole crew.',
      'They were going to land on a new planet.',
      'Nobody had ever been there before.',
      'Luna checked all the controls carefully.',
      'Her robot friend, Beeper, beeped happily.',
      '"Are you ready for our adventure?" Luna asked.',
      'Beeper spun around in excitement.',
      'Together, they would discover something amazing.',
    ],
    difficulty: 'hard',
  },
];

/**
 * Letter Tracing Data
 * Evidence: Motor memory and visual-motor integration improve letter formation
 * Source: Berninger, V. (2012). Handwriting and dyslexia research
 */
export const TRACING_LETTERS = {
  // Common letter confusion pairs for dyslexia
  confusionPairs: ['b', 'd', 'p', 'q'],
  // All lowercase letters
  lowercase: 'abcdefghijklmnopqrstuvwxyz'.split(''),
  // Uppercase letters
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
  // Numbers
  numbers: '0123456789'.split(''),
};

// SVG paths for letter tracing guides
export const LETTER_PATHS: Record<string, { path: string; viewBox: string; instructions: string }> = {
  'b': {
    path: 'M 30 20 L 30 100 M 30 60 Q 70 60 70 80 Q 70 100 30 100',
    viewBox: '0 0 100 120',
    instructions: 'Start at the top, go down, then make a bump',
  },
  'd': {
    path: 'M 70 20 L 70 100 M 70 60 Q 30 60 30 80 Q 30 100 70 100',
    viewBox: '0 0 100 120',
    instructions: 'Start at the top, go down, then make a bump to the left',
  },
  'p': {
    path: 'M 30 40 L 30 120 M 30 40 Q 70 40 70 60 Q 70 80 30 80',
    viewBox: '0 0 100 140',
    instructions: 'Start high, go down past the line, bump at top',
  },
  'q': {
    path: 'M 70 40 L 70 120 M 70 40 Q 30 40 30 60 Q 30 80 70 80',
    viewBox: '0 0 100 140',
    instructions: 'Like p but with bump to the left',
  },
};

/**
 * Mirror Letter Detective Data
 * Evidence: Visual discrimination training helps reduce letter reversals
 * Source: Fischer & Luxemburg (2020). Letter reversal interventions
 */
export const MIRROR_GRIDS = [
  {
    level: 1,
    grid: [
      ['b', 'b', 'b', 'd'],
      ['b', 'd', 'b', 'b'],
      ['b', 'b', 'b', 'b'],
    ],
    targetLetter: 'b',
    mirrorLetter: 'd',
    mirrorPositions: [[0, 3], [1, 1]],
  },
  {
    level: 2,
    grid: [
      ['p', 'p', 'q', 'p'],
      ['q', 'p', 'p', 'p'],
      ['p', 'p', 'p', 'q'],
    ],
    targetLetter: 'p',
    mirrorLetter: 'q',
    mirrorPositions: [[0, 2], [1, 0], [2, 3]],
  },
  {
    level: 3,
    grid: [
      ['b', 'd', 'b', 'b', 'd'],
      ['b', 'b', 'b', 'd', 'b'],
      ['d', 'b', 'b', 'b', 'b'],
      ['b', 'b', 'd', 'b', 'b'],
    ],
    targetLetter: 'b',
    mirrorLetter: 'd',
    mirrorPositions: [[0, 1], [0, 4], [1, 3], [2, 0], [3, 2]],
  },
  {
    level: 4,
    grid: [
      ['b', 'p', 'd', 'q', 'b'],
      ['d', 'b', 'p', 'b', 'q'],
      ['p', 'q', 'b', 'd', 'p'],
      ['b', 'b', 'q', 'p', 'd'],
    ],
    targetLetter: 'b',
    mirrorLetter: 'd',
    mirrorPositions: [[0, 2], [1, 0], [2, 3], [3, 4]],
  },
];

/**
 * Sequence Memory Data
 * Evidence: Working memory training improves cognitive processing
 * Source: Gathercole, S. (2008). Working memory in learning
 */
export const SEQUENCE_SHAPES = [
  { id: 'circle-red', emoji: '🔴', color: '#EF4444', name: 'Red Circle' },
  { id: 'circle-blue', emoji: '🔵', color: '#3B82F6', name: 'Blue Circle' },
  { id: 'circle-yellow', emoji: '🟡', color: '#EAB308', name: 'Yellow Circle' },
  { id: 'circle-green', emoji: '🟢', color: '#22C55E', name: 'Green Circle' },
  { id: 'circle-purple', emoji: '🟣', color: '#A855F7', name: 'Purple Circle' },
  { id: 'star', emoji: '⭐', color: '#F59E0B', name: 'Star' },
  { id: 'heart', emoji: '❤️', color: '#EF4444', name: 'Heart' },
  { id: 'diamond', emoji: '💎', color: '#06B6D4', name: 'Diamond' },
];

export const SEQUENCE_LEVELS = [
  { level: 1, sequenceLength: 3, showTime: 1500, description: 'Remember 3 shapes' },
  { level: 2, sequenceLength: 4, showTime: 1200, description: 'Remember 4 shapes' },
  { level: 3, sequenceLength: 5, showTime: 1000, description: 'Remember 5 shapes' },
  { level: 4, sequenceLength: 6, showTime: 800, description: 'Remember 6 shapes' },
  { level: 5, sequenceLength: 7, showTime: 700, description: 'Remember 7 shapes' },
];

/**
 * Odd One Out Data
 * Evidence: Visual discrimination improves letter recognition
 * Source: Stein, J. (2001). Visual processing and dyslexia
 */
export const ODD_ONE_OUT_ROUNDS = [
  // Easy - clearly different words
  { words: ['cat', 'cat', 'cat', 'bat'], answer: 3, difficulty: 'easy' },
  { words: ['dog', 'dog', 'log', 'dog'], answer: 2, difficulty: 'easy' },
  { words: ['sun', 'sun', 'sun', 'run'], answer: 3, difficulty: 'easy' },
  { words: ['hat', 'hot', 'hat', 'hat'], answer: 1, difficulty: 'easy' },

  // Medium - subtle differences
  { words: ['was', 'saw', 'was', 'was'], answer: 1, difficulty: 'medium' },
  { words: ['pot', 'pot', 'pot', 'top'], answer: 3, difficulty: 'medium' },
  { words: ['god', 'dog', 'dog', 'dog'], answer: 0, difficulty: 'medium' },
  { words: ['tap', 'pat', 'tap', 'tap'], answer: 1, difficulty: 'medium' },

  // Hard - very similar words with subtle letter changes
  { words: ['form', 'from', 'form', 'form'], answer: 1, difficulty: 'hard' },
  { words: ['cloud', 'could', 'cloud', 'cloud'], answer: 1, difficulty: 'hard' },
  { words: ['quiet', 'quiet', 'quite', 'quiet'], answer: 2, difficulty: 'hard' },
  { words: ['angel', 'angle', 'angel', 'angel'], answer: 1, difficulty: 'hard' },
];

/**
 * Sound Matching Data
 * Evidence: Phonemic awareness is critical for reading development
 * Source: Bradley & Bryant (1983). Rhyme and reading research
 */
export const SOUND_MATCHING_ROUNDS = [
  {
    targetWord: 'cat',
    options: [
      { word: 'hat', emoji: '🎩', isMatch: true },
      { word: 'dog', emoji: '🐕', isMatch: false },
      { word: 'sun', emoji: '☀️', isMatch: false },
    ],
    matchType: 'rhyme',
    difficulty: 'easy',
  },
  {
    targetWord: 'ball',
    options: [
      { word: 'tall', emoji: '📏', isMatch: true },
      { word: 'cat', emoji: '🐱', isMatch: false },
      { word: 'bird', emoji: '🐦', isMatch: false },
    ],
    matchType: 'rhyme',
    difficulty: 'easy',
  },
  {
    targetWord: 'bed',
    options: [
      { word: 'bear', emoji: '🐻', isMatch: true },
      { word: 'cat', emoji: '🐱', isMatch: false },
      { word: 'dog', emoji: '🐕', isMatch: false },
    ],
    matchType: 'start',
    difficulty: 'easy',
  },
  {
    targetWord: 'moon',
    options: [
      { word: 'spoon', emoji: '🥄', isMatch: true },
      { word: 'star', emoji: '⭐', isMatch: false },
      { word: 'cloud', emoji: '☁️', isMatch: false },
    ],
    matchType: 'rhyme',
    difficulty: 'medium',
  },
  {
    targetWord: 'tree',
    options: [
      { word: 'bee', emoji: '🐝', isMatch: true },
      { word: 'leaf', emoji: '🍃', isMatch: false },
      { word: 'bird', emoji: '🐦', isMatch: false },
    ],
    matchType: 'rhyme',
    difficulty: 'medium',
  },
  {
    targetWord: 'snake',
    options: [
      { word: 'star', emoji: '⭐', isMatch: true },
      { word: 'bird', emoji: '🐦', isMatch: false },
      { word: 'fish', emoji: '🐟', isMatch: false },
    ],
    matchType: 'start',
    difficulty: 'medium',
  },
  {
    targetWord: 'light',
    options: [
      { word: 'night', emoji: '🌙', isMatch: true },
      { word: 'day', emoji: '☀️', isMatch: false },
      { word: 'lamp', emoji: '💡', isMatch: false },
    ],
    matchType: 'rhyme',
    difficulty: 'hard',
  },
  {
    targetWord: 'flower',
    options: [
      { word: 'tower', emoji: '🗼', isMatch: true },
      { word: 'garden', emoji: '🌳', isMatch: false },
      { word: 'bee', emoji: '🐝', isMatch: false },
    ],
    matchType: 'rhyme',
    difficulty: 'hard',
  },
];

type Difficulty = 'easy' | 'medium' | 'hard';

type SyllableWord = { word: string; syllables: string[]; difficulty: Difficulty };
type ReadingPassage = {
  id: 'story-1' | 'story-2' | 'story-3';
  title: string;
  lines: string[];
  difficulty: Difficulty;
};
type TrueFalseQuestion = { question: string; correct: boolean };

type OddOneOutRound = { words: [string, string, string, string]; answer: number; difficulty: Difficulty };
type SoundMatchingRound = {
  targetWord: string;
  options: Array<{ word: string; emoji: string; isMatch: boolean }>;
  matchType: 'rhyme' | 'start';
  difficulty: Difficulty;
};

export const EXERCISE_CONTENT: Record<
  'wordFlash' | 'syllableGame' | 'readingTracker' | 'oddOneOut' | 'soundMatching' | 'encouragements',
  any
> = {
  wordFlash: {
    en: {
      easy: ['the', 'and', 'cat', 'dog', 'run', 'big', 'red', 'sun', 'fun', 'hat'],
      medium: ['happy', 'jump', 'blue', 'green', 'small', 'fast', 'play', 'read', 'book', 'tree'],
      hard: ['butterfly', 'elephant', 'rainbow', 'beautiful', 'wonderful', 'adventure', 'together', 'important', 'different', 'remember'],
    },
    ru: {
      easy: ['кот', 'пёс', 'дом', 'мяч', 'бег', 'большой', 'красный', 'солнце', 'весело', 'шляпа'],
      medium: ['счастливый', 'прыгать', 'синий', 'зелёный', 'маленький', 'быстро', 'играть', 'читать', 'книга', 'дерево'],
      hard: ['бабочка', 'слон', 'радуга', 'красивый', 'чудесный', 'приключение', 'вместе', 'важный', 'разный', 'помнить'],
    },
    kz: {
      easy: ['мысық', 'ит', 'үй', 'доп', 'жүгіру', 'үлкен', 'қызыл', 'күн', 'қуаныш', 'баскиім'],
      medium: ['бақытты', 'секіру', 'көк', 'жасыл', 'кіші', 'жылдам', 'ойнау', 'оқу', 'кітап', 'ағаш'],
      hard: ['көбелек', 'піл', 'кемпірқосақ', 'әдемі', 'тамаша', 'шытырман', 'бірге', 'маңызды', 'әртүрлі', 'есте сақтау'],
    },
  },

  syllableGame: {
    en: {
      words: [
        { word: 'cat', syllables: ['cat'], difficulty: 'easy' },
        { word: 'rabbit', syllables: ['rab', 'bit'], difficulty: 'easy' },
        { word: 'rainbow', syllables: ['rain', 'bow'], difficulty: 'easy' },
        { word: 'banana', syllables: ['ba', 'na', 'na'], difficulty: 'easy' },
        { word: 'butterfly', syllables: ['but', 'ter', 'fly'], difficulty: 'medium' },
        { word: 'elephant', syllables: ['el', 'e', 'phant'], difficulty: 'medium' },
        { word: 'dinosaur', syllables: ['di', 'no', 'saur'], difficulty: 'medium' },
        { word: 'watermelon', syllables: ['wa', 'ter', 'mel', 'on'], difficulty: 'hard' },
        { word: 'helicopter', syllables: ['hel', 'i', 'cop', 'ter'], difficulty: 'hard' },
        { word: 'caterpillar', syllables: ['cat', 'er', 'pil', 'lar'], difficulty: 'hard' },
      ] satisfies SyllableWord[],
    },
    ru: {
      words: [
        { word: 'кот', syllables: ['кот'], difficulty: 'easy' },
        { word: 'мама', syllables: ['ма', 'ма'], difficulty: 'easy' },
        { word: 'радуга', syllables: ['ра', 'ду', 'га'], difficulty: 'easy' },
        { word: 'банан', syllables: ['ба', 'нан'], difficulty: 'easy' },
        { word: 'бабочка', syllables: ['ба', 'бо', 'чка'], difficulty: 'medium' },
        { word: 'слон', syllables: ['слон'], difficulty: 'medium' },
        { word: 'динозавр', syllables: ['ди', 'но', 'завр'], difficulty: 'medium' },
        { word: 'арбуз', syllables: ['ар', 'буз'], difficulty: 'hard' },
        { word: 'вертолёт', syllables: ['вер', 'то', 'лёт'], difficulty: 'hard' },
        { word: 'гусеница', syllables: ['гу', 'се', 'ни', 'ца'], difficulty: 'hard' },
      ] satisfies SyllableWord[],
    },
    kz: {
      words: [
        { word: 'бала', syllables: ['ба', 'ла'], difficulty: 'easy' },
        { word: 'қала', syllables: ['қа', 'ла'], difficulty: 'easy' },
        { word: 'шала', syllables: ['ша', 'ла'], difficulty: 'easy' },
        { word: 'кітап', syllables: ['кі', 'тап'], difficulty: 'easy' },
        { word: 'көбелек', syllables: ['кө', 'бе', 'лек'], difficulty: 'medium' },
        { word: 'әдемі', syllables: ['ә', 'де', 'мі'], difficulty: 'medium' },
        { word: 'терезе', syllables: ['те', 'ре', 'зе'], difficulty: 'medium' },
        { word: 'қарбыз', syllables: ['қар', 'быз'], difficulty: 'hard' },
        { word: 'кемпірқосақ', syllables: ['кем', 'пір', 'қо', 'сақ'], difficulty: 'hard' },
        { word: 'есте сақтау', syllables: ['ес', 'те', 'сақ', 'тау'], difficulty: 'hard' },
      ] satisfies SyllableWord[],
    },
  },

  readingTracker: {
    en: {
      passages: [
        {
          id: 'story-1',
          title: 'The Happy Dog',
          lines: [
            'Max was a happy little dog.',
            'He loved to play in the park.',
            'Every day, he would run and jump.',
            'His favorite toy was a red ball.',
            'Max had many friends at the park.',
            'They would play together all day long.',
          ],
          difficulty: 'easy',
        },
        {
          id: 'story-2',
          title: 'The Magic Garden',
          lines: [
            'Once upon a time, there was a garden.',
            'In this garden, flowers could talk.',
            'The roses were red and very kind.',
            'A little girl named Lily found the garden.',
            'She visited every day to hear their stories.',
            'The flowers taught her to be a good friend.',
          ],
          difficulty: 'medium',
        },
        {
          id: 'story-3',
          title: 'Space Adventure',
          lines: [
            'Captain Luna looked out the spaceship window.',
            'The stars sparkled like diamonds in the dark.',
            'Today was a special day for the crew.',
            'They were going to land on a new planet.',
            'Her robot friend, Beeper, beeped happily.',
            'Together, they would discover something amazing.',
          ],
          difficulty: 'hard',
        },
      ] satisfies ReadingPassage[],
      quiz: {
        'story-1': [
          { question: 'Max was a happy dog.', correct: true },
          { question: 'Max liked to play at home.', correct: false },
          { question: "Max's favorite toy was a red ball.", correct: true },
        ] satisfies TrueFalseQuestion[],
        'story-2': [
          { question: 'The flowers in the garden could talk.', correct: true },
          { question: 'The roses were blue.', correct: false },
          { question: 'A girl named Lily visited the garden.', correct: true },
        ] satisfies TrueFalseQuestion[],
        'story-3': [
          { question: 'Captain Luna was on a spaceship.', correct: true },
          { question: 'They had been to this planet before.', correct: false },
          { question: 'Beeper was a robot friend.', correct: true },
        ] satisfies TrueFalseQuestion[],
      } as Record<string, TrueFalseQuestion[]>,
    },
    ru: {
      passages: [
        {
          id: 'story-1',
          title: 'Счастливый пёс',
          lines: [
            'Макс был весёлым маленьким псом.',
            'Он любил играть в парке.',
            'Каждый день он бегал и прыгал.',
            'Его любимой игрушкой был красный мяч.',
            'У Макса было много друзей в парке.',
            'Они играли вместе целый день.',
          ],
          difficulty: 'easy',
        },
        {
          id: 'story-2',
          title: 'Волшебный сад',
          lines: [
            'Жил-был чудесный сад.',
            'В этом саду цветы умели говорить.',
            'Розы были красные и очень добрые.',
            'Девочка Лиля нашла этот сад.',
            'Она приходила каждый день слушать истории.',
            'Цветы учили её быть хорошим другом.',
          ],
          difficulty: 'medium',
        },
        {
          id: 'story-3',
          title: 'Космическое приключение',
          lines: [
            'Капитан Луна смотрела в окно корабля.',
            'Звёзды сияли в темноте.',
            'Сегодня был особенный день для команды.',
            'Они собирались сесть на новую планету.',
            'Её робот-друг Бипер радостно пищал.',
            'Вместе они откроют что-то удивительное.',
          ],
          difficulty: 'hard',
        },
      ] satisfies ReadingPassage[],
      quiz: {
        'story-1': [
          { question: 'Макс был весёлым псом.', correct: true },
          { question: 'Макс играл только дома.', correct: false },
          { question: 'Любимой игрушкой Макса был красный мяч.', correct: true },
        ] satisfies TrueFalseQuestion[],
        'story-2': [
          { question: 'Цветы в саду умели говорить.', correct: true },
          { question: 'Розы были синие.', correct: false },
          { question: 'Девочка Лиля нашла сад.', correct: true },
        ] satisfies TrueFalseQuestion[],
        'story-3': [
          { question: 'Капитан Луна была на корабле.', correct: true },
          { question: 'Они уже были на этой планете.', correct: false },
          { question: 'Бипер был роботом-другом.', correct: true },
        ] satisfies TrueFalseQuestion[],
      } as Record<string, TrueFalseQuestion[]>,
    },
    kz: {
      passages: [
        {
          id: 'story-1',
          title: 'Көңілді ит',
          lines: [
            'Макс көңілді кішкентай ит еді.',
            'Ол саябақта ойнағанды жақсы көрді.',
            'Күн сайын ол жүгіріп, секіретін.',
            'Ең сүйікті ойыншығы қызыл доп болды.',
            'Саябақта оның достары көп еді.',
            'Олар күні бойы бірге ойнайтын.',
          ],
          difficulty: 'easy',
        },
        {
          id: 'story-2',
          title: 'Сиқырлы бақ',
          lines: [
            'Ертеде бір әдемі бақ болыпты.',
            'Ол бақта гүлдер сөйлей алады екен.',
            'Раушандар қызыл әрі мейірімді болған.',
            'Ләйлә атты кішкентай қыз бақты тауыпты.',
            'Ол күнде келіп, әңгімелер тыңдайтын.',
            'Гүлдер оған жақсы дос болуды үйреткен.',
          ],
          difficulty: 'medium',
        },
        {
          id: 'story-3',
          title: 'Ғарыш сапары',
          lines: [
            'Капитан Луна кеменің терезесінен қарады.',
            'Жұлдыздар түнде жарқырап тұрды.',
            'Бүгін команда үшін ерекше күн еді.',
            'Олар жаңа планетаға қонбақ болды.',
            'Робот-досы Бипер қуанып дыбыс шығарды.',
            'Екеуі бірге керемет жаңалық ашады.',
          ],
          difficulty: 'hard',
        },
      ] satisfies ReadingPassage[],
      quiz: {
        'story-1': [
          { question: 'Макс көңілді ит еді.', correct: true },
          { question: 'Макс тек үйде ойнады.', correct: false },
          { question: 'Макстың сүйікті ойыншығы қызыл доп болды.', correct: true },
        ] satisfies TrueFalseQuestion[],
        'story-2': [
          { question: 'Бақтағы гүлдер сөйлей алды.', correct: true },
          { question: 'Раушандар көк түсті болды.', correct: false },
          { question: 'Ләйлә бақты тауыпты.', correct: true },
        ] satisfies TrueFalseQuestion[],
        'story-3': [
          { question: 'Капитан Луна ғарыш кемесінде болды.', correct: true },
          { question: 'Олар бұл планетаға бұрын барған.', correct: false },
          { question: 'Бипер — робот-дос.', correct: true },
        ] satisfies TrueFalseQuestion[],
      } as Record<string, TrueFalseQuestion[]>,
    },
  },

  oddOneOut: {
    en: {
      rounds: [
        { words: ['cat', 'cat', 'cat', 'bat'], answer: 3, difficulty: 'easy' },
        { words: ['dog', 'dog', 'log', 'dog'], answer: 2, difficulty: 'easy' },
        { words: ['sun', 'sun', 'sun', 'run'], answer: 3, difficulty: 'easy' },
        { words: ['hat', 'hot', 'hat', 'hat'], answer: 1, difficulty: 'easy' },
        { words: ['was', 'saw', 'was', 'was'], answer: 1, difficulty: 'medium' },
        { words: ['pot', 'pot', 'pot', 'top'], answer: 3, difficulty: 'medium' },
        { words: ['god', 'dog', 'dog', 'dog'], answer: 0, difficulty: 'medium' },
        { words: ['tap', 'pat', 'tap', 'tap'], answer: 1, difficulty: 'medium' },
        { words: ['form', 'from', 'form', 'form'], answer: 1, difficulty: 'hard' },
        { words: ['cloud', 'could', 'cloud', 'cloud'], answer: 1, difficulty: 'hard' },
        { words: ['quiet', 'quiet', 'quite', 'quiet'], answer: 2, difficulty: 'hard' },
        { words: ['angel', 'angle', 'angel', 'angel'], answer: 1, difficulty: 'hard' },
      ] satisfies OddOneOutRound[],
    },
    ru: {
      rounds: [
        { words: ['кот', 'кот', 'кот', 'код'], answer: 3, difficulty: 'easy' },
        { words: ['дом', 'дом', 'дом', 'дым'], answer: 3, difficulty: 'easy' },
        { words: ['лук', 'лук', 'люк', 'лук'], answer: 2, difficulty: 'easy' },
        { words: ['шар', 'шар', 'шар', 'шаг'], answer: 3, difficulty: 'easy' },
        { words: ['сон', 'сон', 'сок', 'сон'], answer: 2, difficulty: 'medium' },
        { words: ['мир', 'тир', 'мир', 'мир'], answer: 1, difficulty: 'medium' },
        { words: ['лес', 'лёс', 'лес', 'лес'], answer: 1, difficulty: 'medium' },
        { words: ['ток', 'кот', 'кот', 'кот'], answer: 0, difficulty: 'medium' },
        { words: ['страна', 'сторона', 'страна', 'страна'], answer: 1, difficulty: 'hard' },
        { words: ['письмо', 'песмо', 'письмо', 'письмо'], answer: 1, difficulty: 'hard' },
        { words: ['класс', 'клаcc', 'класс', 'класс'], answer: 1, difficulty: 'hard' },
        { words: ['вместе', 'вмести', 'вместе', 'вместе'], answer: 1, difficulty: 'hard' },
      ] satisfies OddOneOutRound[],
    },
    kz: {
      rounds: [
        { words: ['тал', 'тал', 'тал', 'бал'], answer: 3, difficulty: 'easy' },
        { words: ['қол', 'қол', 'қол', 'жол'], answer: 3, difficulty: 'easy' },
        { words: ['күн', 'күн', 'көн', 'күн'], answer: 2, difficulty: 'easy' },
        { words: ['дос', 'дос', 'дос', 'тос'], answer: 3, difficulty: 'easy' },
        { words: ['қала', 'қала', 'шала', 'қала'], answer: 2, difficulty: 'medium' },
        { words: ['кітап', 'кітап', 'кітап', 'қитап'], answer: 3, difficulty: 'medium' },
        { words: ['әдемі', 'әдемі', 'әдемі', 'әдеби'], answer: 3, difficulty: 'medium' },
        { words: ['жасыл', 'жасыл', 'жазыл', 'жасыл'], answer: 2, difficulty: 'medium' },
        { words: ['есте', 'есте', 'еске', 'есте'], answer: 2, difficulty: 'hard' },
        { words: ['жылдам', 'жылдам', 'жылдам', 'жылдан'], answer: 3, difficulty: 'hard' },
        { words: ['маңызды', 'маңызды', 'маңызды', 'мaңызды'], answer: 3, difficulty: 'hard' },
        { words: ['керемет', 'керемет', 'керемет', 'кереметт'], answer: 3, difficulty: 'hard' },
      ] satisfies OddOneOutRound[],
    },
  },

  soundMatching: {
    en: {
      rounds: [
        {
          targetWord: 'cat',
          options: [
            { word: 'hat', emoji: '🎩', isMatch: true },
            { word: 'dog', emoji: '🐕', isMatch: false },
            { word: 'sun', emoji: '☀️', isMatch: false },
          ],
          matchType: 'rhyme',
          difficulty: 'easy',
        },
        {
          targetWord: 'ball',
          options: [
            { word: 'tall', emoji: '📏', isMatch: true },
            { word: 'cat', emoji: '🐱', isMatch: false },
            { word: 'bird', emoji: '🐦', isMatch: false },
          ],
          matchType: 'rhyme',
          difficulty: 'easy',
        },
        {
          targetWord: 'bed',
          options: [
            { word: 'bear', emoji: '🐻', isMatch: true },
            { word: 'cat', emoji: '🐱', isMatch: false },
            { word: 'dog', emoji: '🐕', isMatch: false },
          ],
          matchType: 'start',
          difficulty: 'easy',
        },
        {
          targetWord: 'moon',
          options: [
            { word: 'spoon', emoji: '🥄', isMatch: true },
            { word: 'star', emoji: '⭐', isMatch: false },
            { word: 'cloud', emoji: '☁️', isMatch: false },
          ],
          matchType: 'rhyme',
          difficulty: 'medium',
        },
        {
          targetWord: 'snake',
          options: [
            { word: 'star', emoji: '⭐', isMatch: true },
            { word: 'bird', emoji: '🐦', isMatch: false },
            { word: 'fish', emoji: '🐟', isMatch: false },
          ],
          matchType: 'start',
          difficulty: 'medium',
        },
        {
          targetWord: 'light',
          options: [
            { word: 'night', emoji: '🌙', isMatch: true },
            { word: 'day', emoji: '☀️', isMatch: false },
            { word: 'lamp', emoji: '💡', isMatch: false },
          ],
          matchType: 'rhyme',
          difficulty: 'hard',
        },
      ] satisfies SoundMatchingRound[],
    },
    ru: {
      rounds: [
        {
          targetWord: 'кот',
          options: [
            { word: 'рот', emoji: '👄', isMatch: true },
            { word: 'дом', emoji: '🏠', isMatch: false },
            { word: 'лес', emoji: '🌲', isMatch: false },
          ],
          matchType: 'rhyme',
          difficulty: 'easy',
        },
        {
          targetWord: 'мяч',
          options: [
            { word: 'врач', emoji: '🧑‍⚕️', isMatch: true },
            { word: 'кот', emoji: '🐱', isMatch: false },
            { word: 'снег', emoji: '❄️', isMatch: false },
          ],
          matchType: 'rhyme',
          difficulty: 'easy',
        },
        {
          targetWord: 'дом',
          options: [
            { word: 'дуб', emoji: '🌳', isMatch: true },
            { word: 'кот', emoji: '🐱', isMatch: false },
            { word: 'мяч', emoji: '⚽', isMatch: false },
          ],
          matchType: 'start',
          difficulty: 'easy',
        },
        {
          targetWord: 'луна',
          options: [
            { word: 'струна', emoji: '🎸', isMatch: true },
            { word: 'трава', emoji: '🌿', isMatch: false },
            { word: 'река', emoji: '🏞️', isMatch: false },
          ],
          matchType: 'rhyme',
          difficulty: 'medium',
        },
        {
          targetWord: 'снег',
          options: [
            { word: 'сова', emoji: '🦉', isMatch: true },
            { word: 'мяч', emoji: '⚽', isMatch: false },
            { word: 'кот', emoji: '🐱', isMatch: false },
          ],
          matchType: 'start',
          difficulty: 'medium',
        },
        {
          targetWord: 'ночь',
          options: [
            { word: 'дочь', emoji: '👧', isMatch: true },
            { word: 'день', emoji: '☀️', isMatch: false },
            { word: 'мост', emoji: '🌉', isMatch: false },
          ],
          matchType: 'rhyme',
          difficulty: 'hard',
        },
      ] satisfies SoundMatchingRound[],
    },
    kz: {
      rounds: [
        {
          targetWord: 'қала',
          options: [
            { word: 'шала', emoji: '🏙️', isMatch: true },
            { word: 'үй', emoji: '🏠', isMatch: false },
            { word: 'бақ', emoji: '🌳', isMatch: false },
          ],
          matchType: 'rhyme',
          difficulty: 'easy',
        },
        {
          targetWord: 'бала',
          options: [
            { word: 'дала', emoji: '🌾', isMatch: true },
            { word: 'доп', emoji: '⚽', isMatch: false },
            { word: 'су', emoji: '💧', isMatch: false },
          ],
          matchType: 'rhyme',
          difficulty: 'easy',
        },
        {
          targetWord: 'бас',
          options: [
            { word: 'бала', emoji: '🧒', isMatch: true },
            { word: 'тас', emoji: '🪨', isMatch: false },
            { word: 'ат', emoji: '🐴', isMatch: false },
          ],
          matchType: 'start',
          difficulty: 'easy',
        },
        {
          targetWord: 'күн',
          options: [
            { word: 'түн', emoji: '🌙', isMatch: true },
            { word: 'жел', emoji: '💨', isMatch: false },
            { word: 'қар', emoji: '❄️', isMatch: false },
          ],
          matchType: 'rhyme',
          difficulty: 'medium',
        },
        {
          targetWord: 'кітап',
          options: [
            { word: 'кеме', emoji: '🚢', isMatch: true },
            { word: 'доп', emoji: '⚽', isMatch: false },
            { word: 'үй', emoji: '🏠', isMatch: false },
          ],
          matchType: 'start',
          difficulty: 'medium',
        },
        {
          targetWord: 'жол',
          options: [
            { word: 'қол', emoji: '✋', isMatch: true },
            { word: 'көл', emoji: '🏞️', isMatch: false },
            { word: 'жел', emoji: '💨', isMatch: false },
          ],
          matchType: 'rhyme',
          difficulty: 'hard',
        },
      ] satisfies SoundMatchingRound[],
    },
  },

  encouragements: {
    en: [
      'Amazing work! 🌟',
      "You're getting better every day! 🚀",
      'Keep it up, superstar! ⭐',
      'Wow, that was fast! ⚡',
      'Fantastic job! 🎉',
      "You're a learning champion! 🏆",
      'Great thinking! 💡',
      'Super smart! 🧠',
      "You're doing great! 👏",
      'Incredible progress! 📈',
    ],
    ru: [
      'Отличная работа! 🌟',
      'Ты становишься лучше каждый день! 🚀',
      'Так держать, суперзвезда! ⭐',
      'Вау, как быстро! ⚡',
      'Прекрасно получилось! 🎉',
      'Ты чемпион обучения! 🏆',
      'Отличная мысль! 💡',
      'Ты очень умный(ая)! 🧠',
      'У тебя отлично выходит! 👏',
      'Невероятный прогресс! 📈',
    ],
    kz: [
      'Керемет жұмыс! 🌟',
      'Күн сайын жақсарып келесің! 🚀',
      'Жарайсың, суперстар! ⭐',
      'Вау, өте жылдам! ⚡',
      'Тамаша орындадың! 🎉',
      'Сен оқу чемпионысың! 🏆',
      'Өте жақсы ой! 💡',
      'Сен өте ақылдысың! 🧠',
      'Жақсы жасап жатырсың! 👏',
      'Керемет өсім! 📈',
    ],
  },
};

/**
 * Exercise Categories for the hub
 */
export const EXERCISE_CATEGORIES = [
  {
    id: 'reading',
    name: 'Reading',
    emoji: '📖',
    color: 'from-soft-blue to-blue-400',
    bgColor: 'bg-soft-blue',
    description: 'Practice reading and word recognition',
    exercises: ['word-flash', 'syllable-game', 'reading-tracker'],
  },
  {
    id: 'writing',
    name: 'Writing',
    emoji: '✍️',
    color: 'from-lavender to-purple-400',
    bgColor: 'bg-lavender',
    description: 'Practice letters and handwriting',
    exercises: ['letter-tracing', 'mirror-detective'],
  },
  {
    id: 'memory',
    name: 'Memory',
    emoji: '🧠',
    color: 'from-mint to-green-400',
    bgColor: 'bg-mint',
    description: 'Train your memory and attention',
    exercises: ['sequence-memory', 'odd-one-out', 'sound-matching'],
  },
];

/**
 * All exercises with metadata
 */
export const ALL_EXERCISES = [
  {
    id: 'word-flash',
    name: 'Word Flash',
    category: 'reading',
    emoji: '⚡',
    description: 'Recognize words quickly as they flash on screen',
    evidence: 'Improves sight word fluency (Shaywitz, 2003)',
    difficulty: 'Easy',
    duration: '2-3 min',
  },
  {
    id: 'syllable-game',
    name: 'Syllable Splitter',
    category: 'reading',
    emoji: '✂️',
    description: 'Break words into syllables by clapping along',
    evidence: 'Phonological awareness training (Goswami, 2002)',
    difficulty: 'Medium',
    duration: '3-4 min',
  },
  {
    id: 'reading-tracker',
    name: 'Reading Tracker',
    category: 'reading',
    emoji: '📏',
    description: 'Follow along with stories using a guide',
    evidence: 'Reduces line skipping (Schneps et al., 2013)',
    difficulty: 'Easy',
    duration: '4-5 min',
  },
  {
    id: 'letter-tracing',
    name: 'Letter Tracing',
    category: 'writing',
    emoji: '✏️',
    description: 'Trace letters to learn their shapes',
    evidence: 'Improves letter formation (Berninger, 2012)',
    difficulty: 'Easy',
    duration: '3-4 min',
  },
  {
    id: 'mirror-detective',
    name: 'Mirror Detective',
    category: 'writing',
    emoji: '🔍',
    description: 'Find the backwards letters hiding in the grid',
    evidence: 'Reduces reversals (Fischer & Luxemburg, 2020)',
    difficulty: 'Medium',
    duration: '2-3 min',
  },
  {
    id: 'sequence-memory',
    name: 'Sequence Memory',
    category: 'memory',
    emoji: '🎯',
    description: 'Remember and repeat shape sequences',
    evidence: 'Working memory training (Gathercole, 2008)',
    difficulty: 'Medium',
    duration: '3-4 min',
  },
  {
    id: 'odd-one-out',
    name: 'Odd One Out',
    category: 'memory',
    emoji: '🔎',
    description: 'Find the word that is different from the others',
    evidence: 'Visual discrimination (Stein, 2001)',
    difficulty: 'Easy',
    duration: '2-3 min',
  },
  {
    id: 'sound-matching',
    name: 'Sound Matching',
    category: 'memory',
    emoji: '🔊',
    description: 'Match words that sound alike',
    evidence: 'Phonemic awareness (Bradley & Bryant, 1983)',
    difficulty: 'Medium',
    duration: '3-4 min',
  },
];

/**
 * Motivational messages
 */
export const ENCOURAGEMENT_MESSAGES = EXERCISE_CONTENT.encouragements.en;

/**
 * Get a random encouragement message
 */
export const getRandomEncouragement = (language?: string): string => {
  const exerciseLang = getExerciseLanguage(language);
  const list = EXERCISE_CONTENT.encouragements[exerciseLang] || EXERCISE_CONTENT.encouragements.en;
  return list[Math.floor(Math.random() * list.length)];
};
