import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    this.observer = new MutationObserver(() => this.scheduleMarkCurrentRoom())
    this.observer.observe(this.element, { childList: true, subtree: true })
    this.markCurrentRoom()
  }

  disconnect() {
    this.observer.disconnect()
  }

  scheduleMarkCurrentRoom() {
    if (this.pending) return

    this.pending = true
    requestAnimationFrame(() => {
      this.pending = false
      this.markCurrentRoom()
    })
  }

  markCurrentRoom() {
    const roomId = document.querySelector("meta[name='current-room-id']")?.content

    document.querySelectorAll("#sidebar [data-room-id]").forEach(link => {
      const current = link.dataset.roomId === roomId
      if (link.classList.contains("slack-current") === current) return

      link.classList.toggle("slack-current", current)
      if (current) {
        link.setAttribute("aria-current", "page")
      } else {
        link.removeAttribute("aria-current")
      }
    })
  }
}
