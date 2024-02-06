import tokens from './tokens'

export default input => {
  // currently, template is the highest level entry point
  return tokens.allDialogs(input)
}
