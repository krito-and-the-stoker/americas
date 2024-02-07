// easier syntax to describe a tag
export const describeTag = (describe, matcher) => input => {
  const match = matcher(input)
  if (match) {
    return {
      ...match,
      ...describe(match),
    }
  }
}

// tries to repeatedly match the matcher
// if no match is made it fails
export const matchRepeat = matcher => input => {
  let rest = input
  let children = []

  let oldLength = rest.length + 1
  while (rest && rest.length < oldLength) {
    oldLength = rest.length
    let match = matcher(rest)
    // console.log('repeat', rest, { match })
    if (match) {
      rest = match.rest
      children.push({
        name: match.name,
        value: match.value,
        children: match.children,
      })
    } else {
      break
    }
  }

  if (rest.length < input.length) {
    return {
      children,
      rest,
    }
  } else {
    return null
  }
}

export const matchOptional = matcher => input => {
  const match = matcher(input)

  return match || {
    name: 'ignore',
    rest: input
  }
}

export const matchRepeatOptional = matcher => matchOptional(matchRepeat(matcher))

// tries to match all matchers in their specified order
// if one matchers is not matched it fails
export const matchAll = matchers => input => {
  let rest = input
  let children = []
  for (const fn of matchers) {
    const match = fn(rest)
    if (!match) {
      return null
    }

    children.push({
      name: match.name,
      children: match.children,
      value: match.value,
    })

    rest = match.rest
  }

  return {
    children,
    rest,
  }
}

// tries to match one of the matchers
// if no matchers matches, it fails
export const matchOne = matchers => input => {
  let match = null

  // try to match any of the matchers
  for (const fn of matchers) {
    match = fn(input)
    if (match) {
      return match
    }
  }

  // could not match
  return null
}

// tries to consume without matching any
// if no character can be consumed, it fails
export const matchNone = matchers => input => {
  let position = 0
  while (position < input.length) {
    const rest = input.substring(position)
    // if we matched something, we need to stop here
    if (matchers.find(fn => fn(rest))) {
      break
    }

    // consume 1 char
    position += 1
  }

  // we matched something immediately
  if (!position) {
    return null
  }

  // report consumption
  return {
    value: input.substring(0, position),
    rest: input.substring(position),
  }
}
