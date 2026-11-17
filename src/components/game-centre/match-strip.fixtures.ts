import type { MatchStripEvent, MatchStripEventKind, MatchStripSide } from './match-strip';

/* Real Premier League games from this season, as the match page projects them. */

let n = 0;
function ev(
  minuteLabel: string,
  side: MatchStripSide,
  kind: MatchStripEventKind,
  playerName?: string,
  more: Partial<MatchStripEvent> = {}
): MatchStripEvent {
  const [base, added] = minuteLabel.split('+').map(Number);
  n += 1;
  return {
    id: `e${n}`,
    kind,
    side,
    minute: (base ?? 0) + (added ?? 0),
    minuteLabel,
    playerId: playerName ? `p-${playerName.toLowerCase().replace(/\W+/g, '-')}` : undefined,
    playerName,
    ...more,
  };
}

/** Everton 1-0 Ipswich Town: one goal, a second yellow, 90+6' fed before 90+2'. */
export const QUIET_GAME: MatchStripEvent[] = [
  ev('11', 'home', 'goal', 'Thierno Barry', { otherName: 'James Tarkowski' }),
  ev('35', 'away', 'yellow', 'Abdul Fatawu Issahak'),
  ev('42', 'home', 'yellow', 'Vitaliy Mykolenko'),
  ev('59', 'home', 'var', 'Thierno Barry'),
  ev('67', 'away', 'red', 'Abdul Fatawu Issahak', { secondYellow: true }),
  ev('72', 'home', 'sub', 'Carlos Alcaraz', { otherName: 'Dwight McNeil' }),
  ev('90+6', 'home', 'yellow', 'Harrison Armstrong'),
  ev('90+2', 'away', 'yellow', 'Zian Flemming'),
];

/** Manchester United 4-4 Aston Villa: eight goals, two in stoppage time. */
export const BUSY_GAME: MatchStripEvent[] = [
  ev('1', 'away', 'goal', 'Alysson', { otherName: 'John McGinn' }),
  ev('4', 'away', 'goal', 'Nicolas Jackson'),
  ev('16', 'home', 'penalty', 'Bruno Fernandes'),
  ev('44', 'home', 'goal', 'Youri Tielemans', { otherName: 'Noussair Mazraoui' }),
  ev('45', 'home', 'sub', 'Ayden Heaven', { otherName: 'Harry Maguire' }),
  ev('48', 'away', 'penalty', 'John McGinn'),
  ev('53', 'away', 'goal', 'Leon Goretzka', { otherName: 'Nicolas Jackson' }),
  ev('57', 'home', 'yellow', 'Ayden Heaven'),
  ev('66', 'home', 'sub', 'Mason Mount', { otherName: 'Kobbie Mainoo' }),
  ev('90+2', 'home', 'goal', 'Joshua Zirkzee', { otherName: 'Patrick Dorgu' }),
  ev('90+6', 'home', 'goal', 'Patrick Dorgu', { otherName: 'Bruno Fernandes' }),
  ev('90+7', 'away', 'yellow', 'Zion Suzuki'),
];

/** Brighton 4-0 Aston Villa: an own goal, two goals a minute apart, a first-half red. */
export const OWN_GOAL_GAME: MatchStripEvent[] = [
  ev('8', 'home', 'own_goal', 'Victor Lindelöf'),
  ev('9', 'away', 'yellow', 'João Victor Gomes da Silva'),
  ev('18', 'home', 'goal', 'Maxim De Cuyper', { otherName: 'Georginio Rutter' }),
  ev('30', 'home', 'goal', 'Jack Hinshelwood', { otherName: 'Diego Gómez' }),
  ev('31', 'home', 'goal', 'Jack Hinshelwood'),
  ev('39', 'away', 'var', 'João Victor Gomes da Silva'),
  ev('40', 'away', 'red', 'João Victor Gomes da Silva'),
  ev('90+5', 'away', 'yellow', 'Matty Cash'),
];

/** Brentford 1-2 Liverpool: two reds, 45+8' fed before 45+5', a second yellow at 90+2'. */
export const RED_CARDS_GAME: MatchStripEvent[] = [
  ev('31', 'away', 'yellow', 'Bradley Barcola'),
  ev('44', 'home', 'goal', 'Keane Lewis-Potter', { otherName: 'Igor Thiago' }),
  ev('45+8', 'home', 'red', 'Yehor Yarmolyuk'),
  ev('45+5', 'home', 'var', 'Yehor Yarmolyuk'),
  ev('62', 'away', 'goal', 'Víctor Muñoz Villanueva', { otherName: 'Florian Wirtz' }),
  ev('70', 'away', 'goal', 'Alexander Isak', { otherName: 'Bradley Barcola' }),
  ev('90+2', 'home', 'red', 'Vitaly Janelt', { secondYellow: true }),
];

/** A cup tie that went to extra time. */
export const EXTRA_TIME_GAME: MatchStripEvent[] = [
  ev('34', 'home', 'goal', 'Lautaro Martinez'),
  ev('79', 'away', 'goal', 'Robert Lewandowski', { otherName: 'Pedri' }),
  ev('90+4', 'away', 'yellow', 'Jules Kounde'),
  ev('98', 'home', 'yellow', 'Nicolo Barella'),
  ev('112', 'away', 'red', 'Ronald Araujo'),
  ev('120+1', 'home', 'penalty', 'Lautaro Martinez'),
];
