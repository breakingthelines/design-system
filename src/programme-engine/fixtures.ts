import { BlockKind } from '@breakingthelines/protos/btl/content/v1/page_pb';

import { colors } from '#/tokens/colors';
import type { ProgrammeEngineInput, ProgrammeEngineTheme } from './types';

export const defaultProgrammeEngineTheme: ProgrammeEngineTheme = {
  background: colors.black,
  foreground: colors.white,
  accent: colors.red[100],
  muted: colors.grey[100],
};

export const programmeEngineFixture: ProgrammeEngineInput = {
  programmeId: 'programme-fixture-1',
  issueNumber: 9n,
  ownerLabel: 'Breaking The Lines',
  title: 'European Nights',
  subtitle: 'A frozen Programme issue rendered as a Three.js scene',
  theme: defaultProgrammeEngineTheme,
  blocks: [
    {
      id: 'cover',
      kind: BlockKind.PROGRAMME_COVER,
      title: 'European Nights',
      subtitle: 'Cover spread',
      snapshotState: 'composition_frozen',
    },
    {
      id: 'matchday',
      kind: BlockKind.MATCHDAY,
      title: 'Matchday intelligence',
      subtitle: 'Canonical fixture data',
      snapshotState: 'canonical_read_pending',
      fallbackReasons: ['GAME_SERVICE_SNAPSHOT_NOT_YET_CAPTURED'],
    },
    {
      id: 'inbox',
      kind: BlockKind.INBOX,
      title: 'Signals from the stands',
      subtitle: 'Inbox highlights',
      snapshotState: 'composition_frozen',
    },
  ],
};
