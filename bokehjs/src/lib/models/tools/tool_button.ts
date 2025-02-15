import Hammer, {Manager} from "hammerjs"

import {DOMElementView, DOMComponentView} from "core/dom_view"
import {div, empty, Keys, StyleSheetLike} from "core/dom"
import {ToolIcon} from "core/enums"
import {ContextMenu} from "core/util/menus"
import {startsWith} from "core/util/string"
import {reversed} from "core/util/array"

import tools_css, * as tools from "styles/tool_button.css"
import icons_css, * as icons from "styles/icons.css"

import type {ToolbarView} from "./toolbar"
import type {Tool} from "./tool"

export abstract class ToolButtonView extends DOMElementView {
  override model: Tool
  override readonly parent: ToolbarView
  override readonly root: DOMComponentView

  private _hammer?: InstanceType<typeof Manager>
  private _menu?: ContextMenu

  override initialize(): void {
    super.initialize()

    const items = this.model.menu
    if (items == null) {
      this.el.addEventListener("click", (e) => {
        if (e.composedPath().includes(this.el)) {
          this._clicked()
        }
      })
    } else {
      const {location} = this.parent.model
      const reverse = location == "left" || location == "above"
      const orientation = this.parent.model.horizontal ? "vertical" : "horizontal"
      this._menu = new ContextMenu(!reverse ? items : reversed(items), {
        target: this.root.el,
        orientation,
        prevent_hide: (event) => event.composedPath().includes(this.el),
      })

      this._hammer = new Hammer(this.el, {
        cssProps: {} as any, // NOTE: don't assign style, use .bk-events instead
        touchAction: "auto",
        inputClass: Hammer.TouchMouseInput, // https://github.com/bokeh/bokeh/issues/9187
      })
      this._hammer.on("tap", (e) => {
        const {_menu} = this
        if (_menu != null && _menu.is_open) {
          _menu.hide()
          return
        }
        if (e.srcEvent.composedPath().includes(this.el)) {
          this._clicked()
        }
      })
      this._hammer.on("press", () => this._pressed())
      this.el.addEventListener("keydown", (event) => {
        if (event.keyCode == Keys.Enter) {
          this._clicked()
        }
      })
    }
  }

  override connect_signals(): void {
    this.connect(this.model.change, () => this.render())
  }

  override remove(): void {
    this._hammer?.destroy()
    this._menu?.remove()
    super.remove()
  }

  override styles(): StyleSheetLike[] {
    return [...super.styles(), tools_css, icons_css]
  }

  override css_classes(): string[] {
    return super.css_classes().concat(tools.tool_button)
  }

  override render(): void {
    empty(this.el)

    const icon_el = div({class: tools.tool_icon})
    this.el.appendChild(icon_el)

    if (this.model.menu != null) {
      const icon = (() => {
        switch (this.parent.model.location) {
          case "above": return icons.tool_icon_chevron_down
          case "below": return icons.tool_icon_chevron_up
          case "left":  return icons.tool_icon_chevron_right
          case "right": return icons.tool_icon_chevron_left
        }
      })()

      const chevron_el = div({class: [tools.tool_chevron, icon]})
      this.el.appendChild(chevron_el)
    }

    const icon = this.model.computed_icon
    if (icon != null) {
      if (startsWith(icon, "data:image")) {
        const url = `url("${encodeURI(icon)}")`
        icon_el.style.backgroundImage = url
      } else if (startsWith(icon, "--")) {
        icon_el.style.backgroundImage = `var(${icon})`
      } else if (startsWith(icon, ".")) {
        const cls = icon.substring(1)
        icon_el.classList.add(cls)
      } else if (ToolIcon.valid(icon)) {
        const cls = `bk-tool-icon-${icon.replace(/_/g, "-")}`
        icon_el.classList.add(cls)
      }
    }

    this.el.title = this.model.tooltip
    this.el.tabIndex = 0
  }

  protected abstract _clicked(): void

  protected _pressed(): void {
    const at = (() => {
      switch (this.parent.model.location) {
        case "right": return {left_of:  this.el}
        case "left":  return {right_of: this.el}
        case "above": return {below: this.el}
        case "below": return {above: this.el}
      }
    })()
    this._menu?.toggle(at)
  }
}
