import {HasProps} from "./core/has_props"
import {Class} from "./core/class"
import {ModelEvent, ModelEventType, BokehEventMap} from "./core/bokeh_events"
import * as p from "./core/properties"
import {isString, isPlainObject, isFunction} from "./core/util/types"
import {dict} from "./core/util/object"
import {equals, Comparator} from "core/util/eq"
import {logger} from "./core/logging"
import {CallbackLike0} from "./models/callbacks/callback"

export type ModelSelector<T> = Class<T> | string | {type: string}

export type ChangeCallback = CallbackLike0<Model>
export type EventCallback<T extends ModelEvent = ModelEvent> = CallbackLike0<T>

export type EventCallbackLike<T extends ModelEvent = ModelEvent> = EventCallback<T> | EventCallback<T>["execute"]

export namespace Model {
  export type Attrs = p.AttrsOf<Props>

  export type Props = HasProps.Props & {
    tags: p.Property<unknown[]>
    name: p.Property<string | null>
    js_property_callbacks: p.Property<{[key: string]: ChangeCallback[]}>
    js_event_callbacks: p.Property<{[key: string]: EventCallback[]}>
    subscribed_events: p.Property<string[]>
    syncable: p.Property<boolean>
  }
}

export interface Model extends Model.Attrs {}

export class Model extends HasProps {
  override properties: Model.Props

  private /*readonly*/ _js_callbacks: Map<string, (() => void)[]>

  override get is_syncable(): boolean {
    return this.syncable
  }

  override [equals](that: this, cmp: Comparator): boolean {
    return (cmp.structural ? true : cmp.eq(this.id, that.id)) && super[equals](that, cmp)
  }

  constructor(attrs?: Partial<Model.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Model.Props>(({Any, Unknown, Boolean, String, Array, Dict, Nullable}) => ({
      tags:                  [ Array(Unknown), [] ],
      name:                  [ Nullable(String), null ],
      js_property_callbacks: [ Dict(Array(Any /*TODO*/)), {} ],
      js_event_callbacks:    [ Dict(Array(Any /*TODO*/)), {} ],
      subscribed_events:     [ Array(String), [] ],
      syncable:              [ Boolean, true ],
    }))
  }

  override initialize(): void {
    super.initialize()
    this._js_callbacks = new Map()
  }

  override connect_signals(): void {
    super.connect_signals()

    this._update_property_callbacks()
    this.connect(this.properties.js_property_callbacks.change, () => this._update_property_callbacks())
    this.connect(this.properties.js_event_callbacks.change, () => this._update_event_callbacks())
    this.connect(this.properties.subscribed_events.change, () => this._update_event_callbacks())
  }

  /*protected*/ _process_event(event: ModelEvent): void {
    for (const callback of dict(this.js_event_callbacks).get(event.event_name) ?? [])
      callback.execute(event)

    if (this.document != null && this.subscribed_events.some((model) => model == event.event_name))
      this.document.event_manager.send_event(event)
  }

  trigger_event(event: ModelEvent): void {
    if (this.document != null) {
      event.origin = this
      this.document.event_manager.trigger(event)
    }
  }

  protected _update_event_callbacks(): void {
    if (this.document == null) {
      logger.warn("WARNING: Document not defined for updating event callbacks")
      return
    }
    this.document.event_manager.subscribed_models.add(this)
  }

  protected _update_property_callbacks(): void {
    const signal_for = (event: string) => {
      const [evt, attr=null] = event.split(":")
      return attr != null ? (this.properties as any)[attr][evt] : (this as any)[evt]
    }

    for (const [event, callbacks] of this._js_callbacks) {
      const signal = signal_for(event)
      for (const cb of callbacks)
        this.disconnect(signal, cb)
    }
    this._js_callbacks.clear()

    for (const [event, callbacks] of dict(this.js_property_callbacks)) {
      const wrappers = callbacks.map((cb) => () => cb.execute(this))
      this._js_callbacks.set(event, wrappers)
      const signal = signal_for(event)
      for (const cb of wrappers)
        this.connect(signal, cb)
    }
  }

  protected override _doc_attached(): void {
    if (!dict(this.js_event_callbacks).is_empty || this.subscribed_events.length != 0)
      this._update_event_callbacks()
  }

  protected override _doc_detached(): void {
    this.document!.event_manager.subscribed_models.delete(this)
  }

  select<T extends HasProps>(selector: ModelSelector<T>): T[] {
    if (isString(selector))
      return [...this.references()].filter((ref): ref is T => ref instanceof Model && ref.name === selector)
    else if (isPlainObject(selector) && "type" in selector)
      return [...this.references()].filter((ref): ref is T => ref.type == selector.type)
    else if (selector.prototype instanceof HasProps)
      return [...this.references()].filter((ref): ref is T => ref instanceof selector)
    else
      throw new Error("invalid selector")
  }

  select_one<T extends HasProps>(selector: ModelSelector<T>): T | null {
    const result = this.select(selector)
    switch (result.length) {
      case 0:
        return null
      case 1:
        return result[0]
      default:
        throw new Error("found more than one object matching given selector")
    }
  }

  on_event<T extends ModelEventType>(event: T, callback: EventCallbackLike<BokehEventMap[T]>): void
  on_event<T extends ModelEvent>(event: Class<T>, callback: EventCallbackLike<T>): void

  on_event(event: ModelEventType | Class<ModelEvent>, callback: EventCallbackLike): void {
    const name = isString(event) ? event : event.prototype.event_name
    this.js_event_callbacks[name] = [
      ...dict(this.js_event_callbacks).get(name) ?? [],
      isFunction(callback) ? {execute: callback} : callback,
    ]
  }
}
