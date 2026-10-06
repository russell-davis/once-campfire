import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [ "button" ]

  connect() {
    this.onKeydown = this.onKeydown.bind(this)
    document.addEventListener("keydown", this.onKeydown)
  }

  disconnect() {
    document.removeEventListener("keydown", this.onKeydown)
    this.close()
  }

  get sidebar() {
    return document.getElementById("sidebar")
  }

  get isOpen() {
    return this.sidebar?.classList.contains("open")
  }

  toggle() {
    this.isOpen ? this.close() : this.open()
  }

  open() {
    this.sidebar?.classList.add("open")
    this.element.classList.add("open")
    this.buttonTarget.setAttribute("aria-expanded", "true")
  }

  close() {
    this.sidebar?.classList.remove("open")
    this.element.classList.remove("open")
    if (this.hasButtonTarget) this.buttonTarget.setAttribute("aria-expanded", "false")
  }

  onKeydown(event) {
    if (event.key === "Escape" && this.isOpen) this.close()
  }

  navigated(event) {
    if (event.target.closest?.("#sidebar a")) this.close()
  }
}
