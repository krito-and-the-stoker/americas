import { createResource, For } from 'solid-js'

type ErrorItem = {
    id: string
    version: string
    message: string
    gameid: string
    timestamp: string
}

async function fetchErrors() {
    const response = await fetch('/api/error/list')
    const data = await response.json()

    return data.errors as ErrorItem[]
}

function ErrorList() {
    const [errors] = createResource(fetchErrors)
    const sortedErrors = () => errors.loading
        ? []
        : [...errors()!].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )

    return (
        <>
            <h1>Error List</h1>
            <table>
                <thead>
                    <tr>
                        <th>Id</th>
                        <th>Version</th>
                        <th>Message</th>
                        <th>Game ID</th>
                        <th>Timestamp</th>
                    </tr>
                    </thead>
                    <tbody>
                    <For each={sortedErrors()}>
                    {(error) => (
                        <tr>
                            <td>{error.id}</td>
                            <td>{error.version}</td>
                            <td>{error.message}</td>
                            <td>{error.gameid}</td>
                            <td>{error.timestamp}</td>
                        </tr>
                    )}
                    </For>
                </tbody>
            </table>
        </>
    )
}

export default ErrorList
