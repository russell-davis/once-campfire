import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [ "dialog", "input", "list" ]

  connect() {
    this.observer = new MutationObserver(() => this.scheduleMarkCurrentRoom())
    this.observer.observe(this.element, { childList: true, subtree: true })
    this.markCurrentRoom()

    this.keydown = this.handleKeydown.bind(this)
    document.addEventListener("keydown", this.keydown, true)
  }

  disconnect() {
    this.observer.disconnect()
    document.removeEventListener("keydown", this.keydown, true)
    if (this.hasDialogTarget && this.dialogTarget.open) this.dialogTarget.close()
  }

  handleKeydown(event) {
    if (event.defaultPrevented || event.isComposing) return

    const key = event.key.toLowerCase()
    const mod = event.ctrlKey || event.metaKey

    if (mod && !event.altKey && !event.shiftKey && (key === "k" || key === "t") && this.hasDialogTarget) {
      event.preventDefault()
      event.stopPropagation()
      this.toggleSwitcher()
    } else if (event.altKey && !mod && (key === "arrowup" || key === "arrowdown")) {
      if (this.switcherOpen) return

      event.preventDefault()
      event.stopPropagation()
      this.visitAdjacentRoom(key === "arrowup" ? -1 : 1, event.shiftKey)
    }
  }

  get switcherOpen() {
    return this.hasDialogTarget && this.dialogTarget.open
  }

  roomLinks() {
    const sidebar = document.querySelector("#sidebar")
    if (!sidebar) return []

    const channels = [ ...sidebar.querySelectorAll("#shared_rooms [data-room-id]") ]
    const directs = [ ...sidebar.querySelectorAll("#direct_rooms [data-room-id]") ]

    return [ ...channels.map(link => [ link, false ]), ...directs.map(link => [ link, true ]) ]
      .map(([ link, direct ]) => ({
        name: this.visibleText(link),
        href: link.href,
        roomId: link.dataset.roomId,
        direct,
        unread: link.classList.contains("unread")
      }))
      .filter(room => room.name)
  }

  visibleText(element) {
    const clone = element.cloneNode(true)
    clone.querySelectorAll(".for-screen-reader").forEach(node => node.remove())
    return clone.textContent.replace(/\s+/g, " ").trim()
  }

  visitAdjacentRoom(step, unreadOnly) {
    const rooms = this.roomLinks()
    if (!rooms.length) return

    const currentId = document.querySelector("meta[name='current-room-id']")?.content
    const index = rooms.findIndex(room => room.roomId === currentId)
    const start = index < 0 ? (step > 0 ? -1 : 0) : index

    for (let i = 1; i <= rooms.length; i++) {
      const candidate = rooms[((start + step * i) % rooms.length + rooms.length) % rooms.length]
      if (candidate.roomId === currentId) return

      if (!unreadOnly || candidate.unread) {
        this.visit(candidate.href)
        return
      }
    }
  }

  visit(href) {
    if (window.Turbo) {
      window.Turbo.visit(href)
    } else {
      window.location.href = href
    }
  }

  toggleSwitcher() {
    if (!this.hasDialogTarget) return

    if (this.dialogTarget.open) {
      this.dialogTarget.close()
    } else {
      this.rooms = this.roomLinks()
      this.inputTarget.value = ""
      this.renderSwitcher()
      this.dialogTarget.showModal()
      this.inputTarget.focus()
    }
  }

  switcherClosed() {
    this.inputTarget.value = ""
  }

  backdropClick(event) {
    if (event.target === this.dialogTarget) this.dialogTarget.close()
  }

  filterSwitcher() {
    this.renderSwitcher()
  }

  renderSwitcher() {
    const query = this.inputTarget.value.trim().toLowerCase()
    let matches = this.rooms

    if (query) {
      matches = matches
        .map(room => ({ room, score: this.score(room.name.toLowerCase(), query) }))
        .filter(({ score }) => score >= 0)
        .sort((a, b) => a.score - b.score)
        .map(({ room }) => room)
    } else {
      matches = [ ...matches.filter(room => room.unread), ...matches.filter(room => !room.unread) ]
    }

    this.matches = matches
    this.selectedIndex = 0
    this.listTarget.replaceChildren(...matches.map(room => this.buildItem(room)))

    if (!matches.length) {
      const empty = document.createElement("li")
      empty.className = "slack-switcher__empty"
      empty.textContent = "No matches"
      this.listTarget.append(empty)
    }

    this.updateSelection()
  }

  score(name, query) {
    const index = name.indexOf(query)
    if (index < 0) return -1
    return index === 0 ? 0 : name[index - 1] === " " ? 1 : 2
  }

  buildItem(room) {
    const item = document.createElement("li")
    item.className = "slack-switcher__item"
    item.setAttribute("role", "option")
    if (room.unread) item.classList.add("slack-switcher__item--unread")

    const prefix = document.createElement("span")
    prefix.className = "slack-switcher__prefix"
    prefix.textContent = room.direct ? "@" : "#"

    const name = document.createElement("span")
    name.className = "slack-switcher__name"
    name.textContent = room.name

    item.append(prefix, name)
    return item
  }

  updateSelection() {
    const items = [ ...this.listTarget.querySelectorAll(".slack-switcher__item") ]
    items.forEach((item, index) => {
      item.setAttribute("aria-selected", index === this.selectedIndex ? "true" : "false")
    })
    items[this.selectedIndex]?.scrollIntoView({ block: "nearest" })
  }

  switcherKeydown(event) {
    if (event.isComposing) return

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      const count = this.matches.length
      if (!count) return

      this.selectedIndex = (this.selectedIndex + (event.key === "ArrowDown" ? 1 : -1) + count) % count
      this.updateSelection()
    } else if (event.key === "Enter") {
      event.preventDefault()
      this.openMatch(this.selectedIndex)
    }
  }

  openMatch(index) {
    const room = this.matches[index]
    if (!room) return

    this.dialogTarget.close()
    this.visit(room.href)
  }

  pickRoom(event) {
    const item = event.target.closest(".slack-switcher__item")
    if (item) this.openMatch([ ...this.listTarget.children ].indexOf(item))
  }

  hoverRoom(event) {
    const item = event.target.closest(".slack-switcher__item")
    if (!item) return

    const index = [ ...this.listTarget.children ].indexOf(item)
    if (index !== this.selectedIndex) {
      this.selectedIndex = index
      this.updateSelection()
    }
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
