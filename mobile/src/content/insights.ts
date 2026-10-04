/**
 * The Nine Insights journey.
 *
 * A guided, sequential practice inspired by ideas popularised in James Redfield's
 * novel "The Celestine Prophecy". All titles, teachings, practices and prompts
 * here are original writing for Synchros; nothing is quoted from the book.
 */

export type Insight = {
  n: number;
  title: string;
  essence: string; // one line shown on the path
  teaching: string[]; // short paragraphs
  practice: string;
  practiceDone: string; // label once done
  prompts: string[];
  feature?: 'pattern' | 'question';
};

export const INSIGHTS: Insight[] = [
  {
    n: 1,
    title: 'Notice the coincidences',
    essence: 'The restless sense that more is going on.',
    teaching: [
      'It usually starts as a feeling: life is meant to be more than routine, and some events seem too well timed to be random.',
      'A name you keep hearing. A stranger who says exactly what you needed. Most of us wave these moments away. This first step is simply to stop dismissing them.',
      'You are not asked to believe anything yet. Only to notice, and to write it down.',
    ],
    practice: 'Log every coincidence you notice today, however small it seems.',
    practiceDone: 'I logged what I noticed',
    prompts: [
      'Recall a coincidence that changed the direction of your life. What happened?',
      'What were you questioning or longing for at that time?',
      'If these moments are pointing somewhere, where do you hope it is?',
    ],
  },
  {
    n: 2,
    title: 'See the longer arc',
    essence: 'Your attention was shaped before you chose it.',
    teaching: [
      'Every era trains people to focus on something. For a long time, ours has trained us to chase security and things, and to stay busy enough not to ask why we are here.',
      'Your family passed on its own version of this focus. Seeing it clearly does not mean rejecting it. It means you get to choose what you pay attention to next.',
      'Step back and look at your life as one long story. Where are you in it now?',
    ],
    practice: 'Spend ten minutes today without your phone, just noticing what is around you.',
    practiceDone: 'I took ten quiet minutes',
    prompts: [
      'What did the people who raised you teach you to chase?',
      'What has that pursuit kept you too busy to notice?',
      'Looking at your life as one story, what chapter are you in right now?',
    ],
  },
  {
    n: 3,
    title: 'Feel the energy',
    essence: 'Beauty is how you sense life force.',
    teaching: [
      'Everything alive gives off a kind of energy. You already sense it: some places lift you, some people leave you lighter, some mornings everything looks unusually vivid.',
      'That heightened sense of beauty is a signal. When colours look richer and details stand out, your own energy is rising.',
      'Nature is the easiest place to practise this. Slow down near something living and let it fill you.',
    ],
    practice: 'Spend time near a tree, plant or open sky and notice what looks most alive.',
    practiceDone: 'I spent time with something living',
    prompts: [
      'Where do you feel most alive, reliably?',
      'What looked unusually beautiful to you recently?',
      'What drains your energy most consistently?',
    ],
  },
  {
    n: 4,
    title: 'Spot the power struggle',
    essence: 'People compete for energy without knowing it.',
    teaching: [
      'When we feel empty, we try to get energy from each other. We win arguments, take control, seek attention, or make others feel small. Afterwards one person feels strong and the other feels drained.',
      'Almost every conflict carries this hidden contest. Once you see it, you can stop playing.',
      'This week, watch how energy moves in your conversations: who leaves lighter, who leaves heavier.',
    ],
    practice: 'Notice one conversation today where the energy clearly shifted. Log it as a sign.',
    practiceDone: 'I noticed an energy shift',
    prompts: [
      'Who leaves you feeling drained, and what usually happens between you?',
      'When do you try to win, control or be right?',
      'What do you feel in your body right after a conflict?',
    ],
  },
  {
    n: 5,
    title: 'Connect to the source',
    essence: 'You can be filled without taking.',
    teaching: [
      'There is another way to feel full: connect to the larger energy that runs through everything, rather than pulling it from people.',
      'People describe it in many ways. Lightness. Belonging. Love without an object. It tends to arrive through stillness, beauty and gratitude.',
      'When you feel full this way, you stop needing to win. That is when the coincidences tend to quicken.',
    ],
    practice: 'Sit in stillness for five minutes and stay until you feel even slightly fuller.',
    practiceDone: 'I sat in stillness',
    prompts: [
      'Describe a time you felt connected to everything. What brought it on?',
      'What fills you without needing anyone else’s approval?',
      'What would you do differently if you felt full most of the day?',
    ],
  },
  {
    n: 6,
    title: 'Clear the past',
    essence: 'Name the pattern you learned as a child.',
    teaching: [
      'As children we each found a way to get attention and energy in our families. That strategy became a habit we still run without thinking.',
      'Some of us dominate. Some question and criticise. Some go distant and mysterious. Some plead and make others feel responsible for them.',
      'Choose the pattern that sounds most like you. Naming it is what loosens its grip, and it often explains the people and lessons your life keeps bringing back.',
    ],
    practice: 'Choose your pattern below, then catch it in action once today.',
    practiceDone: 'I caught my pattern in action',
    prompts: [
      'Whose behaviour in your childhood was your pattern a response to?',
      'When did your pattern show up this week?',
      'What would you say or do in those moments if you let the pattern go?',
    ],
    feature: 'pattern',
  },
  {
    n: 7,
    title: 'Follow the flow',
    essence: 'Hold a question. Let life answer it.',
    teaching: [
      'Once you are clear of old patterns, the real questions of your life come forward. Hold one of them consciously.',
      'Then watch. A thought arrives, a daydream, an urge to go somewhere or call someone. Follow it. Answers tend to come through exactly these intuitions and the coincidences they lead to.',
      'Your question will be shown on your Today screen so you can keep it close.',
    ],
    practice: 'Write your live question below and act on one intuition today.',
    practiceDone: 'I followed an intuition',
    prompts: [
      'Why does this question matter so much to you right now?',
      'Which intuition have you been ignoring?',
      'What answered you recently in a way you didn’t expect?',
    ],
    feature: 'question',
  },
  {
    n: 8,
    title: 'Lift each other',
    essence: 'Messages arrive through people.',
    teaching: [
      'Many of the answers you are looking for will come through other people. Someone crosses your path at exactly the right moment, with exactly the right words.',
      'You receive more of these messages when you give energy instead of taking it: full attention, sincere interest, seeing the best in someone.',
      'Treat each meaningful encounter as possibly carrying a message, for you or from you.',
    ],
    practice: 'Give one person your complete attention today and listen for their message.',
    practiceDone: 'I gave someone my full attention',
    prompts: [
      'Who has crossed your path lately with uncanny timing?',
      'What did someone say recently that has stayed with you?',
      'How could you lift someone this week?',
    ],
  },
  {
    n: 9,
    title: 'Live the emerging way',
    essence: 'Purpose over accumulation.',
    teaching: [
      'Imagine enough people living this way: following intuitions, giving energy, seeing coincidences as guidance. Over time a culture would change.',
      'Work would follow purpose. Life would get simpler. Meaning would matter more than accumulation.',
      'You don’t need to wait for that world. You can live a small piece of it now, starting with the next thing you do.',
    ],
    practice: 'Choose one act aligned with your purpose and do it today.',
    practiceDone: 'I acted on my purpose',
    prompts: [
      'What is your life’s work trying to become?',
      'What could you simplify to make room for it?',
      'How will you keep noticing, now that the journey is complete?',
    ],
  },
];

export const PATTERNS: { key: string; name: string; description: string }[] = [
  {
    key: 'dominate',
    name: 'Taking charge',
    description: 'You get energy by controlling the room: being forceful, intimidating or always right.',
  },
  {
    key: 'question',
    name: 'Questioning',
    description: 'You get energy by probing and finding fault, so others seek your approval.',
  },
  {
    key: 'distant',
    name: 'Going distant',
    description: 'You get energy by holding back and staying mysterious, so others come after you.',
  },
  {
    key: 'plead',
    name: 'Pleading',
    description: 'You get energy by showing how hard things are, so others feel responsible for you.',
  },
];

export const insightByNumber = (n: number) => INSIGHTS.find((i) => i.n === n);
