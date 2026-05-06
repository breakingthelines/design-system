export * from './config';
export * from './page-renderer';
export * from './programme-block-routing';
export * from './registry';
export * from './types';

// Programme block components. These ship in `defaultPageBlockRegistry`
// and host apps can override them per block via the `registry` /
// `modeRegistries` props on `PageRenderer`. They are also exported here
// so hosts can wrap, test, or compose them directly without re-importing
// from a deep blocks path.
export { ProgrammeCoverBlock } from './blocks/programme-cover-block';
export { ProgrammeBackCoverBlock } from './blocks/programme-back-cover-block';
export { ProgrammeNumberingBlock } from './blocks/programme-numbering-block';
export { MatchdayBlock } from './blocks/matchday-block';
export { InboxBlock } from './blocks/inbox-block';
