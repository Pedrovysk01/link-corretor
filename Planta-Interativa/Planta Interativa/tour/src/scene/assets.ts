/**
 * Locations of the CC0 Poly Haven assets fetched by `npm run assets` into public/assets/.
 * Credits for every file are listed in public/assets/credits.json.
 */
const BASE = `${import.meta.env.BASE_URL}assets`

export const HDRI_URL = `${BASE}/hdri/kloofendal_48d_partly_cloudy_puresky_2k.hdr`

/**
 * Where the sun sits in that HDRI, measured from its brightest pixel (u 0.595, v 0.234), in three.js
 * equirect terms: azimuth = atan2(z, x), elevation above the horizon. The shadow-casting light uses it
 * so shadows agree with the sun you can see in the sky.
 */
export const HDRI_SUN = { azimuth: 0.597, elevation: 0.836 } as const

/** Linear-light colour of the HDRI just above the horizon, so distance haze blends into the sky. */
export const HDRI_HORIZON = '#b3b8c9'

export type ScannedTextureId =
  | 'laminate_floor_02'
  | 'marble_01'
  | 'long_white_tiles'
  | 'wood_floor_deck'
  | 'plastered_wall_04'
  | 'painted_plaster_wall'
  | 'white_oak_veneer'
  | 'natural_walnut_veneer'
  | 'poly_wool_herringbone'
  | 'rough_linen'
  | 'wool_boucle'
  | 'leafy_grass'
  | 'gravel_floor_02'
  | 'grey_cartago_01'

export type TextureMap = 'diffuse' | 'nor_gl' | 'rough'

export const textureUrl = (id: ScannedTextureId, map: TextureMap) => `${BASE}/textures/${id}/${map}.jpg`

export type ModelId =
  | 'mid_century_lounge_chair'
  | 'modern_arm_chair_01'
  | 'modern_coffee_table_01'
  | 'coffee_table_round_01'
  | 'dining_chair_02'
  | 'modern_wooden_cabinet'
  | 'modern_ceiling_lamp_01'
  | 'potted_plant_02'
  | 'potted_plant_04'
  | 'ceramic_vase_01'
  | 'side_table_01'
  | 'shrub_02'
  | 'shrub_04'

export const modelUrl = (id: ModelId) => `${BASE}/models/${id}/${id}.gltf`
