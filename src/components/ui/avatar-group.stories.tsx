import preview from '#.storybook/preview';
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from './avatar';
import { cursorPalette } from '#/tokens/colors';

const sampleAvatars = [
  { src: 'https://i.pravatar.cc/150?img=1', fallback: 'JD' },
  { src: 'https://i.pravatar.cc/150?img=2', fallback: 'AS' },
  { src: 'https://i.pravatar.cc/150?img=3', fallback: 'MK' },
  { src: 'https://i.pravatar.cc/150?img=4', fallback: 'RW' },
  { src: 'https://i.pravatar.cc/150?img=5', fallback: 'TL' },
  { src: 'https://i.pravatar.cc/150?img=6', fallback: 'NP' },
];

const meta = preview.meta({
  title: 'UI/AvatarGroup',
  component: AvatarGroup,
  tags: ['autodocs'],
});

export const Default = meta.story({
  render: () => (
    <AvatarGroup>
      {sampleAvatars.slice(0, 4).map((avatar, i) => (
        <Avatar key={i} size="sm">
          <AvatarImage src={avatar.src} alt={avatar.fallback} />
          <AvatarFallback>{avatar.fallback}</AvatarFallback>
        </Avatar>
      ))}
    </AvatarGroup>
  ),
});

export const WithOverflow = meta.story({
  render: () => (
    <AvatarGroup>
      {sampleAvatars.slice(0, 4).map((avatar, i) => (
        <Avatar key={i} size="sm">
          <AvatarImage src={avatar.src} alt={avatar.fallback} />
          <AvatarFallback>{avatar.fallback}</AvatarFallback>
        </Avatar>
      ))}
      <AvatarGroupCount>+2</AvatarGroupCount>
    </AvatarGroup>
  ),
});

export const SmallSize = meta.story({
  render: () => (
    <AvatarGroup>
      {sampleAvatars.slice(0, 3).map((avatar, i) => (
        <Avatar key={i} size="sm">
          <AvatarImage src={avatar.src} alt={avatar.fallback} />
          <AvatarFallback>{avatar.fallback}</AvatarFallback>
        </Avatar>
      ))}
    </AvatarGroup>
  ),
});

export const DefaultSize = meta.story({
  render: () => (
    <AvatarGroup>
      {sampleAvatars.slice(0, 3).map((avatar, i) => (
        <Avatar key={i}>
          <AvatarImage src={avatar.src} alt={avatar.fallback} />
          <AvatarFallback>{avatar.fallback}</AvatarFallback>
        </Avatar>
      ))}
    </AvatarGroup>
  ),
});

export const LargeSize = meta.story({
  render: () => (
    <AvatarGroup>
      {sampleAvatars.slice(0, 3).map((avatar, i) => (
        <Avatar key={i} size="lg">
          <AvatarImage src={avatar.src} alt={avatar.fallback} />
          <AvatarFallback>{avatar.fallback}</AvatarFallback>
        </Avatar>
      ))}
    </AvatarGroup>
  ),
});

export const FallbackOnly = meta.story({
  render: () => (
    <AvatarGroup>
      {sampleAvatars.slice(0, 4).map((avatar, i) => (
        <Avatar key={i} size="sm">
          <AvatarFallback>{avatar.fallback}</AvatarFallback>
        </Avatar>
      ))}
    </AvatarGroup>
  ),
});

const borderColors = ['red', 'cyan', 'white', 'grey'] as const;

export const ColouredBorders = meta.story({
  render: () => (
    <AvatarGroup>
      {sampleAvatars.slice(0, 4).map((avatar, i) => (
        <Avatar key={i} size="sm" borderColor={borderColors[i % borderColors.length]}>
          <AvatarImage src={avatar.src} alt={avatar.fallback} />
          <AvatarFallback>{avatar.fallback}</AvatarFallback>
        </Avatar>
      ))}
    </AvatarGroup>
  ),
});

export const CollaboratorPresence = meta.story({
  name: 'Collaborator Presence (Editor)',
  render: () => (
    <AvatarGroup>
      <Avatar size="sm" borderColor="red">
        <AvatarImage src="https://i.pravatar.cc/150?img=1" alt="Editor 1" />
        <AvatarFallback>E1</AvatarFallback>
      </Avatar>
      <Avatar size="sm" borderColor="cyan">
        <AvatarImage src="https://i.pravatar.cc/150?img=2" alt="Editor 2" />
        <AvatarFallback>E2</AvatarFallback>
      </Avatar>
      <Avatar size="sm" borderColor="white">
        <AvatarImage src="https://i.pravatar.cc/150?img=3" alt="Viewer" />
        <AvatarFallback>V1</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>+2</AvatarGroupCount>
    </AvatarGroup>
  ),
});

export const WithCursorColors = meta.story({
  name: 'With Cursor Colors',
  render: () => (
    <AvatarGroup>
      {cursorPalette.slice(0, 4).map((color, i) => (
        <Avatar key={color.name} size="sm" cursorColor={color.hex}>
          <AvatarImage src={sampleAvatars[i].src} alt={sampleAvatars[i].fallback} />
          <AvatarFallback fallbackColor={color.hex}>{sampleAvatars[i].fallback}</AvatarFallback>
        </Avatar>
      ))}
    </AvatarGroup>
  ),
});

export const WithStatus = meta.story({
  name: 'Status Indicators',
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Active</p>
        <Avatar cursorColor={cursorPalette[0].hex} status="active">
          <AvatarImage src="https://i.pravatar.cc/150?img=1" alt="Active" />
          <AvatarFallback>AC</AvatarFallback>
        </Avatar>
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Typing (pulsing ring)</p>
        <Avatar cursorColor={cursorPalette[1].hex} status="typing">
          <AvatarImage src="https://i.pravatar.cc/150?img=2" alt="Typing" />
          <AvatarFallback>TY</AvatarFallback>
        </Avatar>
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Idle (60% opacity)</p>
        <Avatar cursorColor={cursorPalette[2].hex} status="idle">
          <AvatarImage src="https://i.pravatar.cc/150?img=3" alt="Idle" />
          <AvatarFallback>ID</AvatarFallback>
        </Avatar>
      </div>
    </div>
  ),
});

export const Interactive = meta.story({
  name: 'Interactive (Hover/Tap)',
  render: () => (
    <div className="flex gap-4">
      <Avatar cursorColor={cursorPalette[0].hex} interactive>
        <AvatarImage src="https://i.pravatar.cc/150?img=1" alt="Hover me" />
        <AvatarFallback>HM</AvatarFallback>
      </Avatar>
      <Avatar cursorColor={cursorPalette[1].hex} interactive size="lg">
        <AvatarImage src="https://i.pravatar.cc/150?img=2" alt="Hover me too" />
        <AvatarFallback>H2</AvatarFallback>
      </Avatar>
    </div>
  ),
});

export const FallbackWithColors = meta.story({
  name: 'Fallback with Colors',
  render: () => (
    <div className="flex gap-4">
      {cursorPalette.map((color) => (
        <Avatar key={color.name} cursorColor={color.hex}>
          <AvatarFallback fallbackColor={color.hex}>
            {color.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ))}
    </div>
  ),
});
