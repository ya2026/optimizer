import type { MorandiColorOption } from '~/types/step-model'

const MORANDI_COLORS: MorandiColorOption[] = [
  { id: 'ash-rose', name: 'Ash Rose', hex: '#b7a39a' },
  { id: 'sand-beige', name: 'Sand Beige', hex: '#d3c1ae' },
  { id: 'mist-linen', name: 'Mist Linen', hex: '#c7beb3' },
  { id: 'sage-fog', name: 'Sage Fog', hex: '#aab6ad' },
  { id: 'dusty-teal', name: 'Dusty Teal', hex: '#8ea2a4' },
  { id: 'taupe-clay', name: 'Taupe Clay', hex: '#9f9086' },
  { id: 'slate-moss', name: 'Slate Moss', hex: '#727f80' }
]

export const useMorandiPalette = () => {
  return {
    morandiColors: MORANDI_COLORS
  }
}
