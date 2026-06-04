import preview from '#.storybook/preview';
import { SearchEntityCard, type SearchEntityCardItem } from './search-entity-card';

const meta = preview.meta({
  title: 'UI/SearchEntityCard',
  component: SearchEntityCard,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['grid', 'list'],
    },
  },
});

const club: SearchEntityCardItem = {
  id: 'btl_football_team_t8596499a',
  kind: 'club',
  name: 'Arsenal',
  imageUrl: 'https://media.api-sports.io/football/teams/42.png',
  href: '/game/football/club/btl_football_team_t8596499a/arsenal',
  secondary: 'Premier League',
};

const player: SearchEntityCardItem = {
  id: 'btl_football_player_p1d3f9c20',
  kind: 'player',
  name: 'Bukayo Saka',
  href: '/game/football/player/btl_football_player_p1d3f9c20/bukayo-saka',
  secondary: 'Arsenal',
};

const manager: SearchEntityCardItem = {
  id: 'btl_football_coach_c77a01bb2',
  kind: 'manager',
  name: 'Mikel Arteta',
  imageUrl: 'https://media.api-sports.io/football/coachs/19.png',
  href: '/game/football/manager/btl_football_coach_c77a01bb2/mikel-arteta',
  secondary: 'Arsenal',
};

const competition: SearchEntityCardItem = {
  id: 'btl_football_competition_l2b4e8a91',
  kind: 'competition',
  name: 'Premier League',
  imageUrl: 'https://media.api-sports.io/football/leagues/39.png',
  href: '/game/football/competition/btl_football_competition_l2b4e8a91/premier-league',
  secondary: 'England',
};

const country: SearchEntityCardItem = {
  id: 'btl_football_country_n5c1a2d33',
  kind: 'country',
  name: 'England',
  href: '/game/football/country/btl_football_country_n5c1a2d33/england',
};

export const Grid = meta.story({
  name: 'Grid — club',
  render: () => (
    <div className="w-[240px]">
      <SearchEntityCard item={club} variant="grid" />
    </div>
  ),
});

export const GridPlayerMonogram = meta.story({
  name: 'Grid — player (monogram fallback)',
  render: () => (
    <div className="w-[240px]">
      <SearchEntityCard item={player} variant="grid" />
    </div>
  ),
});

export const GridCompetition = meta.story({
  name: 'Grid — competition',
  render: () => (
    <div className="w-[240px]">
      <SearchEntityCard item={competition} variant="grid" />
    </div>
  ),
});

export const GridManager = meta.story({
  name: 'Grid — manager',
  render: () => (
    <div className="w-[240px]">
      <SearchEntityCard item={manager} variant="grid" />
    </div>
  ),
});

export const GridRow = meta.story({
  name: 'Grid — 4 column',
  render: () => (
    <div className="grid w-[1000px] grid-cols-4 gap-6">
      <SearchEntityCard item={club} variant="grid" />
      <SearchEntityCard item={player} variant="grid" />
      <SearchEntityCard item={competition} variant="grid" />
      <SearchEntityCard item={manager} variant="grid" />
    </div>
  ),
});

export const List = meta.story({
  name: 'List — club',
  render: () => (
    <div className="w-[460px]">
      <SearchEntityCard item={club} variant="list" />
    </div>
  ),
});

export const ListPlayerMonogram = meta.story({
  name: 'List — player (monogram fallback)',
  render: () => (
    <div className="w-[460px]">
      <SearchEntityCard item={player} variant="list" />
    </div>
  ),
});

export const ListStack = meta.story({
  name: 'List — mixed stack',
  render: () => (
    <div className="flex w-[460px] flex-col gap-3">
      <SearchEntityCard item={club} variant="list" />
      <SearchEntityCard item={player} variant="list" />
      <SearchEntityCard item={competition} variant="list" />
      <SearchEntityCard item={manager} variant="list" />
      <SearchEntityCard item={country} variant="list" />
    </div>
  ),
});
