import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [ "input" ]

  connect() {
    this.onKeydown = this.onKeydown.bind(this)
    document.addEventListener("keydown", this.onKeydown)
  }

  disconnect() {
    document.removeEventListener("keydown", this.onKeydown)
  }

  onKeydown(event) {
    if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return
    if (this.#typing(event.target)) return
    if (!this.inputTarget.offsetParent) return

    event.preventDefault()
    this.inputTarget.focus()
    this.inputTarget.select()
  }

  blur() {
    this.inputTarget.blur()
  }

  #typing(element) {
    return element.isContentEditable || [ "INPUT", "TEXTAREA", "SELECT" ].includes(element.tagName)
  }
}
