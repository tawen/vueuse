import { computed, ref, watch } from 'vue-demi'
import type { MaybeComputedElementRef } from '../unrefElement'
import type { UseResizeObserverOptions } from '../useResizeObserver'
import { useResizeObserver } from '../useResizeObserver'
import { unrefElement } from '../unrefElement'
import { defaultWindow } from '../_configurable'

export interface ElementSize {
  width: number
  height: number
}

/**
 * Reactive size of an HTML element.
 *
 * @see https://vueuse.org/useElementSize
 */
export function useElementSize(
  target: MaybeComputedElementRef,
  initialSize: ElementSize = { width: 0, height: 0 },
  options: UseResizeObserverOptions = {},
) {
  const { window = defaultWindow, box = 'content-box' } = options
  const isSVG = computed(() => unrefElement(target)?.namespaceURI?.includes('svg'))
  const width = ref(initialSize.width)
  const height = ref(initialSize.height)

  const { stop: stop1 } = useResizeObserver(
    target,
    ([entry]) => {
      const boxSize = box === 'border-box'
        ? entry.borderBoxSize
        : box === 'content-box'
          ? entry.contentBoxSize
          : entry.devicePixelContentBoxSize

      if (window && isSVG.value) {
        const $elem = unrefElement(target)
        if ($elem) {
          const styles = window.getComputedStyle($elem)
          width.value = Number.parseFloat(styles.width)
          height.value = Number.parseFloat(styles.height)
        }
      }
      else {
        if (boxSize) {
          const formatBoxSize = Array.isArray(boxSize) ? boxSize : [boxSize]
          width.value = formatBoxSize.reduce((acc, { inlineSize }) => acc + inlineSize, 0)
          height.value = formatBoxSize.reduce((acc, { blockSize }) => acc + blockSize, 0)
        }
        else {
          // fallback
          width.value = entry.contentRect.width
          height.value = entry.contentRect.height
        }
      }
    },
    options,
  )

  const stop2 = watch(
    () => unrefElement(target),
    (ele) => {
      width.value = ele ? initialSize.width : 0
      height.value = ele ? initialSize.height : 0
    },
  )

  function stop() {
    stop1()
    stop2()
  }

  return {
    width,
    height,
    stop,
  }
}

export type UseElementSizeReturn = ReturnType<typeof useElementSize>
