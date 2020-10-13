import diff3Merge from 'diff3'

const LINEBREAKS = /^.*(\r?\n|$)/gm

export function mergeFile({
  ourContent,
  baseContent,
  theirContent,
  ourName = 'ours',
  baseName = 'base',
  theirName = 'theirs',
  format = 'diff',
  markerSize = 7,
}) {
  const ours = ourContent.match(LINEBREAKS)
  const base = baseContent.match(LINEBREAKS)
  const theirs = theirContent.match(LINEBREAKS)

  // Here we let the diff3 library do the heavy lifting.
  const result = diff3Merge(ours, base, theirs)

  // Here we note whether there are conflicts and format the results
  let mergedText = ''
  let cleanMerge = true
  for (const item of result) {
    if (item.ok) {
      mergedText += item.ok.join('')
    }
    if (item.conflict) {
      cleanMerge = false
      mergedText += `${'<'.repeat(markerSize)} ${ourName}\n`
      mergedText += item.conflict.a.join('')
      if (format === 'diff3') {
        mergedText += `${'|'.repeat(markerSize)} ${baseName}\n`
        mergedText += item.conflict.o.join('')
      }
      mergedText += `${'='.repeat(markerSize)}\n`
      mergedText += item.conflict.b.join('')
      mergedText += `${'>'.repeat(markerSize)} ${theirName}\n`
    }
  }
  return { cleanMerge, mergedText }
}

// Handling of special Logseq-cases requires detecting the start of a block
// and the start of a top-level block.
const TOP_LEVEL_BLOCK_START = /^(\*\*|##) /
const BLOCK_START = /^(\*\*+|##+) /
const EMPTY_BLOCK_OR_NOTHING = /$(#*|\**) ?/

/**
 * Merge a file with logseq-data (markdown or org-file)
 *
 * We want to automatically handle some conflicts
 * that are expected to show up during regular logseq usage.
 *
 * 1. Two clients both created the same file (and optinally added some Logseq blocks.)
 *    Expected if a user opens logseq on two different devices on a new day, without
 *    a sync inbetween, where both will auto-generate the journal page for the day.
 *
 * 2. Two clients added blocks to the same page independently, without a sync inbetween.
 *    Expected to be a common occurance on journal pages.
 *
 */
export function mergeFileLogseq({
  ourContent,
  baseContent,
  theirContent,
  ourName = 'ours',
  baseName = 'base',
  theirName = 'theirs',
  format = 'diff',
  markerSize = 7,
}) {
  const ours = ourContent.match(LINEBREAKS)
  let base = baseContent.match(LINEBREAKS)
  const theirs = theirContent.match(LINEBREAKS)

  // Special case for Logseq:
  // If the file has just been created, base will be [''].
  // But we don't want the new front-matter to conflict if it is identical
  // in both the new files. Let's pretend that base also contains the front-matter.
  if (base.join('') === '') {
    base = []
    for (let i = 0; i < ours.length && i < theirs.length; i++) {
      if (ours[i] === theirs[i]) base.push(ours[i])
      else break
    }
  }

  // Here we let the diff3 library do the heavy lifting.
  const result = diff3Merge(ours, base, theirs)

  // Here we note whether there are conflicts and format the results
  let mergedText = ''
  let cleanMerge = true
  for (let i = 0; i < result.length; i++) {
    const item = result[i]
    if (item.ok) {
      mergedText += item.ok.join('')
    }
    if (item.conflict) {
      // Special-case for logseq: If a line is equal except that a newline has been added
      // in ours & theirs, we won't treat it as a conflict.
      if (
        item.conflict.o.length &&
        item.conflict.a.length &&
        item.conflict.b.length &&
        item.conflict.o[0] === item.conflict.a[0].replace(/\r?\n/, '') &&
        item.conflict.o[0] === item.conflict.b[0].replace(/\r?\n/, '')
      ) {
        // The line did not really change. Just added newline
        mergedText += item.conflict.a.shift()
        item.conflict.b.shift()
      }
      // Special-case for logseq: If base of a conflicting region is empty (or has an empty block), and
      // both ours and theirs contains new blocks, we want to retain the blocks from both ours and theirs.
      if (EMPTY_BLOCK_OR_NOTHING.test(item.conflict.o.join(''))) {
        const ourText = item.conflict.a.join('')
        const theirText = item.conflict.b.join('')

        // In order to not risk attaching blocks to the wrong parent, we'll restrict ourself to the case where
        // both ours and theirs start with a block, and at least one of them is top-level
        const startWithBlock =
          BLOCK_START.test(ourText) && BLOCK_START.test(theirText)
        const eitherTopLevel =
          TOP_LEVEL_BLOCK_START.test(ourText) ||
          TOP_LEVEL_BLOCK_START.test(theirText)
        if (startWithBlock && eitherTopLevel) {
          // Unless both blocks are top-level, we need to make sure that
          // we first add the non-top-level block (which should be attached to
          // the last existing block in the file))
          let first, second
          if (TOP_LEVEL_BLOCK_START.test(ourText)) {
            first = theirText
            second = ourText
          } else {
            first = ourText
            second = theirText
          }

          mergedText += first

          // The file does not necessarily end with a newline, but we need a newline
          // when we're combining the two files together.
          if (first.slice(-1) !== '\n') mergedText += '\n'

          mergedText += second

          // We were able to automatically solve the conflict
          continue
        }
      }

      cleanMerge = false
      mergedText += `${'<'.repeat(markerSize)} ${ourName}\n`
      mergedText += item.conflict.a.join('')
      if (format === 'diff3') {
        mergedText += `${'|'.repeat(markerSize)} ${baseName}\n`
        mergedText += item.conflict.o.join('')
      }
      mergedText += `${'='.repeat(markerSize)}\n`
      mergedText += item.conflict.b.join('')
      mergedText += `${'>'.repeat(markerSize)} ${theirName}\n`
    }
  }
  return { cleanMerge, mergedText }
}
