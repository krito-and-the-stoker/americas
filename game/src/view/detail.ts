import { ColonistEntity } from 'entity/colonist/types'

type BaseViewDescription = {
    id: number
}

export type ColonistViewDescription = BaseViewDescription & {
    type: 'Colonist',
    colonist: ColonistEntity
}

type ViewDescription = ColonistViewDescription


const state = {
    views: [] as ViewDescription[]
}

const Colonist = {
    open(colonist: ColonistEntity) {
        const id = colonist.referenceId
        if (state.views.some(view => view.id === id)) {
            return () => {}
        }

        state.views.push({
            id,
            type: 'Colonist',
            colonist
        })

        return () => Colonist.close(id)
    },

    close(id: number) {
        state.views = state.views.filter(view => view.id !== id)
    },

    closeAll() {
        state.views = state.views.filter(view => view.type !== 'Colonist')
    }
}

const closeAll = () => {
    state.views = []
}

export default {
    Colonist,
    closeAll,
    state
}
