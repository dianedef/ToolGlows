/** Run optional page refinements in small tasks so activation can paint first. */
export function createScheduledDomScan(
  selector: string,
  prepare: () => (element: Element) => (() => void) | undefined
) {
  const roots = new Set<ParentNode>()
  let elements: Element[] = []
  let cursor = 0
  let timer: ReturnType<typeof setTimeout> | null = null

  function run() {
    timer = null
    if (cursor >= elements.length) {
      const root = roots.values().next().value as ParentNode | undefined
      if (!root) return
      roots.delete(root)
      elements = [
        ...(root instanceof Element && root.matches(selector) ? [root] : []),
        ...Array.from(root.querySelectorAll(selector))
      ]
      cursor = 0
    }
    const plan = prepare()
    const writes: Array<() => void> = []
    const started = performance.now()
    let count = 0
    while (cursor < elements.length && count < 50 && performance.now() - started < 5) {
      const element = elements[cursor++]
      count += 1
      if (!element.isConnected) continue
      const write = plan(element)
      if (write) writes.push(write)
    }
    writes.forEach(write => write())
    if (cursor < elements.length || roots.size) timer = setTimeout(run, 16)
    else {
      elements = []
      cursor = 0
    }
  }

  return {
    enqueue(root: ParentNode) {
      if (![...roots].some(queued => queued === root || (queued instanceof Node && queued.contains(root as Node)))) {
        for (const queued of roots) {
          if (root instanceof Node && root.contains(queued as Node)) roots.delete(queued)
        }
        roots.add(root)
      }
      if (timer === null) timer = setTimeout(run, 0)
    },
    cancel() {
      if (timer !== null) clearTimeout(timer)
      timer = null
      roots.clear()
      elements = []
      cursor = 0
    }
  }
}
