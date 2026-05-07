import type { MorandiColorOption } from '~/types/step-model'

const MORANDI_COLORS: MorandiColorOption[] = [
  { id: 'palette-coral', name: '珊瑚红', hex: '#ff7473' },
  { id: 'palette-amber', name: '琥珀黄', hex: '#ffc952' },
  { id: 'palette-sky', name: '晴空蓝', hex: '#47b8e0' },
  { id: 'palette-sage', name: '鼠尾草绿', hex: '#a5d296' },
  { id: 'palette-violet', name: '灰紫', hex: '#9055A2' }
]

export const useMorandiPalette = () => {
  return {
    morandiColors: MORANDI_COLORS
  }
}
