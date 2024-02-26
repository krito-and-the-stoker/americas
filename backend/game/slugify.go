package game

import (
    "regexp"
    "strings"
    "golang.org/x/text/transform"
    "golang.org/x/text/unicode/norm"
    "unicode"
)

// isMn checks if a rune is a non-spacing mark
func isMn(r rune) bool {
    return unicode.Is(unicode.Mn, r) // Mn: Mark, Nonspacing
}

// removeAccents transforms a string by removing all accent marks
func removeAccents(s string) string {
    t := transform.Chain(norm.NFD, transform.RemoveFunc(isMn), norm.NFC)
    result, _, _ := transform.String(t, s)
    return result
}

// slugify converts a string to a slug, as per the specified requirements
func slugify(s string) string {
    // 1. Remove all accents
    noAccents := removeAccents(s)
    // 2. Make all letters lowercase
    lowercased := strings.ToLower(noAccents)
    // 3. Replace all remaining non-lower-case-letter sequences with a single dash
    nonAlphaNumeric := regexp.MustCompile(`[^a-z0-9]+`)
    slug := nonAlphaNumeric.ReplaceAllString(lowercased, "-")
    // Trim any leading or trailing dashes
    slug = strings.Trim(slug, "-")
    return slug
}
