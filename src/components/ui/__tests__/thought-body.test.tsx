import { describe, expect, it } from 'vitest';

import { ThoughtBody } from '../thought-body';
import { getSlotAttr, hasSlot, render, slotText, textContent } from './test-utils';

/* Serialized Lexical state builders — mirror MiniEditor.getBodyJson() output. */

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
  return { type: 'paragraph', version: 1, children, direction: 'ltr', format: '', indent: 0 };
}

function bodyJson(children: unknown[]): string {
  return JSON.stringify({
    root: { type: 'root', version: 1, children, direction: 'ltr', format: '', indent: 0 },
  });
}

describe('ThoughtBody — structured body_json', () => {
  it('renders a user mention as an `@`-prefixed link to the handle route', () => {
    const json = bodyJson([
      paragraph([
        textNode('Great call by '),
        mentionNode({
          text: '@zachlowy',
          mentionId: 'usr_zach',
          mentionKind: 'user',
          label: 'zachlowy',
          slug: '@zachlowy',
        }),
        textNode('.'),
      ]),
    ]);

    const markup = render(<ThoughtBody body="Great call by @zachlowy." bodyJson={json} />);

    // Structured path, not the legacy fallback.
    expect(getSlotAttr(markup, 'thought-body', 'data-structured')).toBe('true');
    // The mention is a link to /@zachlowy carrying the mention data attributes.
    expect(markup).toContain('href="/@zachlowy"');
    expect(markup).toContain('data-mention-id="usr_zach"');
    expect(markup).toContain('data-mention-kind="user"');
    // The visible text keeps the `@` and the surrounding prose.
    expect(textContent(markup)).toContain('@zachlowy');
    expect(textContent(markup)).toContain('Great call by');
  });

  it('renders a football-entity mention as a bare-label link to the entity route', () => {
    const json = bodyJson([
      paragraph([
        textNode('Set-piece from '),
        mentionNode({
          text: 'Aston Villa',
          mentionId: 'btl_football_club_taaaa1111',
          mentionKind: 'club',
          label: 'Aston Villa',
          slug: 'aston-villa',
        }),
        textNode('.'),
      ]),
    ]);

    const markup = render(<ThoughtBody body="Set-piece from Aston Villa." bodyJson={json} />);

    expect(markup).toContain('href="/aston-villa"');
    expect(markup).toContain('data-mention-id="btl_football_club_taaaa1111"');
    expect(markup).toContain('data-mention-kind="club"');
    // Bare label rendered inline (`textContent` inserts a space at the
    // mention/text-node boundary, hence the lenient prose checks).
    expect(textContent(markup)).toContain('Set-piece from');
    expect(textContent(markup)).toContain('Aston Villa');
    // No `@` prefix for entity kinds.
    expect(textContent(markup)).not.toContain('@Aston');
  });

  it('renders one block per top-level paragraph', () => {
    const json = bodyJson([
      paragraph([textNode('First line.')]),
      paragraph([textNode('Second line.')]),
    ]);
    const markup = render(<ThoughtBody body="First line.\n\nSecond line." bodyJson={json} />);
    const paragraphs = markup.match(/<p\b/g) ?? [];
    expect(paragraphs.length).toBe(2);
  });

  it('applies trivial inline format flags (bold)', () => {
    const json = bodyJson([paragraph([textNode('Locura', 1 /* IS_BOLD */)])]);
    const markup = render(<ThoughtBody body="Locura" bodyJson={json} />);
    expect(markup).toContain('<strong>Locura</strong>');
  });
});

describe('ThoughtBody — legacy fallback', () => {
  it('falls back to the @word regex when body_json is absent', () => {
    const markup = render(<ThoughtBody body="Legacy @zachlowy thought" />);
    expect(getSlotAttr(markup, 'thought-body', 'data-structured')).toBeUndefined();
    // Legacy renderer links @handle to /@handle.
    expect(markup).toContain('href="/@zachlowy"');
    expect(textContent(markup)).toContain('@zachlowy');
  });

  it('falls back to plain text when body_json is unparseable (no throw)', () => {
    const markup = render(<ThoughtBody body="Broken @zachlowy payload" bodyJson="{not json" />);
    expect(hasSlot(markup, 'thought-body')).toBe(true);
    expect(getSlotAttr(markup, 'thought-body', 'data-structured')).toBeUndefined();
    expect(markup).toContain('href="/@zachlowy"');
  });

  it('falls back when body_json parses but has no root.children', () => {
    const markup = render(<ThoughtBody body="No root here" bodyJson='{"foo":"bar"}' />);
    expect(getSlotAttr(markup, 'thought-body', 'data-structured')).toBeUndefined();
    expect(slotText(markup, 'thought-body')).toContain('No root here');
  });
});
