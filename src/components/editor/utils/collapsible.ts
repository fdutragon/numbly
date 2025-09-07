export function setDomHiddenUntilFound(dom: HTMLElement): void {
  // @ts-expect-error until-found is experimental
  dom.hidden = "until-found"
}

export function domOnBeforeMatch(dom: HTMLElement, callback: () => void): void {
  dom.onbeforematch = callback
}
