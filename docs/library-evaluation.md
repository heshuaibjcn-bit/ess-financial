# Library Evaluation - Week 1

## IRR/NPV Libraries

### irr-npv
**Status:** ✅ Tested and working

**API:**
- `irr(cashFlows: number[]): number` - Returns IRR as a percentage (e.g., 8.14 for 8.14%)
- `npv(cashFlows: number[], rate: number): number` - Returns NPV

**Pros:**
- Simple API, single value return
- Returns both IRR and NPV
- Handles edge cases (all negative returns -10000%, zero investment returns +10000%)

**Cons:**
- Returns IRR as percentage, not decimal (non-standard)
- No TypeScript types (need to install `@types/irr-npv` - but package doesn't exist)
- No handling of multiple IRRs

**Verdict:** Usable but `@8hobbies/irr` has better API design

### @8hobbies/irr
**Status:** ✅ Tested and working

**API:**
- `computeIrr(cashFlows: number[]): number[]` - Returns array of valid IRRs as decimals (e.g., 0.0814 for 8.14%)
- `computeNpv(cashFlows: number[], rate: number): number` - Returns NPV

**Pros:**
- Returns IRR as decimal (standard, matches financial formulas)
- Handles multiple IRRs (returns array)
- Native TypeScript support
- Better edge case handling (returns empty array for invalid IRRs)
- More actively maintained

**Cons:**
- Slightly more complex API (array return)
- No single-value convenience function

**Verdict:** ✅ **RECOMMENDED** - Better API design, TypeScript support, handles multiple IRRs correctly

## Decision: Use @8hobbies/irr

We'll use `@8hobbies/irr` for IRR calculations. The API is more robust and the decimal return format matches financial conventions.

## React-PDF (@react-pdf/renderer)

**Status:** ✅ Tested and working

**API:**
- `<Document>` - Root PDF document component
- `<Page>` - Individual pages
- `<Text>`, `<View>` - Layout components
- `StyleSheet.create()` - CSS-like styling

**Tested Features:**
- ✅ Basic document structure
- ✅ Chinese character support (critical for China market)
- ✅ Multi-page documents
- ✅ Tables and complex layouts
- ✅ Custom styling (fontSize, fontWeight, flexDirection, etc.)

**Pros:**
- React component-based (familiar API)
- CSS-like styling (StyleSheet.create)
- Excellent Unicode/Chinese support
- Flexible layout system (flexbox-based)
- TypeScript support
- Can generate PDFs in browser or Node.js

**Cons:**
- Larger bundle size (~250KB minified)
- Learning curve for PDF-specific concepts
- Some limitations on advanced PDF features

**Verdict:** ✅ **RECOMMENDED** - Perfect for our use case (investment analysis reports with Chinese content)

## Summary

All three libraries tested successfully:

| Library | Status | Recommendation |
|---------|--------|----------------|
| @8hobbies/irr | ✅ Tested | **Use** - Better API than irr-npv |
| irr-npv | ✅ Tested | Skip - @8hobbies/irr is superior |
| @react-pdf/renderer | ✅ Tested | **Use** - Excellent for Chinese PDF reports |

### Dependencies to Keep
```json
{
  "@8hobbies/irr": "^2.0.0",
  "@react-pdf/renderer": "^4.0.0"
}
```

### Dependencies to Remove
```bash
npm uninstall irr-npv
```
