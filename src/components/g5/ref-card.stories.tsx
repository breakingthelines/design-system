import * as React from 'react';

import preview from '#.storybook/preview';
import { CompetitionRefCard, GameRoundRefCard, TeamRefCard } from './ref-card';
import {
  competitionRefChampionsLeague,
  competitionRefPremierLeague,
  gameRoundRefGameweek34,
  teamRefArsenal,
  teamRefRealMadrid,
} from './fixtures';

const meta = preview.meta({
  title: 'G5/RefCard',
  component: TeamRefCard,
  tags: ['autodocs'],
});

export const TeamDefault = meta.story({
  name: 'Team — default',
  render: () => (
    <div className="w-[360px]">
      <TeamRefCard data={teamRefArsenal as never} />
    </div>
  ),
});

export const TeamSelected = meta.story({
  name: 'Team — selected',
  render: () => {
    const [selected, setSelected] = React.useState(true);
    return (
      <div className="w-[360px]">
        <TeamRefCard
          data={teamRefArsenal as never}
          selected={selected}
          onToggle={() => setSelected((value) => !value)}
        />
      </div>
    );
  },
});

export const TeamStatic = meta.story({
  name: 'Team — static',
  render: () => (
    <div className="w-[360px]">
      <TeamRefCard data={teamRefArsenal as never} variant="static" />
    </div>
  ),
});

export const Competition = meta.story({
  render: () => (
    <div className="w-[360px]">
      <CompetitionRefCard data={competitionRefPremierLeague as never} />
    </div>
  ),
});

export const GameRound = meta.story({
  render: () => (
    <div className="w-[360px]">
      <GameRoundRefCard data={gameRoundRefGameweek34 as never} />
    </div>
  ),
});

export const PickerGrid = meta.story({
  name: 'Picker grid (mixed)',
  render: () => {
    const [picked, setPicked] = React.useState<Set<string>>(new Set([teamRefArsenal.id]));
    const toggle = (id: string) =>
      setPicked((set) => {
        const next = new Set(set);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    return (
      <div className="grid w-[760px] grid-cols-2 gap-3">
        <TeamRefCard
          data={teamRefArsenal as never}
          selected={picked.has(teamRefArsenal.id)}
          onToggle={() => toggle(teamRefArsenal.id)}
        />
        <TeamRefCard
          data={teamRefRealMadrid as never}
          selected={picked.has(teamRefRealMadrid.id)}
          onToggle={() => toggle(teamRefRealMadrid.id)}
        />
        <CompetitionRefCard
          data={competitionRefPremierLeague as never}
          selected={picked.has(competitionRefPremierLeague.id)}
          onToggle={() => toggle(competitionRefPremierLeague.id)}
        />
        <CompetitionRefCard
          data={competitionRefChampionsLeague as never}
          selected={picked.has(competitionRefChampionsLeague.id)}
          onToggle={() => toggle(competitionRefChampionsLeague.id)}
        />
        <GameRoundRefCard
          data={gameRoundRefGameweek34 as never}
          selected={picked.has(gameRoundRefGameweek34.id)}
          onToggle={() => toggle(gameRoundRefGameweek34.id)}
        />
      </div>
    );
  },
});
