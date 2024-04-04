import { For } from 'solid-js'
import $ from 'signal-chain-solid'

import ViewState, { ColonistViewDescription } from 'view/detail'

import ColonistDetail from './detailView/Colonist'

import styles from './DetailView.module.scss'

const Views = {
    Colonist: ({ colonist }: ColonistViewDescription) => ColonistDetail(colonist)
}


function DetailView() {
    const views = $.solid.create(
        $.emit(ViewState.state),
        $.listen.key('views')
    )

    const closeAll = () => {
        ViewState.closeAll()
    }

    return <For each={views()}>
        {view => <div class={styles.backdrop} onClick={closeAll}>
            <div class={styles.view}>
                <div class={styles.content}>{Views[view.type](view)}</div>
            </div>
        </div>}
    </For>
}

export default DetailView
