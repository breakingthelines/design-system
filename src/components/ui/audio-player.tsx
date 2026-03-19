'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Play, Pause, SpeakerHigh, SpeakerSlash, SpinnerGap, WarningCircle } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';

const audioPlayerVariants = cva(
  'flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors',
  {
    variants: {
      variant: {
        default: 'border-white/10 bg-white/[0.03]',
        minimal: 'border-transparent bg-transparent px-0',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

type AudioStatus = 'hidden' | 'generating' | 'ready' | 'regenerating' | 'failed';

export interface AudioPlayerProps
  extends Omit<React.ComponentProps<'div'>, 'children'>,
    VariantProps<typeof audioPlayerVariants> {
  audioUrl?: string;
  status: AudioStatus;
  durationSeconds?: number;
  onRetry?: () => void;
  onPlayStateChange?: (playing: boolean) => void;
  onTimeUpdate?: (currentTime: number) => void;
}

function AudioPlayer({
  audioUrl,
  status,
  durationSeconds,
  onRetry,
  onPlayStateChange,
  onTimeUpdate,
  variant,
  className,
  ...props
}: AudioPlayerProps) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(durationSeconds ?? 0);
  const [speed, setSpeed] = React.useState(1);
  const [muted, setMuted] = React.useState(false);

  if (status === 'hidden') return null;

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const handlePlay = () => {
    setPlaying(true);
    onPlayStateChange?.(true);
  };

  const handlePause = () => {
    setPlaying(false);
    onPlayStateChange?.(false);
  };

  const handleTimeUpdate = () => {
    const t = audioRef.current?.currentTime ?? 0;
    setCurrentTime(t);
    onTimeUpdate?.(t);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    setCurrentTime(time);
  };

  const cycleSpeed = () => {
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const idx = speeds.indexOf(speed);
    const next = speeds[(idx + 1) % speeds.length];
    setSpeed(next);
    if (audioRef.current) {
      audioRef.current.playbackRate = next;
    }
  };

  const toggleMute = () => {
    setMuted(!muted);
    if (audioRef.current) {
      audioRef.current.muted = !muted;
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (status === 'generating') {
    return (
      <div className={cn(audioPlayerVariants({ variant }), className)} {...props}>
        <SpinnerGap size={18} className="animate-spin text-white/50" />
        <span className="font-content text-xs tracking-tight text-white/50">
          Generating audio...
        </span>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className={cn(audioPlayerVariants({ variant }), className)} {...props}>
        <WarningCircle size={18} className="text-red-400" />
        <span className="font-content text-xs tracking-tight text-white/50">
          Audio generation failed
        </span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="font-content ml-auto cursor-pointer text-xs font-semibold text-red-100 transition-colors hover:text-white"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn(audioPlayerVariants({ variant }), className)} {...props}>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          onPlay={handlePlay}
          onPause={handlePause}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handlePause}
        />
      )}

      {/* Play/Pause */}
      <button
        type="button"
        onClick={togglePlay}
        disabled={!audioUrl}
        className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-red-100 text-black transition-colors hover:bg-red-200 disabled:opacity-30"
      >
        {playing ? <Pause size={14} weight="fill" /> : <Play size={14} weight="fill" />}
      </button>

      {/* Time + scrubber */}
      <div className="flex flex-1 flex-col gap-1">
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="audio-scrubber h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-red-100"
          style={{
            background: `linear-gradient(to right, var(--color-red-100) ${progress}%, rgba(255,255,255,0.1) ${progress}%)`,
          }}
        />
        <div className="flex justify-between">
          <span className="font-content text-[10px] tabular-nums text-white/40">
            {formatTime(currentTime)}
          </span>
          <span className="font-content text-[10px] tabular-nums text-white/40">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Speed */}
      <button
        type="button"
        onClick={cycleSpeed}
        className="font-content shrink-0 cursor-pointer rounded px-1.5 py-0.5 text-[10px] font-bold text-white/60 transition-colors hover:bg-white/5 hover:text-white"
      >
        {speed}x
      </button>

      {/* Mute */}
      <button
        type="button"
        onClick={toggleMute}
        className="shrink-0 cursor-pointer text-white/60 transition-colors hover:text-white"
      >
        {muted ? <SpeakerSlash size={16} /> : <SpeakerHigh size={16} />}
      </button>

      {/* Regenerating badge */}
      {status === 'regenerating' && (
        <span className="font-content shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/40">
          Updating...
        </span>
      )}
    </div>
  );
}

export { AudioPlayer, audioPlayerVariants };
