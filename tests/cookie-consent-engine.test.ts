// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { startCookieConsent } from "../src/features/cookieConsent/engine"

describe("cookie consent engine", () => {
  let stop: (() => void) | undefined
  beforeEach(() => {
    vi.useFakeTimers()
    document.body.replaceWith(document.createElement("body"))
    vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue([
      { width: 100, height: 30 },
    ] as unknown as DOMRectList)
  })
  afterEach(() => {
    stop?.()
    stop = undefined
    vi.restoreAllMocks()
    vi.useRealTimers()
  })
  async function flush() {
    await Promise.resolve()
    await vi.advanceTimersByTimeAsync(300)
  }
  it.each([
    ["onetrust-banner-sdk", "onetrust-accept-btn-handler"],
    [
      "CybotCookiebotDialog",
      "CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll",
    ],
    ["didomi-notice", "didomi-notice-agree-button"],
  ])("accepts a recognized visible %s banner once", async (root, id) => {
    document.body.innerHTML = `<div id="${root}"><button id="${id}">Accept all</button></div>`
    const click = vi.fn()
    document.querySelector("button")!.addEventListener("click", click)
    stop = startCookieConsent(document)
    document.body.append(document.createElement("span"))
    await flush()
    expect(click).toHaveBeenCalledTimes(1)
  })
  it("does not click unrelated, authentication, unscoped or toolbar controls", () => {
    document.body.innerHTML =
      '<button>Accept all</button><button>Sign in</button><button id="onetrust-accept-btn-handler">Accept all</button><div id="toolglows-root"><div id="didomi-notice"><button id="didomi-notice-agree-button">Accept</button></div></div>'
    const click = vi.fn()
    document.body.addEventListener("click", click)
    stop = startCookieConsent(document)
    expect(click).not.toHaveBeenCalled()
  })
  it.each([
    "hidden",
    'style="display:none"',
    'style="opacity:0"',
    "inert",
    'aria-hidden="true"',
    'aria-disabled="true"',
  ])("ignores a banner with %s", (attribute) => {
    document.body.innerHTML = `<div id="onetrust-banner-sdk" ${attribute}><button id="onetrust-accept-btn-handler">Accept</button></div>`
    const click = vi.fn()
    document.body.addEventListener("click", click)
    stop = startCookieConsent(document)
    expect(click).not.toHaveBeenCalled()
  })
  it("waits for disabled buttons to become enabled", async () => {
    document.body.innerHTML =
      '<div id="didomi-notice"><button disabled id="didomi-notice-agree-button">Accept</button></div>'
    const click = vi.fn()
    document.body.addEventListener("click", click)
    stop = startCookieConsent(document)
    expect(click).not.toHaveBeenCalled()
    document.querySelector("button")!.disabled = false
    await flush()
    expect(click).toHaveBeenCalledTimes(1)
  })
  it("handles dynamic banners and cancels pending work on stop", async () => {
    const click = vi.fn()
    document.body.addEventListener("click", click)
    stop = startCookieConsent(document)
    document.body.innerHTML =
      '<div id="didomi-notice"><button id="didomi-notice-agree-button">Accept</button></div>'
    await flush()
    expect(click).toHaveBeenCalledTimes(1)
    document.body.innerHTML =
      '<div id="onetrust-banner-sdk"><button id="onetrust-accept-btn-handler">Accept</button></div>'
    await Promise.resolve()
    stop()
    await flush()
    expect(click).toHaveBeenCalledTimes(1)
  })
  it("stops observing after one minute", async () => {
    stop = startCookieConsent(document)
    await vi.advanceTimersByTimeAsync(60_000)
    document.body.innerHTML =
      '<div id="didomi-notice"><button id="didomi-notice-agree-button">Accept</button></div>'
    const click = vi.fn()
    document.body.addEventListener("click", click)
    await flush()
    expect(click).not.toHaveBeenCalled()
  })
  it("requires explicit acceptance text for Quantcast instead of button order", () => {
    document.body.innerHTML =
      '<div class="qc-cmp2-container"><div class="qc-cmp2-summary-buttons"><button mode="primary">Manage preferences</button><button>Accept all</button></div></div>'
    const click = vi.fn()
    document.body.addEventListener("click", click)
    stop = startCookieConsent(document)
    expect(click).not.toHaveBeenCalled()
  })
  it("accepts explicit Quantcast acceptance and ignores zero-area controls", () => {
    document.body.innerHTML =
      '<div class="qc-cmp2-container"><div class="qc-cmp2-summary-buttons"><button mode="primary">Tout accepter</button></div></div>'
    const click = vi.fn()
    document.body.addEventListener("click", click)
    vi.mocked(HTMLElement.prototype.getClientRects).mockReturnValueOnce([] as unknown as DOMRectList)
    stop = startCookieConsent(document)
    expect(click).not.toHaveBeenCalled()
    stop()
    stop = startCookieConsent(document)
    expect(click).toHaveBeenCalledTimes(1)
  })
  it("bounds clicks even when a CMP repeatedly replaces its button", async () => {
    document.body.innerHTML =
      '<div id="didomi-notice"><button id="didomi-notice-agree-button">Accept</button></div>'
    const click = vi.fn(() => {
      document.querySelector("button")!.outerHTML =
        '<button id="didomi-notice-agree-button">Accept</button>'
    })
    document.body.addEventListener("click", click)
    stop = startCookieConsent(document)
    for (let i = 0; i < 8; i++) await flush()
    expect(click).toHaveBeenCalledTimes(4)
  })
  it.each([
    ['Google', '<button id="L2AGLb">Tout accepter</button>'],
    ['Meta/Instagram', '<button data-cookiebanner="accept_button">Autoriser</button>'],
    ['Axeptio', '<button id="axeptio_btn_acceptAll">Accepter</button>'],
    ['SourcePoint', '<button class="sp_choice_type_11">J’accepte</button>']
  ])('accepts %s consent buttons with robust pointer events', (name, html) => {
    document.body.innerHTML = `<div>${html}</div>`
    const click = vi.fn()
    const pointerdown = vi.fn()
    const btn = document.querySelector('button')!
    btn.addEventListener('click', click)
    btn.addEventListener('pointerdown', pointerdown)
    stop = startCookieConsent(document)
    expect(click).toHaveBeenCalledTimes(1)
    expect(pointerdown).toHaveBeenCalledTimes(1)
  })
  it('accepts TikTok cookie banner inside shadow DOM', () => {
    const host = document.createElement('tiktok-cookie-banner')
    const shadow = host.attachShadow({ mode: 'open' })
    shadow.innerHTML = '<button>Allow all</button>'
    document.body.appendChild(host)
    const btn = shadow.querySelector('button')!
    const click = vi.fn()
    btn.addEventListener('click', click)
    stop = startCookieConsent(document)
    expect(click).toHaveBeenCalledTimes(1)
  })
})

