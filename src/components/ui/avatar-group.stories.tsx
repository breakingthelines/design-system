import preview from '#.storybook/preview'
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from './avatar'

const sampleAvatars = [
  { src: 'https://i.pravatar.cc/150?img=1', fallback: 'JD' },
  { src: 'https://i.pravatar.cc/150?img=2', fallback: 'AS' },
  { src: 'https://i.pravatar.cc/150?img=3', fallback: 'MK' },
  { src: 'https://i.pravatar.cc/150?img=4', fallback: 'RW' },
  { src: 'https://i.pravatar.cc/150?img=5', fallback: 'TL' },
  { src: 'https://i.pravatar.cc/150?img=6', fallback: 'NP' },
]

const meta = preview.meta({
  title: 'UI/AvatarGroup',
  component: AvatarGroup,
  tags: ['autodocs'],
})

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
})

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
})

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
})

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
})

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
})

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
})

const borderColors = ['red', 'cyan', 'white', 'grey'] as const

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
})

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
})
