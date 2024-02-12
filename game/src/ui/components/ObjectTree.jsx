import { createSignal, For } from 'solid-js'
import styles from './ObjectTree.module.scss'

const ObjectTree = (props) => {
  // Utility function to check if a value is an object (and not null or an array)
  const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

  // Component to display each property/value pair
  const Property = (props) => {
    const [isCollapsed, setIsCollapsed] = createSignal(true)
    const toggleCollapse = () => setIsCollapsed(!isCollapsed())

    return (
      <div class={styles.component}>
        <span onClick={toggleCollapse} class={styles.property}>
          {props.name}: {isObject(props.value) ? (isCollapsed() ? '{...}' : '{') : props.value}
        </span>
        {!isCollapsed() && isObject(props.value) && (
          <div class={styles.object}>
            <For each={Object.entries(props.value)}>
              {([key, value]) => <Property name={key} value={value} />}
            </For>
            {'}'}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Iterate over object properties and display them */}
      <For each={Object.entries(props.object)}>
        {([key, value]) => <Property name={key} value={value} />}
      </For>
    </div>
  )
}

export default ObjectTree
