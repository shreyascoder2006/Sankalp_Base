/**
 * Some embedded webviews ship a ResizeObserver that never delivers its initial
 * observation. react-three-fiber sizes its canvas from that callback, so the renderer
 * waits forever for a non-zero size and never draws a single frame -- a black canvas
 * with no error anywhere.
 *
 * This wraps ResizeObserver so observe() always reports the element's current rect on
 * the next frame, and keeps reporting on window resize. Where the native implementation
 * works, this is one harmless duplicate callback.
 */

type Cb = ResizeObserverCallback

function rectOf(el: Element): ResizeObserverEntry {
  const r = el.getBoundingClientRect()
  const box = [{ inlineSize: r.width, blockSize: r.height }] as unknown as
    ReadonlyArray<ResizeObserverSize>
  return {
    target: el,
    contentRect: r as DOMRectReadOnly,
    borderBoxSize: box,
    contentBoxSize: box,
    devicePixelContentBoxSize: box,
  }
}

export function installResizeShim(): void {
  if (typeof window === 'undefined' || !('ResizeObserver' in window)) return
  const Native = window.ResizeObserver

  class ShimmedResizeObserver implements ResizeObserver {
    private native: ResizeObserver | null = null
    private targets = new Set<Element>()
    private onWindowResize = () => this.flush()

    constructor(private cb: Cb) {
      try {
        this.native = new Native(cb)
      } catch {
        this.native = null
      }
      window.addEventListener('resize', this.onWindowResize)
    }

    private flush() {
      if (!this.targets.size) return
      const entries = [...this.targets]
        .filter((el) => el.isConnected)
        .map(rectOf)
      if (entries.length) this.cb(entries, this as unknown as ResizeObserver)
    }

    observe(target: Element, options?: ResizeObserverOptions) {
      this.targets.add(target)
      this.native?.observe(target, options)
      requestAnimationFrame(() => this.flush())
    }

    unobserve(target: Element) {
      this.targets.delete(target)
      this.native?.unobserve(target)
    }

    disconnect() {
      this.targets.clear()
      this.native?.disconnect()
      window.removeEventListener('resize', this.onWindowResize)
    }
  }

  window.ResizeObserver = ShimmedResizeObserver as unknown as typeof ResizeObserver
}
