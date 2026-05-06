import type { MorandiColorOption } from '~/types/step-model'

const MORANDI_COLORS: MorandiColorOption[] = [
  { id: 'spectrum-red', name: '赤', hex: '#b87674' },
  { id: 'spectrum-orange', name: '橙', hex: '#cb986b' },
  { id: 'spectrum-yellow', name: '黄', hex: '#d8bf79' },
  { id: 'spectrum-green', name: '绿', hex: '#8faa7c' },
  { id: 'spectrum-cyan', name: '青', hex: '#7eaeb1' },
  { id: 'spectrum-blue', name: '蓝', hex: '#6f8fb5' },
  { id: 'spectrum-indigo', name: '靛', hex: '#7680b0' },
  { id: 'spectrum-violet', name: '紫', hex: '#9b84b2' }
]

export const useMorandiPalette = () => {
  return {
    morandiColors: MORANDI_COLORS
  }
}
