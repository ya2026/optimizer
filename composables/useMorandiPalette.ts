import type { MorandiColorOption } from '~/types/step-model'

const MORANDI_COLORS: MorandiColorOption[] = [
  { id: 'ash-rose', name: '灰玫瑰', hex: '#b7a39a' },
  { id: 'sand-beige', name: '砂米色', hex: '#d3c1ae' },
  { id: 'mist-linen', name: '雾亚麻', hex: '#c7beb3' },
  { id: 'sage-fog', name: '鼠尾草雾', hex: '#aab6ad' },
  { id: 'dusty-teal', name: '灰蓝绿', hex: '#8ea2a4' },
  { id: 'taupe-clay', name: '陶灰褐', hex: '#9f9086' },
  { id: 'slate-moss', name: '岩苔灰', hex: '#727f80' }
]

export const useMorandiPalette = () => {
  return {
    morandiColors: MORANDI_COLORS
  }
}
