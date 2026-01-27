/**
 * Exercise Data and Content
 * All exercise content for the dyslexia practice section
 * Evidence-based exercises designed for children ages 5-10
 */

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
export const ENCOURAGEMENT_MESSAGES = [
  "Amazing work! 🌟",
  "You're getting better every day! 🚀",
  "Keep it up, superstar! ⭐",
  "Wow, that was fast! ⚡",
  "Fantastic job! 🎉",
  "You're a learning champion! 🏆",
  "Great thinking! 💡",
  "Super smart! 🧠",
  "You're doing great! 👏",
  "Incredible progress! 📈",
];

/**
 * Get a random encouragement message
 */
export const getRandomEncouragement = (): string => {
  return ENCOURAGEMENT_MESSAGES[Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length)];
};
