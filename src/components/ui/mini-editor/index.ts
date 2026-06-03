export { MiniEditor, type MiniEditorProps, type MiniEditorHandle } from './mini-editor';

// One polymorphic @mention — users, squads, and football entities collapse into
// a single MentionNode + MentionPlugin discriminated by `kind`. The contract
// (MentionItem) is identical to the `@breakingthelines/editor` package.
export {
  MentionNode,
  $createMentionNode,
  $isMentionNode,
  isHandleKind,
  type MentionItem,
  type MentionKind,
  type SerializedMentionNode,
} from './mention-node';
export { MentionPlugin } from './mention-plugin';
export {
  MentionReader,
  MentionFromNode,
  mentionHref,
  type MentionReaderProps,
} from './mention-reader';
