import preview from '#.storybook/preview';
import { ThoughtBody } from './thought-body';

const meta = preview.meta({
  title: 'UI/ThoughtBody',
  component: ThoughtBody,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
});

/* ────────────────────────────────────────────────────────────
 * Serialized Lexical states (`body_json`)
 *
 * These mirror exactly what MiniEditor.getBodyJson() persists: a `root` whose
 * `children` are paragraphs, each paragraph's `children` a mix of `text` nodes
 * and `mention` nodes. The mention node shape matches SerializedMentionNode
 * (text + the mentionId / mentionKind / label / slug / imageUrl payload), so it
 * renders through the shared MentionFromNode reader as a link.
 * ──────────────────────────────────────────────────────────── */

function textNode(text: string, format = 0) {
  return { type: 'text', version: 1, detail: 0, format, mode: 'normal', style: '', text };
}

function mentionNode(opts: {
  text: string;
  mentionId: string;
  mentionKind: string;
  label: string;
  slug?: string;
  url?: string;
  imageUrl?: string;
}) {
  return {
    type: 'mention',
    version: 1,
    detail: 0,
    format: 0,
    mode: 'segmented',
    style: '',
    ...opts,
  };
}

function paragraph(children: unknown[]) {
  return {
    type: 'paragraph',
    version: 1,
    children,
    direction: 'ltr',
    format: '',
    indent: 0,
    textFormat: 0,
    textStyle: '',
  };
}

function bodyJson(children: unknown[]): string {
  return JSON.stringify({
    root: { type: 'root', version: 1, children, direction: 'ltr', format: '', indent: 0 },
  });
}

// A USER mention (handle kind → `@label`, primary colour, linked to `/@handle`).
const userMentionJson = bodyJson([
  paragraph([
    textNode('Brilliant breakdown from '),
    mentionNode({
      text: '@zachlowy',
      mentionId: 'usr_zach',
      mentionKind: 'user',
      label: 'zachlowy',
      slug: '@zachlowy',
      imageUrl: 'https://i.pravatar.cc/150?u=zach',
    }),
    textNode(' on the second-half collapse. Worth a read.'),
  ]),
]);

// A FOOTBALL-ENTITY mention (bare label, red, linked to the entity route) plus
// a USER mention in the same body, across two paragraphs.
const entityMentionJson = bodyJson([
  paragraph([
    textNode('Set-piece routine that '),
    mentionNode({
      text: 'Aston Villa',
      mentionId: 'btl_football_club_taaaa1111',
      mentionKind: 'club',
      label: 'Aston Villa',
      slug: 'aston-villa',
      imageUrl: 'https://media.breakingthelines.dev/btl/crest/btl_football_club_taaaa1111.svg',
    }),
    textNode(' have drilled all season.'),
  ]),
  paragraph([
    mentionNode({
      text: 'Erling Haaland',
      mentionId: 'btl_football_player_pcccc3333',
      mentionKind: 'player',
      label: 'Erling Haaland',
      slug: 'erling-haaland',
    }),
    textNode(' still the most ruthless finisher in the league. Credit to '),
    mentionNode({
      text: '@zachlowy',
      mentionId: 'usr_zach',
      mentionKind: 'user',
      label: 'zachlowy',
      slug: '@zachlowy',
    }),
    textNode(' for the data.'),
  ]),
]);

// A structured body with no mentions, just bold/italic text runs across blocks.
const formattedJson = bodyJson([
  paragraph([
    textNode('One word for that match: '),
    textNode('Locura', 1 /* IS_BOLD */),
    textNode('.'),
  ]),
  paragraph([textNode('Going to be a long week for Los Blancos.', 1 << 1 /* IS_ITALIC */)]),
]);

export const UserMention = meta.story({
  render: () => (
    <div className="w-[500px] font-serif text-sm leading-[18px] text-foreground">
      <ThoughtBody
        body="Brilliant breakdown from @zachlowy on the second-half collapse. Worth a read."
        bodyJson={userMentionJson}
      />
    </div>
  ),
});

export const FootballEntityMention = meta.story({
  name: 'Football entity + user mentions',
  render: () => (
    <div className="w-[500px] font-serif text-sm leading-[18px] text-foreground">
      <ThoughtBody
        body="Set-piece routine that Aston Villa have drilled all season.\n\nErling Haaland still the most ruthless finisher in the league. Credit to @zachlowy for the data."
        bodyJson={entityMentionJson}
      />
    </div>
  ),
});

export const Formatted = meta.story({
  name: 'Formatted text (no mentions)',
  render: () => (
    <div className="w-[500px] font-serif text-sm leading-[18px] text-foreground">
      <ThoughtBody
        body="One word for that match: Locura.\n\nGoing to be a long week for Los Blancos."
        bodyJson={formattedJson}
      />
    </div>
  ),
});

export const LegacyFallback = meta.story({
  name: 'Legacy plain-text fallback (no body_json)',
  render: () => (
    <div className="w-[500px] font-serif text-sm leading-[18px] text-foreground">
      <ThoughtBody body="Legacy thought with a flat @zachlowy mention rendered through the @word regex fallback. Inline entity names like Aston Villa stay as prose." />
    </div>
  ),
});
