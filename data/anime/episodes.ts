import type { AnimeEpisode } from "@/lib/anime/types";

/**
 * Curated, human-verified anime episodes.
 *
 * RULES for adding a record:
 *  - Verify every field against `source` first. Unknown → null / omit, never guess.
 *  - Write summaries in your own words; link to the source instead of copying it.
 *  - Link Pokémon by National Dex species id.
 *  - Episode numbers are Serebii's overall numbering (Bulbapedia and Pokemon.com
 *    number some episodes differently, so don't mix sources).
 *
 * Verified against the Serebii.net episode guides and Animédex on 2026-11-01.
 * Bulbapedia blocks automated access, so it was not used for these records.
 * The guides don't state air dates, so `airDate` is null throughout.
 */

const SEREBII = "Serebii.net episode guide";
const VERIFIED = "2026-11-01";
const guide = (path: string) => `https://www.serebii.net/anime/epiguide/${path}.shtml`;

/* National Dex species ids used below */
const PIKACHU = 25;
const GASTLY = 92;
const HAUNTER = 93;
const GENGAR = 94;
const EEVEE = 133;
const VAPOREON = 134;
const JOLTEON = 135;
const FLAREON = 136;
const ESPEON = 196;
const UMBREON = 197;
const LEAFEON = 470;
const GLACEON = 471;

export const ANIME_EPISODES: AnimeEpisode[] = [
  /* ------------------------------ Pikachu ------------------------------- */
  {
    id: "indigo-001-pokemon-i-choose-you",
    title: "Pokémon! I Choose You!",
    series: "The Indigo League",
    episodeNumber: 1,
    airDate: null,
    summary:
      "Ten-year-old Ash oversleeps on the day he is meant to get his first Pokémon and is left with a stubborn Pikachu that won't stay in its Poké Ball.",
    characters: ["Ash", "Misty", "Professor Oak", "Gary", "Delia Ketchum"],
    pokemon: [
      {
        pokemonId: PIKACHU,
        role: "main",
        significance: "introduction",
        why: "The series begins here: Ash's partnership with Pikachu starts out rocky.",
        outcome: { level: "mild", text: "After a flock of Spearow attacks, Ash and Pikachu escape with Misty's help and the episode ends with a show of trust between them." },
      },
    ],
    spoilerLevel: "mild",
    source: { name: SEREBII, url: guide("indigo/001") },
    verifiedOn: VERIFIED,
  },

  /* ------------------------ Gengar / Haunter / Gastly -------------------- */
  {
    id: "indigo-023-the-tower-of-terror",
    title: "The Tower of Terror",
    series: "The Indigo League",
    episodeNumber: 23,
    airDate: null,
    summary:
      "Ash, Misty and Brock explore Lavender Town's Pokémon Tower hoping to find a Ghost-type Pokémon. The tower's Ghost Pokémon play pranks on everyone, including Team Rocket.",
    characters: ["Ash", "Brock", "Misty", "Jessie", "James"],
    pokemon: [
      {
        pokemonId: HAUNTER,
        role: "main",
        significance: "introduction",
        why: "Ash meets Haunter while searching Lavender Town's Pokémon Tower for a Ghost-type Pokémon.",
        outcome: { level: "major", text: "Haunter decides to follow Ash out of the tower, hoping to help him beat Sabrina." },
      },
      {
        pokemonId: GENGAR,
        role: "supporting",
        significance: "notable_appearance",
        why: "A wild Gengar is one of the tower's three prank-playing Ghost Pokémon, alongside Gastly and Haunter.",
      },
      {
        pokemonId: GASTLY,
        role: "supporting",
        significance: "notable_appearance",
        why: "Gastly is one of the tower's Ghost Pokémon that scare the visitors.",
      },
    ],
    spoilerLevel: "major",
    source: { name: SEREBII, url: guide("indigo/023") },
    verifiedOn: VERIFIED,
  },
  {
    id: "johto-183-a-ghost-of-a-chance",
    title: "A Ghost Of a Chance",
    series: "The Johto Saga",
    episodeNumber: 183,
    airDate: null,
    summary:
      "Inside an old tower full of illusions, Ash, Brock and Misty meet Morty and his ghostly Pokémon. When Team Rocket snatches Pikachu and Togepi, Morty's Gengar goes after them.",
    characters: ["Ash", "Brock", "Misty", "Morty", "Jessie", "James"],
    pokemon: [
      {
        pokemonId: GENGAR,
        role: "main",
        significance: "introduction",
        why: "Morty's Gengar is the star here: it is sent after Team Rocket when they snatch Pikachu and Togepi.",
        outcome: { level: "mild", text: "Gengar stops Jessie and James with psychic attacks, making them lose Pikachu and Togepi." },
      },
      {
        pokemonId: GASTLY,
        role: "supporting",
        significance: "notable_appearance",
        why: "Gastly is among the Ghost Pokémon hiding in the tower's illusions.",
      },
      {
        pokemonId: HAUNTER,
        role: "supporting",
        significance: "notable_appearance",
        why: "Haunter is among the Ghost Pokémon hiding in the tower's illusions.",
      },
    ],
    spoilerLevel: "mild",
    source: { name: SEREBII, url: guide("johto/183") },
    verifiedOn: VERIFIED,
  },
  {
    id: "journeys-1105-a-chilling-curse",
    title: "A Chilling Curse!",
    series: "Pokémon Journeys",
    episodeNumber: 1105,
    airDate: null,
    summary:
      "Strange incidents at Professor Cerise's laboratory are traced to a wild Gengar. Ash and Goh both want to catch it, but Ash starts acting strangely along the way.",
    characters: ["Ash", "Goh", "Professor Cerise", "Chrysa", "Ren", "Jessie", "James"],
    pokemon: [
      {
        pokemonId: GENGAR,
        role: "main",
        significance: "introduction",
        why: "This wild Gengar is behind the disturbances at the lab, and both Ash and Goh want to catch it.",
        outcome: { level: "major", text: "Serebii's event list for this episode records that Ash catches a Gengar, the start of Ash's Gengar." },
      },
    ],
    spoilerLevel: "major",
    source: { name: SEREBII, url: guide("pokemon/1105") },
    verifiedOn: VERIFIED,
  },
  {
    id: "journeys-1181-the-winding-path-to-greatness",
    title: "The Winding Path to Greatness!",
    series: "Pokémon Journeys",
    episodeNumber: 1181,
    airDate: null,
    summary:
      "Ash and Goh visit Allister in Stow-on-Side because Ash wants to teach his Gengar to Gigantamax. Allister says Gengar must eat Max Soup, which means collecting Max Mushrooms in a forest full of Ghost-type Pokémon.",
    characters: ["Ash", "Goh", "Professor Cerise", "Bea", "Allister"],
    pokemon: [
      {
        pokemonId: GENGAR,
        role: "main",
        significance: "character_development",
        why: "Gengar is the focus of Ash's effort to learn Gigantamax with Allister's help.",
        outcome: { level: "major", text: "Serebii's event list says Ash's Gengar becomes able to Gigantamax." },
      },
    ],
    spoilerLevel: "major",
    source: { name: SEREBII, url: guide("pokemon/1181") },
    verifiedOn: VERIFIED,
  },

  /* ----------------------- Umbreon / Eevee family ------------------------ */
  {
    id: "indigo-040-the-battling-eevee-brothers",
    title: "The Battling Eevee Brothers",
    series: "The Indigo League",
    episodeNumber: 40,
    airDate: null,
    summary:
      "Ash and friends return a chained-up Eevee to Mike in Stone Town, where his three brothers pressure him to evolve it. Team Rocket crashes the party and steals the evolution stones and Pokémon.",
    characters: ["Ash", "Brock", "Misty", "Jessie", "James", "Mikey", "Rainer", "Sparky", "Pyro"],
    pokemon: [
      {
        pokemonId: EEVEE,
        role: "main",
        significance: "character_development",
        why: "The episode is about whether this Eevee should evolve.",
        outcome: { level: "major", text: "Eevee uses Rage Tackle to blast Team Rocket away, and the brothers agree it can stay unevolved." },
      },
      {
        pokemonId: VAPOREON,
        role: "supporting",
        significance: "notable_appearance",
        why: "One of the three brothers owns a Vaporeon, which shows what evolving Eevee can lead to.",
      },
      {
        pokemonId: JOLTEON,
        role: "supporting",
        significance: "notable_appearance",
        why: "One of the three brothers owns a Jolteon.",
      },
      {
        pokemonId: FLAREON,
        role: "supporting",
        significance: "notable_appearance",
        why: "One of the three brothers owns a Flareon.",
      },
    ],
    spoilerLevel: "major",
    source: { name: SEREBII, url: guide("indigo/040") },
    verifiedOn: VERIFIED,
  },
  {
    id: "johto-173-power-play",
    title: "Power Play",
    series: "The Johto Saga",
    episodeNumber: 173,
    airDate: null,
    summary:
      "Gary and his Umbreon take on Alex Davis's Alakazam while Ash wants a battle with Gary himself. When a blackout hits, Team Rocket's Robo-Mecha Wobbuffet overpowers Ash and his friends at a power plant.",
    characters: ["Ash", "Brock", "Misty", "Gary", "Nurse Joy", "Alex Davis", "Jessie", "James"],
    pokemon: [
      {
        pokemonId: UMBREON,
        role: "main",
        significance: "introduction",
        why: "Gary's Umbreon makes its anime debut here (earliest in Serebii's Umbreon list).",
        outcome: { level: "mild", text: "Umbreon finishes Alakazam with Hidden Power, and later breaks the plug connecting the Robo-Mecha's power cord." },
      },
      {
        pokemonId: PIKACHU,
        role: "supporting",
        significance: "notable_appearance",
        why: "Pikachu is part of the group dealing with the blackout at the power plant.",
        outcome: { level: "mild", text: "Pikachu helps restore the electricity." },
      },
    ],
    spoilerLevel: "mild",
    source: { name: SEREBII, url: guide("johto/173") },
    verifiedOn: VERIFIED,
  },
  {
    id: "johto-185-troubles-brewing",
    title: "Trouble's Brewing",
    series: "The Johto Saga",
    episodeNumber: 185,
    airDate: null,
    summary:
      "Ash, Brock and Misty meet Sakura, an Eevee trainer, and visit her all-girls dojo where her sisters live. Team Rocket disrupts a tea ceremony, leading to battles featuring the sisters' Eevee evolutions.",
    characters: ["Ash", "Brock", "Misty", "Sakura", "Sumomo", "Satsuki", "Koume", "Tamao", "Jessie", "James"],
    pokemon: [
      {
        pokemonId: EEVEE,
        role: "main",
        significance: "notable_appearance",
        why: "Sakura's Eevee appears alongside her sisters' evolved Eevee.",
      },
      {
        pokemonId: UMBREON,
        role: "supporting",
        significance: "notable_appearance",
        why: "Tamao's Umbreon breaks out of its ball and headbutts through a cage with Eevee.",
      },
      {
        pokemonId: VAPOREON,
        role: "supporting",
        significance: "notable_appearance",
        why: "Sumomo's Vaporeon battles Misty's Poliwhirl.",
        outcome: { level: "mild", text: "Vaporeon ends the match with Aurora Beam." },
      },
      {
        pokemonId: JOLTEON,
        role: "supporting",
        significance: "notable_appearance",
        why: "Satsuki's Jolteon battles Pikachu.",
      },
      {
        pokemonId: FLAREON,
        role: "cameo",
        significance: "notable_appearance",
        why: "Koume's Flareon is part of the sisters' lineup; the guide doesn't describe its actions.",
      },
    ],
    spoilerLevel: "mild",
    source: { name: SEREBII, url: guide("johto/185") },
    verifiedOn: VERIFIED,
  },
  {
    id: "johto-271-the-ties-that-bind",
    title: "The Ties That Bind!",
    series: "The Johto Saga",
    episodeNumber: 271,
    airDate: null,
    summary:
      "Rivals Ash and Gary argue over a Poké Ball they once split while fishing, and then the tournament finals begin with a full 6-on-6 battle on a rock field.",
    characters: ["Ash", "Brock", "Misty", "Professor Oak", "Gary", "Delia Ketchum", "Harrison", "Macey", "Jackson", "Jessie", "James"],
    pokemon: [
      {
        pokemonId: UMBREON,
        role: "supporting",
        significance: "major_battle",
        why: "Umbreon is one of Gary's six Pokémon in the tournament finals against Ash; the guide doesn't describe what it does in the battle.",
      },
    ],
    spoilerLevel: "none",
    source: { name: SEREBII, url: guide("johto/271") },
    verifiedOn: VERIFIED,
  },
  {
    id: "bestwishes-763-team-eevee-and-the-pokemon-rescue-squad",
    title: "Team Eevee and the Pokemon Rescue Squad!",
    series: "Best Wishes (Unova Saga)",
    episodeNumber: 763,
    airDate: null,
    summary:
      "On the road to the Unova League, Ash and friends are rescued from a rockslide by Virgil, who runs a rescue squad with his family and protects his town with Team Eevee. Soon after, they discover a nearby dam is starting to freeze.",
    characters: ["Ash", "Iris", "Cilan", "Virgil", "Davey", "Jeff"],
    pokemon: [
      {
        pokemonId: EEVEE,
        role: "main",
        significance: "notable_appearance",
        why: "Virgil's Team Eevee is built around Eevee and its evolutions.",
      },
      { pokemonId: UMBREON, role: "supporting", significance: "notable_appearance", why: "Virgil's Umbreon is part of Team Eevee." },
      { pokemonId: VAPOREON, role: "supporting", significance: "notable_appearance", why: "Virgil's Vaporeon is part of Team Eevee." },
      { pokemonId: JOLTEON, role: "supporting", significance: "notable_appearance", why: "Virgil's Jolteon is part of Team Eevee." },
      { pokemonId: FLAREON, role: "supporting", significance: "notable_appearance", why: "Virgil's Flareon is part of Team Eevee." },
      { pokemonId: ESPEON, role: "supporting", significance: "notable_appearance", why: "Virgil's Espeon is part of Team Eevee." },
      { pokemonId: LEAFEON, role: "supporting", significance: "notable_appearance", why: "Virgil's Leafeon is part of Team Eevee." },
      { pokemonId: GLACEON, role: "supporting", significance: "notable_appearance", why: "Virgil's Glaceon is part of Team Eevee." },
    ],
    spoilerLevel: "none",
    source: { name: SEREBII, url: guide("bestwishes/763") },
    verifiedOn: VERIFIED,
  },
  {
    id: "sunmoon-970-a-glaring-rivalry",
    title: "A Glaring Rivalry!",
    series: "Sun & Moon (Alola Saga)",
    episodeNumber: 970,
    airDate: null,
    summary:
      "At school, Ash hears about a strong trainer on Melemele Island, tracks him down and challenges him.",
    characters: ["Ash", "Lillie", "Mallow", "Lana", "Sophocles", "Kiawe", "Professor Kukui", "Lusamine", "Jessie", "James"],
    pokemon: [
      {
        pokemonId: UMBREON,
        role: "cameo",
        significance: "notable_appearance",
        why: "Umbreon is listed among the strong trainer's Pokémon here; the guide doesn't describe what it does.",
        outcome: { level: "major", text: "Lillie arrives and reveals the trainer is her brother, Gladion, who is listed as this Umbreon's trainer." },
      },
      {
        pokemonId: EEVEE,
        role: "cameo",
        significance: "notable_appearance",
        why: "Eevee is listed among the strong trainer's Pokémon here; the guide doesn't describe what it does.",
        outcome: { level: "major", text: "Lillie arrives and reveals the trainer is her brother, Gladion, who is listed as this Eevee's trainer." },
      },
    ],
    spoilerLevel: "major",
    source: { name: SEREBII, url: guide("sunmoon/970") },
    verifiedOn: VERIFIED,
  },
];
