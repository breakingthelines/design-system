import preview from '#.storybook/preview';
import { Issue1CoverFallback } from './issue1-cover-fallback';

const meta = preview.meta({
  title: 'G5/Issue1CoverFallback',
  component: Issue1CoverFallback,
  tags: ['autodocs'],
});

export const Default = meta.story({
  render: () => (
    <div className="w-[360px]">
      <Issue1CoverFallback issueNumber={1} ownerHandle="ando" />
    </div>
  ),
});

export const Tactician = meta.story({
  render: () => (
    <div className="w-[360px]">
      <Issue1CoverFallback issueNumber={1} ownerHandle="zachlowy" archetype="Tactician" />
    </div>
  ),
});

export const Storyteller = meta.story({
  render: () => (
    <div className="w-[360px]">
      <Issue1CoverFallback issueNumber={1} ownerHandle="mattlaw" archetype="Storyteller" />
    </div>
  ),
});

export const CustomAccent = meta.story({
  render: () => (
    <div className="w-[360px]">
      <Issue1CoverFallback
        issueNumber={1}
        ownerHandle="ando"
        archetype="Editor"
        accentColor="#00ebeb"
      />
    </div>
  ),
});

export const Trio = meta.story({
  name: 'Three covers, one row',
  render: () => (
    <div className="grid w-[1080px] grid-cols-3 gap-6">
      <Issue1CoverFallback issueNumber={1} ownerHandle="ando" archetype="Tactician" />
      <Issue1CoverFallback issueNumber={1} ownerHandle="seyf" archetype="Storyteller" />
      <Issue1CoverFallback issueNumber={1} ownerHandle="lowy" archetype="Analyst" />
    </div>
  ),
});
