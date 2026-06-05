/**
 * Game Centre unit-test helpers.
 *
 * The unit project renders trees to a static markup string and asserts against
 * it (node environment, no DOM). Rather than keep a third near-identical copy,
 * we re-export the shared helpers from the `ui/__tests__` module so the
 * conventions stay in lockstep across component families.
 */
export {
  countSlot,
  getSlotAttr,
  hasSlot,
  render,
  sliceSlot,
  slotText,
  textContent,
} from '../../ui/__tests__/test-utils';
