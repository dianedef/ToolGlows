import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import { describe, expect, it, vi } from 'vitest'

const bfcacheError = 'The page keeping the extension port is moved into back/forward cache, so the message channel is closed.'

function event<T extends (...args: any[]) => void>() {
  const listeners: T[] = []
  return {
    addListener: (listener: T) => listeners.push(listener),
    emit: (...args: Parameters<T>) => listeners.forEach(listener => listener(...args)),
  }
}

function harness(entry: 'background' | 'content-script') {
  const onConnect = event<(port: ReturnType<typeof makePort>) => void>()
  const makePort = () => ({
    name: JSON.stringify({ endpointName: 'content-script@1', fingerprint: 'session-1' }),
    onDisconnect: event<() => void>(),
    onMessage: event<(message: unknown) => void>(),
    postMessage: vi.fn(),
  })
  const ports: ReturnType<typeof makePort>[] = []
  let lastError: { message: string } | undefined
  const readLastError = vi.fn(() => lastError)
  const runtime = {
    onConnect,
    get lastError() { return readLastError() },
    connect: vi.fn(() => {
      const port = makePort()
      ports.push(port)
      return port
    }),
  }
  const warning = vi.fn()
  const localRequire = createRequire(import.meta.url)
  const filename = localRequire.resolve(`webext-bridge/${entry}`)
  const dependencyRequire = createRequire(filename)
  const module = { exports: {} }
  // Execute the installed package, with only the browser API replaced.
  runInNewContext(readFileSync(filename, 'utf8'), {
    module, exports: module.exports,
    require: (name: string) => name === 'webextension-polyfill'
      ? { runtime }
      : dependencyRequire(name),
    console: { warn: warning },
    setTimeout, clearTimeout,
  }, { filename })
  return {
    runtime, ports, makePort, warning, readLastError,
    disconnect(port: ReturnType<typeof makePort>, message?: string) {
      lastError = message ? { message } : undefined
      port.onDisconnect.emit()
      lastError = undefined
    },
  }
}

describe('installed bridge port disconnect handling', () => {
  it.each([undefined, bfcacheError, 'Unexpected transport failure'])('consumes %s and preserves content-script reconnection', message => {
    const bridge = harness('content-script')
    bridge.disconnect(bridge.ports[0], message)
    expect(bridge.readLastError).toHaveBeenCalledOnce()
    expect(bridge.runtime.connect).toHaveBeenCalledTimes(2)
    expect(bridge.ports[1].postMessage).toHaveBeenCalledWith({
      type: 'sync', pendingResponses: [], pendingDeliveries: [],
    })
    expect(bridge.warning).toHaveBeenCalledTimes(message === 'Unexpected transport failure' ? 1 : 0)
  })

  it.each([undefined, bfcacheError, 'Unexpected transport failure'])('consumes %s in the background and removes the disconnected session', message => {
    const bridge = harness('background')
    const port = bridge.makePort()
    bridge.runtime.onConnect.emit(port)
    bridge.disconnect(port, message)
    expect(bridge.readLastError).toHaveBeenCalledOnce()
    expect(bridge.warning).toHaveBeenCalledTimes(message === 'Unexpected transport failure' ? 1 : 0)

    const observer = bridge.makePort()
    observer.name = JSON.stringify({ endpointName: 'content-script@2', fingerprint: 'session-2' })
    bridge.runtime.onConnect.emit(observer)
    observer.onMessage.emit({ type: 'sync', pendingDeliveries: ['content-script@1'], pendingResponses: [] })
    expect(observer.postMessage).not.toHaveBeenCalled()
    bridge.runtime.onConnect.emit(bridge.makePort())
    expect(observer.postMessage).toHaveBeenCalledWith({ status: 'deliverable', deliverableTo: 'content-script@1' })
    expect(port.postMessage).not.toHaveBeenCalled()
  })
})
