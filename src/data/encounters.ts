/**
 * The day's encounter: one card a day, drawn from the leg the player is on, played as they stoke
 * the boiler. Each choice quietly favours one kind of energy. The player never sees which; the
 * story is the hint (row for it, run for it, haul it). The energy they then spend decides how it
 * goes. Fix turns up between raids so the raids don't arrive cold.
 */
import type { EnergyType } from './gameConstants';

export interface EncounterChoice {
  label: string;
  favours: EnergyType;
  /** Shown when it goes well (triumph or steady). */
  win: string;
  /** Shown when the energy spent didn't suit it. No penalty, just no bonus. */
  lose: string;
}

export interface Encounter {
  id: string;
  title: string;
  scene: string;
  /** Detective Fix is behind it. */
  fix?: boolean;
  choices: [EncounterChoice, EncounterChoice];
}

/** Indexed by leg number. */
export const ENCOUNTERS: Encounter[][] = [
  // 0 London → London Port
  [
    {
      id: 'london-trunks',
      title: 'The missing trunk',
      scene: 'Passepartout has packed one carpet bag. Fogg’s banknotes are in a trunk still at Savile Row.',
      choices: [
        { label: 'Sprint back to Savile Row', favours: 'terrestrial', win: 'Back with the trunk and four minutes to spare.', lose: 'The cab beat you there. Fogg says nothing, pointedly.' },
        { label: 'Carry the trunk aboard yourself', favours: 'strength', win: 'Up the gangway in one heave. The porters applaud.', lose: 'Two porters had to help. It made it, slowly.' },
      ],
    },
    {
      id: 'london-hansom',
      title: 'Traffic on the Strand',
      scene: 'The hansom cab is stuck behind a brewer’s dray. Charing Cross waits for no one.',
      choices: [
        { label: 'Take the bicycle from the club steps', favours: 'transport', win: 'Weaving through the Strand, you’re first on the platform.', lose: 'A wobbly ride. You made the train, just.' },
        { label: 'Run for it', favours: 'terrestrial', win: 'Down the Strand at a gallop. Fogg checks his watch, satisfied.', lose: 'Out of puff by Trafalgar Square. The cab caught up.' },
      ],
    },
    {
      id: 'london-reform',
      title: 'The wager is signed',
      scene: 'Stuart doubts Fogg will make Dover. A side bet is offered on the crew loading the coal in time.',
      choices: [
        { label: 'Shovel the coal yourself', favours: 'strength', win: 'Bunkers full before the whistle. Stuart pays up.', lose: 'Half full at the whistle. Stuart smirks.' },
        { label: 'Row the supplies out to the tender', favours: 'nautical', win: 'Three trips across the harbour, not a crate wet.', lose: 'One crate went in the drink. Mostly fine.' },
      ],
    },
  ],
  // 1 London → Paris
  [
    {
      id: 'paris-channel-swell',
      title: 'A heavy Channel swell',
      scene: 'The Calais packet is pitching hard. The captain wants every hand on deck.',
      choices: [
        { label: 'Take an oar in the lifeboat drill', favours: 'nautical', win: 'You keep her head to the waves. Calais by noon.', lose: 'Green about the gills, but across.' },
        { label: 'Lash the cargo down below', favours: 'strength', win: 'Not a crate shifted. The captain shakes your hand.', lose: 'A few crates slid. Nobody was hurt.' },
      ],
    },
    {
      id: 'paris-gare',
      title: 'The wrong station',
      scene: 'The boat train terminates at the Gare du Nord. The Brindisi express leaves from the Gare de Lyon.',
      choices: [
        { label: 'Hire a velocipede', favours: 'transport', win: 'Across Paris in a blur of cobbles. Plenty of time.', lose: 'The cobbles won. You arrive rattled, but on time.' },
        { label: 'Run along the Seine', favours: 'terrestrial', win: 'Past Notre-Dame at full stride. Fogg is impressed.', lose: 'A long run. You made it with a minute to spare.' },
      ],
    },
    {
      id: 'paris-fix-telegram',
      title: 'A telegram from Suez',
      scene: 'A clerk in Calais is holding a telegram addressed to “the bank robber Fogg”. Fix has been busy.',
      fix: true,
      choices: [
        { label: 'Outrun the messenger to the train', favours: 'terrestrial', win: 'The messenger never caught up. Fix will be furious.', lose: 'He caught you at the gate. Fogg waved it away.' },
        { label: 'Row out to meet the boat early', favours: 'nautical', win: 'Aboard before the telegram reached the quay.', lose: 'The telegram was waiting. Fogg didn’t blink.' },
      ],
    },
  ],
  // 2 Paris → Suez
  [
    {
      id: 'suez-mont-cenis',
      title: 'Snow at Mont Cenis',
      scene: 'Drifts have closed the line before the tunnel. The engineer is asking for volunteers with shovels.',
      choices: [
        { label: 'Dig out the line', favours: 'strength', win: 'The line is clear in an hour. Through the tunnel.', lose: 'Slow going. The train crept through at dusk.' },
        { label: 'Walk ahead and clear the signals', favours: 'terrestrial', win: 'Every signal green. The express barely slowed.', lose: 'Cold feet and late signals, but through.' },
      ],
    },
    {
      id: 'suez-brindisi',
      title: 'The Mongolia is leaving',
      scene: 'The train is late into Brindisi and the steamer is already raising steam.',
      choices: [
        { label: 'Cycle the luggage cart to the quay', favours: 'transport', win: 'Bags and crew aboard as the lines come off.', lose: 'One bag missed the boat. Passepartout mourns his shirts.' },
        { label: 'Row the last bags out to her', favours: 'nautical', win: 'Alongside before she cleared the harbour.', lose: 'A long pull. The bags got wet, but they’re aboard.' },
      ],
    },
    {
      id: 'suez-fix-boards',
      title: 'A man with a warrant',
      scene: 'At Suez a thin man is watching the gangway. He introduces himself as Fix, and asks a lot of questions.',
      fix: true,
      choices: [
        { label: 'Keep Passepartout moving', favours: 'terrestrial', win: 'Fix got nothing out of him. Not yet.', lose: 'Passepartout said too much. Fix is smiling.' },
        { label: 'Load the hold before Fix can search it', favours: 'strength', win: 'Hatches shut before Fix found his way below.', lose: 'Fix poked about the hold. He found nothing.' },
      ],
    },
  ],
  // 3 Suez → Bombay
  [
    {
      id: 'bombay-red-sea',
      title: 'Becalmed in the Red Sea',
      scene: 'Not a breath of wind and the boilers are sulking. The captain calls for the boats to tow.',
      choices: [
        { label: 'Take the tow boat oars', favours: 'nautical', win: 'You tow her clear into a breeze. Hours saved.', lose: 'Blistered hands, a little progress. The wind came eventually.' },
        { label: 'Feed the boilers', favours: 'strength', win: 'Full pressure. She moves without the wind.', lose: 'The pressure crept up. Enough to make way.' },
      ],
    },
    {
      id: 'bombay-aden',
      title: 'Coaling at Aden',
      scene: 'Four hours to take on coal, and the crew is short-handed.',
      choices: [
        { label: 'Haul sacks with the stokers', favours: 'strength', win: 'Coaled in three hours. The captain stands you a drink.', lose: 'Four hours, as planned. No time won.' },
        { label: 'Run the tally between the barges', favours: 'terrestrial', win: 'Not a sack lost to the dockside sharps.', lose: 'A few sacks went astray. Enough for Bombay.' },
      ],
    },
    {
      id: 'bombay-fix-consul',
      title: 'Fix visits the consul',
      scene: 'Fix has gone ashore at Aden to beg the consul for a warrant. The steamer sails in an hour.',
      fix: true,
      choices: [
        { label: 'Row out early and wait aboard', favours: 'nautical', win: 'Aboard and away. Fix had to sprint for it.', lose: 'Fix made it back with time to spare. No warrant, though.' },
        { label: 'Race him back from the consulate', favours: 'terrestrial', win: 'You beat him to the gangway. He is livid.', lose: 'He beat you back. He looks far too pleased.' },
      ],
    },
  ],
  // 4 Bombay → Calcutta
  [
    {
      id: 'calcutta-kholby',
      title: 'The rails end at Kholby',
      scene: 'Fifty miles of jungle and no track. A man offers an elephant called Kiouni, at a ruinous price.',
      choices: [
        { label: 'Ride Kiouni', favours: 'transport', win: 'Kiouni ambles fifty miles without complaint.', lose: 'Kiouni sat down twice. Allahabad by nightfall anyway.' },
        { label: 'Walk it through the jungle', favours: 'terrestrial', win: 'You set a pace even Kiouni respects.', lose: 'A long hot walk. You arrive dusty and late-ish.' },
      ],
    },
    {
      id: 'calcutta-aouda',
      title: 'The pyre at Pillaji',
      scene: 'A young woman, Aouda, is to be burned at dawn. Fogg says they have twelve hours to spare. He means to spend them.',
      choices: [
        { label: 'Carry Aouda from the pyre', favours: 'strength', win: 'Out of the smoke before the guards understood. She’s safe.', lose: 'A close-run thing. She’s safe, which is what matters.' },
        { label: 'Run the decoy through the temple', favours: 'terrestrial', win: 'The guards chased you for a mile. Aouda was long gone.', lose: 'The guards gave up early. Still, she got away.' },
      ],
    },
    {
      id: 'calcutta-fix-court',
      title: 'Summoned to court',
      scene: 'Fix has had Passepartout charged for walking into a temple in his shoes. The judge wants bail.',
      fix: true,
      choices: [
        { label: 'Run the bail money from the bank', favours: 'terrestrial', win: 'Bail paid, boat caught. Fix tears up his notes.', lose: 'Bail paid at the last moment. Fix lingers.' },
        { label: 'Cycle the papers to the harbour', favours: 'transport', win: 'Papers stamped and aboard before the court rose.', lose: 'The papers were stamped. Eventually.' },
      ],
    },
  ],
  // 5 Calcutta → Hong Kong
  [
    {
      id: 'hongkong-monsoon',
      title: 'The monsoon breaks',
      scene: 'Rain like a wall off the Andamans. The Rangoon is shipping water.',
      choices: [
        { label: 'Man the pumps', favours: 'strength', win: 'Dry bilges by dawn. She never slowed.', lose: 'You kept her afloat. Slower than hoped.' },
        { label: 'Row the anchor out to hold her steady', favours: 'nautical', win: 'Head to wind and steady as a church.', lose: 'She swung a while. You held on.' },
      ],
    },
    {
      id: 'hongkong-singapore',
      title: 'Twelve hours at Singapore',
      scene: 'Aouda wants to see the island. Fogg will allow it, if everyone is back by the evening gun.',
      choices: [
        { label: 'Take a rickshaw round the island', favours: 'transport', win: 'The whole island seen and back before the gun.', lose: 'A short tour. Back in time, mind.' },
        { label: 'Walk the botanic gardens', favours: 'terrestrial', win: 'Aouda laughs for the first time since Pillaji.', lose: 'A pleasant stroll, cut short by the rain.' },
      ],
    },
    {
      id: 'hongkong-fix-coal',
      title: 'Wet coal',
      scene: 'Someone has soaked the bunker coal. Fix is reading on deck, very innocently.',
      fix: true,
      choices: [
        { label: 'Shovel the dry coal forward', favours: 'strength', win: 'The good coal goes first. Full speed to Hong Kong.', lose: 'Smoky going. You made it a little late.' },
        { label: 'Row ashore for fresh coal', favours: 'nautical', win: 'Fresh bunkers by nightfall. Fix closes his book.', lose: 'Not much coal ashore. Enough, just.' },
      ],
    },
  ],
  // 6 Hong Kong → Yokohama
  [
    {
      id: 'yokohama-tankadere',
      title: 'The Tankadere',
      scene: 'The Carnatic has sailed. A pilot boat, the Tankadere, will try for Shanghai if the crew can handle her.',
      choices: [
        { label: 'Take the tiller and sheets', favours: 'nautical', win: 'She flies. Shanghai by the third day.', lose: 'Rough handling, slow going. Shanghai, eventually.' },
        { label: 'Haul the sails in the squalls', favours: 'strength', win: 'Every reef in on time. Not a rope parted.', lose: 'A torn jib, but she sailed on.' },
      ],
    },
    {
      id: 'yokohama-circus',
      title: 'The Long Noses',
      scene: 'Passepartout has joined a Japanese acrobat troupe to earn his fare. He is the bottom of the human pyramid.',
      choices: [
        { label: 'Hold the pyramid up', favours: 'strength', win: 'The pyramid stands. The crowd roars. Fare earned.', lose: 'The pyramid wobbled. Fare earned, dignity less so.' },
        { label: 'Run the hat round the crowd', favours: 'terrestrial', win: 'The hat comes back heavy. Fogg pays Passepartout’s fare anyway.', lose: 'A thin hat. Fogg pays, as ever.' },
      ],
    },
    {
      id: 'yokohama-fix-opium',
      title: 'The opium den',
      scene: 'Fix has bought Passepartout one drink too many. He’s asleep in a den off Queen’s Road.',
      fix: true,
      choices: [
        { label: 'Search every street to find him', favours: 'terrestrial', win: 'Found, sobered up, and aboard. Fix grinds his teeth.', lose: 'Found him at dawn. He has a headache.' },
        { label: 'Carry him back to the quay', favours: 'strength', win: 'Over your shoulder and up the gangway.', lose: 'Heavier than he looks. You managed.' },
      ],
    },
  ],
  // 7 Yokohama → San Francisco
  [
    {
      id: 'sf-pacific-calm',
      title: 'The Pacific is enormous',
      scene: 'Twenty-two days of ocean. The General Grant’s paddles need relief crews.',
      choices: [
        { label: 'Take a shift on deck', favours: 'nautical', win: 'You keep her running sweet. A day saved.', lose: 'Long watches. No time lost, none gained.' },
        { label: 'Stoke the engine room', favours: 'strength', win: 'Full pressure round the clock.', lose: 'Steady pressure. You slept well.' },
      ],
    },
    {
      id: 'sf-whales',
      title: 'Whales off the bow',
      scene: 'A pod is crossing ahead. The captain must slow or go round.',
      choices: [
        { label: 'Row out to guide her through', favours: 'nautical', win: 'Threaded through the pod without slowing.', lose: 'The whales took their time. So did you.' },
        { label: 'Crank the steering gear hard over', favours: 'strength', win: 'She swings clear and holds her speed.', lose: 'A wide turn. A few hours lost, but safe.' },
      ],
    },
    {
      id: 'sf-fix-truce',
      title: 'Fix offers a truce',
      scene: 'Fix admits Fogg must reach England for the warrant to work. Until then, he says, he’ll help.',
      fix: true,
      choices: [
        { label: 'Put him to work rowing', favours: 'nautical', win: 'Fix rows like a man possessed. Useful, for once.', lose: 'Fix rows badly. At least he’s busy.' },
        { label: 'Watch him from the rail', favours: 'terrestrial', win: 'You pace the deck and he never gets near Fogg.', lose: 'He slipped off to the telegraph room. Nothing came of it.' },
      ],
    },
  ],
  // 8 San Francisco → New York
  [
    {
      id: 'ny-buffalo',
      title: 'Buffalo on the line',
      scene: 'Ten thousand buffalo are crossing the tracks. They are in no hurry.',
      choices: [
        { label: 'Ride out and drive them off', favours: 'transport', win: 'The herd turns. The train is moving in an hour.', lose: 'The buffalo won. Three hours lost.' },
        { label: 'Walk the train round them', favours: 'terrestrial', win: 'Down the bank and round the herd. Barely a delay.', lose: 'A long trudge round. You made it.' },
      ],
    },
    {
      id: 'ny-medicine-bow',
      title: 'Medicine Bow Bridge',
      scene: 'The bridge is shaky. The engineer wants to cross at full speed and trust the momentum.',
      choices: [
        { label: 'Full steam ahead', favours: 'transport', win: 'Across. The bridge falls into the river behind you.', lose: 'Across, at a crawl. The bridge held, somehow.' },
        { label: 'Shore up the bridge first', favours: 'strength', win: 'Beams braced, train across, everyone breathing again.', lose: 'Hours of hammering. Safe, but slow.' },
      ],
    },
    {
      id: 'ny-fix-sioux',
      title: 'Passepartout taken',
      scene: 'Raiders have taken Passepartout at Fort Kearney. Fix, of all people, offers to stay with Aouda.',
      fix: true,
      choices: [
        { label: 'Run with the soldiers to find him', favours: 'terrestrial', win: 'Found by nightfall. Fix even looks relieved.', lose: 'Found him at dawn. The train is long gone.' },
        { label: 'Take the wind-sledge after the train', favours: 'transport', win: 'Across the snow at forty miles an hour. Omaha by morning.', lose: 'The sail ripped. You made Omaha anyway.' },
      ],
    },
  ],
  // 9 New York → Liverpool
  [
    {
      id: 'liverpool-henrietta',
      title: 'The Henrietta',
      scene: 'The China sailed 45 minutes ago. A cargo boat, the Henrietta, is bound for Bordeaux. Her captain won’t change course.',
      choices: [
        { label: 'Take the helm when the captain is locked up', favours: 'nautical', win: 'Course set for Liverpool. The crew back you.', lose: 'The crew grumbled. Course changed, slowly.' },
        { label: 'Bribe the stokers with a bit of muscle', favours: 'strength', win: 'The stokers are with you. Full ahead for England.', lose: 'Half the stokers came round. Enough.' },
      ],
    },
    {
      id: 'liverpool-burning',
      title: 'Out of coal',
      scene: 'Mid-Atlantic and the bunkers are empty. Fogg has bought the ship. Now she must burn.',
      choices: [
        { label: 'Tear up the decks', favours: 'strength', win: 'Cabins, rails and masts into the boiler. She roars.', lose: 'Slow work with blunt axes. She kept moving.' },
        { label: 'Row the spare timber across from a passing ship', favours: 'nautical', win: 'A timber-ship sold you her deck cargo. Full steam.', lose: 'They sold you very little. Every bit helps.' },
      ],
    },
    {
      id: 'liverpool-fix-warrant',
      title: 'The warrant arrives',
      scene: 'Liverpool at last, and Fix has a hand on Fogg’s shoulder. The real thief was caught three days ago. Nobody has told Fix.',
      fix: true,
      choices: [
        { label: 'Run for the telegraph office', favours: 'terrestrial', win: 'The news reaches the cells in an hour. Fogg is free.', lose: 'The office was shut. It took longer than it should.' },
        { label: 'Cycle to the magistrate', favours: 'transport', win: 'The magistrate signs the release on the spot.', lose: 'The magistrate was at lunch. Fogg waited, calmly.' },
      ],
    },
  ],
  // 10 Liverpool → London
  [
    {
      id: 'london-special',
      title: 'The special train',
      scene: 'Fogg has hired a special. The driver says he can do it in five hours if someone keeps the firebox fed.',
      choices: [
        { label: 'Fire the engine yourself', favours: 'strength', win: 'Euston in four and a half hours.', lose: 'Five hours and a bit. Every minute counts.' },
        { label: 'Wire ahead for clear signals', favours: 'terrestrial', win: 'Green lights all the way to London.', lose: 'A few reds near Rugby. You pressed on.' },
      ],
    },
    {
      id: 'london-reform-dash',
      title: 'The Reform Club clock',
      scene: 'It is Saturday, not Sunday. Fogg has gained a day by travelling east. Ten minutes to reach the club.',
      choices: [
        { label: 'Sprint down Pall Mall', favours: 'terrestrial', win: 'Through the door as the clock strikes. Wager won.', lose: 'Puffing hard. You made it with seconds to spare.' },
        { label: 'Take the fastest cab in London', favours: 'transport', win: 'Hooves on cobbles, door flung open. Right on time.', lose: 'The cab was slow. Fogg made it anyway.' },
      ],
    },
    {
      id: 'london-fix-apology',
      title: 'Fix apologises',
      scene: 'Fix is at the station looking sheepish. Fogg knocks him down with one punch, then carries on.',
      fix: true,
      choices: [
        { label: 'Help him up and carry his bags', favours: 'strength', win: 'Fix is lost for words. He helps you to the cab.', lose: 'Fix shuffles off. It was decent of you.' },
        { label: 'Leave him and run for the club', favours: 'terrestrial', win: 'No time for Fix. Straight to Pall Mall.', lose: 'He followed you halfway. Persistent man.' },
      ],
    },
  ],
];

export interface Souvenir {
  id: string;
  name: string;
  icon: string;
}

/** Three keepsakes per stop. Earned from a good encounter on that leg; a full set pays coins. */
export const SOUVENIRS: Souvenir[][] = [
  [
    { id: 'london-ticket', name: 'Reform Club card', icon: '🎩' },
    { id: 'london-umbrella', name: 'Black umbrella', icon: '☂️' },
    { id: 'london-tea', name: 'Tin of tea', icon: '🫖' },
  ],
  [
    { id: 'paris-baguette', name: 'Baguette', icon: '🥖' },
    { id: 'paris-beret', name: 'Beret', icon: '🎨' },
    { id: 'paris-croissant', name: 'Croissant', icon: '🥐' },
  ],
  [
    { id: 'suez-compass', name: 'Brass compass', icon: '🧭' },
    { id: 'suez-scarab', name: 'Scarab charm', icon: '🪲' },
    { id: 'suez-lamp', name: 'Oil lamp', icon: '🪔' },
  ],
  [
    { id: 'bombay-spices', name: 'Spice box', icon: '🌶️' },
    { id: 'bombay-silk', name: 'Silk scarf', icon: '🧣' },
    { id: 'bombay-tiger', name: 'Tiger carving', icon: '🐅' },
  ],
  [
    { id: 'calcutta-kiouni', name: 'Kiouni’s bell', icon: '🐘' },
    { id: 'calcutta-lotus', name: 'Lotus flower', icon: '🪷' },
    { id: 'calcutta-tea', name: 'Darjeeling', icon: '🍵' },
  ],
  [
    { id: 'hongkong-fan', name: 'Paper fan', icon: '🪭' },
    { id: 'hongkong-lantern', name: 'Red lantern', icon: '🏮' },
    { id: 'hongkong-dumpling', name: 'Dim sum', icon: '🥟' },
  ],
  [
    { id: 'yokohama-kite', name: 'Carp kite', icon: '🎏' },
    { id: 'yokohama-fuji', name: 'Print of Fuji', icon: '🗻' },
    { id: 'yokohama-fan', name: 'Acrobat’s mask', icon: '👺' },
  ],
  [
    { id: 'sf-shell', name: 'Pacific shell', icon: '🐚' },
    { id: 'sf-whale', name: 'Scrimshaw whale', icon: '🐋' },
    { id: 'sf-gold', name: 'Gold nugget', icon: '🪙' },
  ],
  [
    { id: 'ny-boots', name: 'Cowboy boots', icon: '🥾' },
    { id: 'ny-feather', name: 'Eagle feather', icon: '🪶' },
    { id: 'ny-apple', name: 'Big apple', icon: '🍎' },
  ],
  [
    { id: 'liverpool-anchor', name: 'Henrietta’s anchor', icon: '⚓' },
    { id: 'liverpool-axe', name: 'Stoker’s axe', icon: '🪓' },
    { id: 'liverpool-bell', name: 'Ship’s bell', icon: '🔔' },
  ],
  [
    { id: 'london-clock', name: 'Pocket watch', icon: '⌚' },
    { id: 'london-ring', name: 'Aouda’s ring', icon: '💍' },
    { id: 'london-trophy', name: 'The wager', icon: '🏆' },
  ],
];

export const SOUVENIR_COUNT = SOUVENIRS.reduce((n, set) => n + set.length, 0);
