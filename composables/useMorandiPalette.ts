import type { MorandiColorOption } from '~/types/step-model'

const MORANDI_COLORS: MorandiColorOption[] = [
<<<<<<< HEAD
  { id: 'ash-rose', name: '灰玫瑰', hex: '#b7a39a' },
  { id: 'sand-beige', name: '砂米色', hex: '#d3c1ae' },
  { id: 'mist-linen', name: '雾亚麻', hex: '#c7beb3' },
  { id: 'sage-fog', name: '鼠尾草雾', hex: '#aab6ad' },
  { id: 'dusty-teal', name: '灰蓝绿', hex: '#8ea2a4' },
  { id: 'taupe-clay', name: '陶灰褐', hex: '#9f9086' },
  { id: 'slate-moss', name: '岩苔灰', hex: '#727f80' }
=======
  { id: 'spectrum-red', name: '赤', hex: '#b87674' },
  { id: 'spectrum-orange', name: '橙', hex: '#cb986b' },
  { id: 'spectrum-yellow', name: '黄', hex: '#d8bf79' },
  { id: 'spectrum-green', name: '绿', hex: '#8faa7c' },
  { id: 'spectrum-cyan', name: '青', hex: '#7eaeb1' },
  { id: 'spectrum-blue', name: '蓝', hex: '#6f8fb5' },
  { id: 'spectrum-indigo', name: '靛', hex: '#7680b0' },
  { id: 'spectrum-violet', name: '紫', hex: '#9b84b2' }
>>>>>>> dev
]

export const useMorandiPalette = () => {
  return {
    morandiColors: MORANDI_COLORS
  }
}
