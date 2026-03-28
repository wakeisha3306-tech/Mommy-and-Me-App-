export interface PresetAffirmation {
  text: string;
  emoji: string;
  theme: "self-love" | "healing" | "confidence" | "bond" | "growth";
}

export const PRESET_AFFIRMATIONS: PresetAffirmation[] = [
  { text: "I am allowed to love myself in the middle of becoming.", emoji: "💞", theme: "self-love" },
  { text: "I do not have to earn softness. I deserve it now.", emoji: "🌷", theme: "self-love" },
  { text: "I am enough, even on the days I feel tender.", emoji: "✨", theme: "self-love" },
  { text: "I can be gentle with myself and still be growing.", emoji: "🌿", theme: "self-love" },
  { text: "My heart deserves the same kindness I give to everyone else.", emoji: "🤍", theme: "self-love" },
  { text: "I am learning to speak to myself like someone deeply loved.", emoji: "🕊️", theme: "self-love" },
  { text: "There is beauty in the way I keep showing up for my life.", emoji: "🌸", theme: "self-love" },
  { text: "I am not behind. I am unfolding in my own time.", emoji: "⏳", theme: "self-love" },
  { text: "My worth does not shrink on hard days.", emoji: "💛", theme: "self-love" },
  { text: "I can rest without feeling guilty for needing care.", emoji: "🌙", theme: "self-love" },
  { text: "Even when I feel unsure, I am still deeply valuable.", emoji: "🫶", theme: "self-love" },
  { text: "I can honor the woman I am and the one I am still becoming.", emoji: "🌺", theme: "self-love" },
  { text: "My softness is not weakness. It is one of the ways I stay whole.", emoji: "🩷", theme: "self-love" },
  { text: "I can look at myself with honesty and still choose compassion.", emoji: "🪞", theme: "self-love" },

  { text: "Healing can be slow and still be real.", emoji: "🌱", theme: "healing" },
  { text: "I am allowed to carry hope while I heal.", emoji: "🫶", theme: "healing" },
  { text: "The parts of me that hurt are still worthy of tenderness.", emoji: "💗", theme: "healing" },
  { text: "I do not have to pretend to be okay to be lovable.", emoji: "🌧️", theme: "healing" },
  { text: "My healing does not have to look graceful to still be holy.", emoji: "🕯️", theme: "healing" },
  { text: "I can let today be lighter than yesterday.", emoji: "☀️", theme: "healing" },
  { text: "Even when my heart is tired, it is still learning how to trust joy again.", emoji: "🌤️", theme: "healing" },
  { text: "I am allowed to outgrow pain that once felt permanent.", emoji: "🪷", theme: "healing" },
  { text: "Some days healing looks like breathing a little easier.", emoji: "🍃", theme: "healing" },
  { text: "I can honor what I survived without living there forever.", emoji: "🫂", theme: "healing" },
  { text: "I do not need to rush past my feelings to prove I am strong.", emoji: "💧", theme: "healing" },
  { text: "My body and heart are both allowed to ask for slower, gentler days.", emoji: "🛁", theme: "healing" },
  { text: "I can grieve what hurt me and still believe in better days.", emoji: "🌈", theme: "healing" },
  { text: "Healing sometimes sounds like laughter returning to a room that was quiet for too long.", emoji: "🌼", theme: "healing" },

  { text: "My voice matters in every room I enter.", emoji: "🗣️", theme: "confidence" },
  { text: "I carry strength that does not need to shout to be powerful.", emoji: "👑", theme: "confidence" },
  { text: "I trust the wisdom that lives inside me.", emoji: "🔥", theme: "confidence" },
  { text: "I can walk forward without shrinking myself for comfort.", emoji: "🚶🏾‍♀️", theme: "confidence" },
  { text: "I have survived too much to doubt my resilience now.", emoji: "💪🏾", theme: "confidence" },
  { text: "I am capable of beginning again with grace.", emoji: "🌟", theme: "confidence" },
  { text: "The woman I am becoming can handle what is in front of her.", emoji: "🌺", theme: "confidence" },
  { text: "I belong in the future I keep dreaming about.", emoji: "🚪", theme: "confidence" },
  { text: "I can trust myself to make the next right choice.", emoji: "🧭", theme: "confidence" },
  { text: "I do not need permission to believe in myself.", emoji: "💫", theme: "confidence" },
  { text: "I can be nervous and still move like someone who knows she is worthy.", emoji: "🦋", theme: "confidence" },
  { text: "My presence carries value before I say a single word.", emoji: "🌞", theme: "confidence" },
  { text: "Confidence can be quiet, steady, and deeply rooted.", emoji: "🌳", theme: "confidence" },
  { text: "I have everything I need to take the next brave step.", emoji: "🛤️", theme: "confidence" },

  { text: "Love lives in the small ways we keep showing up for each other.", emoji: "💝", theme: "bond" },
  { text: "Our bond can hold truth, tenderness, and growth at the same time.", emoji: "🤎", theme: "bond" },
  { text: "The love between us is still growing, even in quiet seasons.", emoji: "🌼", theme: "bond" },
  { text: "We are allowed to begin again with each other, gently.", emoji: "🫶🏾", theme: "bond" },
  { text: "There is room for both of our hearts here.", emoji: "🏡", theme: "bond" },
  { text: "We can speak with honesty and still stay wrapped in love.", emoji: "💌", theme: "bond" },
  { text: "I am grateful for the way love keeps finding us again.", emoji: "🌹", theme: "bond" },
  { text: "Even when life is busy, our connection still matters deeply.", emoji: "🫂", theme: "bond" },
  { text: "The love between a mother and daughter can keep softening, healing, and blooming.", emoji: "🌻", theme: "bond" },
  { text: "We do not have to be perfect to be precious to each other.", emoji: "💖", theme: "bond" },
  { text: "A hard moment does not erase the love that lives between us.", emoji: "🧡", theme: "bond" },
  { text: "We can keep learning each other without losing tenderness.", emoji: "🤝", theme: "bond" },
  { text: "Sometimes love looks like trying again after a messy conversation.", emoji: "🌤️", theme: "bond" },
  { text: "Our relationship gets stronger every time we choose understanding over pride.", emoji: "🪢", theme: "bond" },

  { text: "I am growing beyond what tried to break me.", emoji: "🌄", theme: "growth" },
  { text: "My story did not end in the hard chapter.", emoji: "📖", theme: "growth" },
  { text: "What I have been through is not the limit of who I can become.", emoji: "🪴", theme: "growth" },
  { text: "I can honor my scars and still expect beautiful things.", emoji: "🌷", theme: "growth" },
  { text: "I am building a life that feels safer, softer, and more true.", emoji: "🏠", theme: "growth" },
  { text: "Each difficult season taught me something I can carry with love now.", emoji: "🧺", theme: "growth" },
  { text: "I am not who I was in survival mode, and that is a blessing.", emoji: "🕊️", theme: "growth" },
  { text: "Growth after struggle still counts, even when it comes in tiny steps.", emoji: "👣", theme: "growth" },
  { text: "I am allowed to imagine joy that lasts longer than the pain did.", emoji: "🌈", theme: "growth" },
  { text: "My life can hold grief and new beginnings at the same time.", emoji: "🌤️", theme: "growth" },
  { text: "I am becoming someone who trusts peace when it finally arrives.", emoji: "🪞", theme: "growth" },
  { text: "The version of me that kept going deserves to see what blooms next.", emoji: "🌺", theme: "growth" },
  { text: "I can be proud of how far I have come, even if I am still healing on the way.", emoji: "🏞️", theme: "growth" },
  { text: "The life ahead of me can be softer than the life behind me.", emoji: "🌅", theme: "growth" },
];

export function getDailyAffirmation() {
  const dayIndex = Math.floor(Date.now() / 86400000) % PRESET_AFFIRMATIONS.length;
  return PRESET_AFFIRMATIONS[dayIndex];
}
