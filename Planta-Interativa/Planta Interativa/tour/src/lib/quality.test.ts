import { describe, expect, test } from 'vitest'
import { chooseQuality, isSoftwareRenderer, stepDown, stepUp } from './quality'

describe('isSoftwareRenderer', () => {
  test.each([
    'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (LLVM 10.0.0) (0x0000C0DE)), SwiftShader driver)',
    'llvmpipe (LLVM 15.0.7, 256 bits)',
    'Microsoft Basic Render Driver',
    'Google SwiftShader',
  ])('spots the CPU renderer "%s"', (name) => {
    expect(isSoftwareRenderer(name)).toBe(true)
  })

  test.each(['ANGLE (Apple, ANGLE Metal Renderer: Apple M2, Unspecified Version)', 'Adreno (TM) 740', 'NVIDIA GeForce RTX 4070/PCIe/SSE2', ''])(
    'treats "%s" as a real GPU (or unknown)',
    (name) => {
      expect(isSoftwareRenderer(name)).toBe(false)
    },
  )
})

describe('chooseQuality', () => {
  test('uses the lightest tier on software rendering, even on desktop', () => {
    expect(chooseQuality({ isSoftware: true, isCoarsePointer: false })).toBe('minimal')
  })

  test('starts phones and tablets on low and desktops on high', () => {
    expect(chooseQuality({ isSoftware: false, isCoarsePointer: true })).toBe('low')
    expect(chooseQuality({ isSoftware: false, isCoarsePointer: false })).toBe('high')
  })
})

describe('stepDown and stepUp', () => {
  test('drop one tier at a time and stop at minimal', () => {
    expect(stepDown('high')).toBe('low')
    expect(stepDown('low')).toBe('minimal')
    expect(stepDown('minimal')).toBe('minimal')
  })

  test('climb back up, but never above the starting tier', () => {
    expect(stepUp('minimal', 'high')).toBe('low')
    expect(stepUp('low', 'high')).toBe('high')
    expect(stepUp('minimal', 'minimal')).toBe('minimal')
    expect(stepUp('low', 'low')).toBe('low')
  })
})
