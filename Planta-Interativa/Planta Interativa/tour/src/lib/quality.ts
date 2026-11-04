/**
 * Rendering tiers. `high` is the full look; `low` trims post-processing for phones and busy GPUs;
 * `minimal` is for software WebGL (no GPU), where every effect costs whole seconds per frame.
 */
export type Quality = 'high' | 'low' | 'minimal'

const ORDER: readonly Quality[] = ['minimal', 'low', 'high']

/** Renderer names browsers report when WebGL runs on the CPU instead of a graphics card. */
const SOFTWARE_RENDERERS = /swiftshader|llvmpipe|softpipe|microsoft basic render/i

export const isSoftwareRenderer = (rendererName: string): boolean => SOFTWARE_RENDERERS.test(rendererName)

export const chooseQuality = ({ isSoftware, isCoarsePointer }: { isSoftware: boolean; isCoarsePointer: boolean }): Quality => {
  if (isSoftware) return 'minimal'
  return isCoarsePointer ? 'low' : 'high'
}

export const stepDown = (quality: Quality): Quality => ORDER[Math.max(0, ORDER.indexOf(quality) - 1)]

/** One tier up when the frame rate recovers, capped at the tier the device started on. */
export const stepUp = (quality: Quality, ceiling: Quality): Quality =>
  ORDER[Math.min(ORDER.indexOf(ceiling), ORDER.indexOf(quality) + 1)]
