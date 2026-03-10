import preview from '#.storybook/preview';
import { ThoughtComposer } from './thought-composer';

const meta = preview.meta({
  title: 'UI/ThoughtComposer',
  component: ThoughtComposer,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
});

export const Default = meta.story({
  render: () => (
    <div className="w-[500px]">
      <ThoughtComposer
        initials="ZL"
        onSubmit={(text) => console.log('Submit:', text)}
        onImageClick={() => {}}
        onGifClick={() => {}}
        onEmojiClick={() => {}}
      />
    </div>
  ),
});

export const WithAvatar = meta.story({
  render: () => (
    <div className="w-[500px]">
      <ThoughtComposer
        avatarUrl="https://i.pravatar.cc/150?u=zach"
        onSubmit={(text) => console.log('Submit:', text)}
        onImageClick={() => {}}
        onGifClick={() => {}}
        onEmojiClick={() => {}}
      />
    </div>
  ),
});

export const Disabled = meta.story({
  render: () => (
    <div className="w-[500px]">
      <ThoughtComposer
        initials="ZL"
        disabled
        placeholder="Log in to share your thoughts"
        onSubmit={() => {}}
      />
    </div>
  ),
});
