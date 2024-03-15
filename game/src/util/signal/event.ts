import { CleanupExec, Listen } from './types'
import Util from 'util/util'

interface HasAddEventListener {
    addEventListener(event: string, listener: (event: Event) => void): void
}


export const listenToEvent = <Target extends HasAddEventListener | void, EventName extends EventList['name']>(event: EventName): Listen<InferEventType<EventName>, Target> => {
    return (resolve, target) => {
        let cleanup: CleanupExec
        const listener = (e: any) => {
            Util.execute(cleanup)
            cleanup = resolve(e)
        }

        (target as HasAddEventListener ?? window).addEventListener(event, listener)

        return [
            // @ts-expect-error
            () => (target as HasAddEventListener ?? window).removeEventListener(event, listener),
            (final: boolean) => Util.execute(cleanup, final)
        ]
    }
}

// Adjusted InferEventType to correctly infer the type from the EventList based on the event name
type InferEventType<Name extends EventList['name']> = (EventList & { name: Name; type: unknown })['type']


type EventList = {
    name:
        'dblclick' |
        'mousedown' |
        'mouseenter' |
        'mouseleave' |
        'mousemove' |
        'mouseout' |
        'mouseover' |
        'mouseup'
    type: MouseEvent
} | {
    name:
        'click' |
        'contextmenu' |
        'auxclick'
    type: PointerEvent
} | {
    name:
        'keydown' |
        'keypress' |
        'keyup'
    type: KeyboardEvent
} | {
    name:
        'beforeinput' |
        'input'
    type: InputEvent
} | {
    name:
        'focus' |
        'blur' |
        'focusin' |
        'focusout'
    type: FocusEvent
} | {
    name:
        'change'
    type: Event
} | {
    name:
        'submit'
    type: Event
} | {
    name:
        'reset'
    type: Event
} | {
    name:
        'resize'
    type: UIEvent
} | {
    name:
        'scroll'
    type: Event
} | {
    name:
        'wheel'
    type: WheelEvent
} | {
    name:
        'drag' |
        'dragend' |
        'dragenter' |
        'dragleave' |
        'dragover' |
        'dragstart' |
        'drop'
    type: DragEvent
} | {
    name:
        'animationstart' |
        'animationend' |
        'animationiteration'
    type: AnimationEvent
} | {
    name:
        'transitionend'
    type: TransitionEvent
} | {
    name:
        'toggle'
    type: Event
} | {
    name:
        'error'
    type: ErrorEvent
} | {
    name:
        'load' |
        'unload'
    type: Event
} | {
    name:
        'loadeddata' |
        'loadedmetadata' |
        'canplay' |
        'canplaythrough' |
        'play' |
        'pause' |
        'seeked' |
        'seeking' |
        'timeupdate' |
        'ended'
    type: Event
} | {
    name:
        'volumechange'
    type: Event
} | {
    name:
        'ratechange'
    type: Event
} | {
    name:
        'durationchange'
    type: Event
} | {
    name:
        'stalled'
    type: Event
} | {
    name:
        'suspend'
    type: Event
} | {
    name:
        'emptied'
    type: Event
} | {
    name:
        'progress'
    type: ProgressEvent
} | {
    name:
        'abort'
    type: UIEvent
} | {
    name:
        'resize'
    type: UIEvent
} | {
    name:
        'scroll'
    type: UIEvent
}

