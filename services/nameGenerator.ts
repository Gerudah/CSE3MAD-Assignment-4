const ADJECTIVES = [
  'Bouncy', 'Brave', 'Bubbly', 'Cheerful', 'Clever', 'Cosmic', 'Dazzling',
  'Electric', 'Epic', 'Fluffy', 'Frosted', 'Giggly', 'Golden', 'Goofy',
  'Jazzy', 'Jolly', 'Legendary', 'Mighty', 'Neon', 'Peppy', 'Quirky',
  'Radiant', 'Silly', 'Sneaky', 'Speedy', 'Sparkly', 'Sunny', 'Thundering',
  'Tiny', 'Turbo', 'Ultra', 'Wiggly', 'Wobbly', 'Zappy', 'Zippy',
];

const NOUNS = [
  'Astronaut', 'Avocado', 'Biscuit', 'Cactus', 'Comet', 'Cookie', 'Dragon',
  'Dumpling', 'Flamingo', 'Galaxy', 'Hamster', 'Jellyfish', 'Koala', 'Llama',
  'Mango', 'Noodle', 'Pancake', 'Panda', 'Penguin', 'Pickle', 'Platypus',
  'Porcupine', 'Pumpkin', 'Rocket', 'Salamander', 'Sloth', 'Smoothie',
  'Squirrel', 'Taco', 'Unicorn', 'Waffle', 'Walrus', 'Wizard',
];

export function generateName(): string {
  const adj  = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj} ${noun}`;
}
