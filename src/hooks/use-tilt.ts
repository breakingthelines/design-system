'use client';

import { useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { useCallback } from 'react';

interface TiltValues {
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  onMouseMove: (e: React.MouseEvent<HTMLElement>) => void;
  onMouseLeave: () => void;
}

/**
 * Mouse-tracking 3D tilt effect.
 * Returns framer-motion values for rotateX/rotateY that follow the cursor
 * position within the element bounds — creating a "plane" effect where
 * hovering a corner tilts the card toward that corner.
 *
 * @param maxTilt - Maximum rotation in degrees (default: 6)
 * @param springConfig - Spring stiffness/damping for smooth return
 */
function useTilt(maxTilt = 6, springConfig = { stiffness: 300, damping: 30 }): TiltValues {
  // Normalised cursor position (0–1), center = 0.5
  const cursorX = useMotionValue(0.5);
  const cursorY = useMotionValue(0.5);

  // Map cursor position to rotation:
  // - cursor at top (y=0) → positive rotateX (tilt toward viewer at top)
  // - cursor at left (x=0) → negative rotateY (tilt toward viewer at left)
  const rawRotateX = useTransform(cursorY, [0, 1], [maxTilt, -maxTilt]);
  const rawRotateY = useTransform(cursorX, [0, 1], [-maxTilt, maxTilt]);

  // Smooth with springs for that satisfying return-to-flat feel
  const rotateX = useSpring(rawRotateX, springConfig);
  const rotateY = useSpring(rawRotateY, springConfig);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      cursorX.set((e.clientX - rect.left) / rect.width);
      cursorY.set((e.clientY - rect.top) / rect.height);
    },
    [cursorX, cursorY]
  );

  const onMouseLeave = useCallback(() => {
    // Return to center (flat)
    cursorX.set(0.5);
    cursorY.set(0.5);
  }, [cursorX, cursorY]);

  return { rotateX, rotateY, onMouseMove, onMouseLeave };
}

export { useTilt, type TiltValues };
