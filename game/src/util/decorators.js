const ensureArguments =
  (n, fn) =>
  (...args) => {
    if (args.length < n) {
      throw new Error('Not enough arguments for function call to ', fn)
    }

    return fn(...args)
  }

export default {
  ensureArguments,
}
