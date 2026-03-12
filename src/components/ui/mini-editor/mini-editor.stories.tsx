import { useState, useRef } from 'react';
import preview from '#.storybook/preview';
import { MiniEditor, type MiniEditorHandle } from './mini-editor';
import { Avatar, AvatarImage, AvatarFallback } from '#/components/ui/avatar';
import { Button } from '#/components/ui/button';
import { Image, Gif, SoccerBall } from '@phosphor-icons/react';

const meta = preview.meta({
  title: 'UI/MiniEditor',
  component: MiniEditor,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    submitOn: { control: 'select', options: ['enter', 'mod-enter'] },
    maxLength: { control: 'number' },
    disabled: { control: 'boolean' },
    multiline: { control: 'boolean' },
  },
});

export const Default = meta.story({
  args: {
    placeholder: 'Add a thought...',
    submitOn: 'enter',
    onSubmit: (text: string) => console.log('Submit:', text),
  },
  render: (args) => (
    <div className="w-[400px]">
      <MiniEditor {...args} />
    </div>
  ),
});

export const WithMaxLength = meta.story({
  render: () => {
    const [remaining, setRemaining] = useState(500);

    return (
      <div className="flex w-[500px] flex-col gap-2">
        <MiniEditor
          placeholder="Share your thoughts (max 500 chars)"
          submitOn="mod-enter"
          maxLength={500}
          onRemainingChange={setRemaining}
          onSubmit={(text) => console.log('Submit:', text)}
          multiline
        />
        <span
          className={`text-xs tabular-nums ${remaining < 0 ? 'text-red-500' : remaining <= 50 ? 'text-yellow-500' : 'text-muted-foreground'}`}
        >
          {remaining} characters remaining
        </span>
      </div>
    );
  },
});

export const MultiLine = meta.story({
  render: () => (
    <div className="w-[500px]">
      <MiniEditor
        placeholder="Write a longer thought..."
        submitOn="mod-enter"
        multiline
        onSubmit={(text) => console.log('Submit:', text)}
      />
    </div>
  ),
});

export const Disabled = meta.story({
  args: {
    placeholder: 'Log in to share your thoughts',
    disabled: true,
  },
  render: (args) => (
    <div className="w-[400px]">
      <MiniEditor {...args} />
    </div>
  ),
});

export const InPanel = meta.story({
  name: 'In Panel (ThoughtsPanel)',
  render: () => {
    const ref = useRef<MiniEditorHandle>(null);

    return (
      <div className="flex w-[740px] flex-col gap-6 bg-black p-8">
        <h2 className="font-content text-xl font-semibold tracking-[-0.6px] text-white">
          12 Thoughts
        </h2>
        <div className="flex items-center gap-6">
          <Avatar className="size-10 shrink-0">
            <AvatarImage src="https://i.pravatar.cc/150?u=me" alt="You" />
            <AvatarFallback>ZL</AvatarFallback>
          </Avatar>
          <div className="flex-1 border-b border-[#807c7c]/50 pb-2">
            <MiniEditor
              placeholder="Add a thought..."
              submitOn="enter"
              editorRef={ref}
              className="font-body text-[10px] font-medium text-white placeholder:text-[#807c7c]"
              onSubmit={(text) => {
                console.log('Submit:', text);
                ref.current?.clear();
              }}
            />
          </div>
        </div>
      </div>
    );
  },
});

export const AsComposer = meta.story({
  name: 'As Composer (ThoughtComposer)',
  render: () => {
    const ref = useRef<MiniEditorHandle>(null);
    const [remaining, setRemaining] = useState(500);
    const [hasText, setHasText] = useState(false);

    return (
      <div className="flex w-[500px] flex-col gap-2 rounded-[4px] border border-grey-300 bg-grey-100 px-8 py-3 backdrop-blur-[15px]">
        <div className="flex items-center gap-2">
          <Avatar size="default" className="shrink-0">
            <AvatarImage src="https://i.pravatar.cc/150?u=zach" alt="Your avatar" />
            <AvatarFallback>ZL</AvatarFallback>
          </Avatar>
          <MiniEditor
            placeholder="Share your thoughts"
            submitOn="mod-enter"
            maxLength={500}
            multiline
            editorRef={ref}
            className="text-sm font-medium leading-6 tracking-[-0.42px] text-foreground placeholder:text-muted-foreground"
            onRemainingChange={setRemaining}
            onChange={(text) => setHasText(text.length > 0)}
            onSubmit={(text) => {
              console.log('Submit:', text);
              ref.current?.clear();
              setHasText(false);
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center justify-center p-[9.5px] text-red-100 transition-colors hover:text-red-300"
            >
              <Image weight="regular" className="size-[15px]" />
            </button>
            <button
              type="button"
              className="flex items-center justify-center p-[9.5px] text-red-100 transition-colors hover:text-red-300"
            >
              <Gif weight="regular" className="size-[15px]" />
            </button>
            <button
              type="button"
              className="flex items-center justify-center p-[9.5px] text-red-100 transition-colors hover:text-red-300"
            >
              <SoccerBall weight="regular" className="size-[15px]" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            {hasText && (
              <span
                className={`text-xs tabular-nums ${remaining < 0 ? 'text-red-100' : remaining <= 50 ? 'text-yellow-500' : 'text-muted-foreground'}`}
              >
                {remaining}
              </span>
            )}
            <Button size="xs" disabled={!hasText}>
              Post
            </Button>
          </div>
        </div>
      </div>
    );
  },
});
