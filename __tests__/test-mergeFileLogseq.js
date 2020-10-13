/* eslint-env node, browser, jasmine */
const { mergeFileLogseq } = require('isomorphic-git/internal-apis')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('mergeFileLogseq', () => {
  const testcases = [
    { name: 'addbullet-indentation-md', ext: 'md' },
    { name: 'addbullet-indentation-org', ext: 'org' },
    { name: 'newfile-org', ext: 'org' },
  ]
  for (const testcase of testcases) {
    it(testcase.name, async () => {
      // Setup
      const { fs, dir } = await makeFixture('test-mergeFileLogseq')
      // Test
      const { cleanMerge, mergedText } = mergeFileLogseq({
        ourContent: await fs.read(
          `${dir}/${testcase.name}-ours.${testcase.ext}`,
          'utf8'
        ),
        baseContent: await fs.read(
          `${dir}/${testcase.name}-base.${testcase.ext}`,
          'utf8'
        ),
        theirContent: await fs.read(
          `${dir}/${testcase.name}-theirs.${testcase.ext}`,
          'utf8'
        ),
      })
      expect(cleanMerge).toBe(true)
      expect(mergedText).toEqual(
        await fs.read(`${dir}/${testcase.name}-results.${testcase.ext}`, 'utf8')
      )
    })

    // The tests below are the same as those for test-mergeFile.js,
    // but applied to mergeFileLogseq.
    // To make sure that mergeFileLogseq maintains the same behavior
    // as mergeFile, except for the special-cases

    it('mergeFile a o b', async () => {
      // Setup
      const { fs, dir } = await makeFixture('test-mergeFile')
      // Test
      const { cleanMerge, mergedText } = mergeFileLogseq({
        ourContent: await fs.read(`${dir}/a.txt`, 'utf8'),
        baseContent: await fs.read(`${dir}/o.txt`, 'utf8'),
        theirContent: await fs.read(`${dir}/b.txt`, 'utf8'),
      })
      expect(cleanMerge).toBe(true)
      expect(mergedText).toEqual(await fs.read(`${dir}/aob.txt`, 'utf8'))
    })

    it('mergeFile a o c', async () => {
      // Setup
      const { fs, dir } = await makeFixture('test-mergeFile')
      // Test
      const { cleanMerge, mergedText } = mergeFileLogseq({
        ourContent: await fs.read(`${dir}/a.txt`, 'utf8'),
        baseContent: await fs.read(`${dir}/o.txt`, 'utf8'),
        theirContent: await fs.read(`${dir}/c.txt`, 'utf8'),
      })
      expect(cleanMerge).toBe(false)
      expect(mergedText).toEqual(await fs.read(`${dir}/aoc.txt`, 'utf8'))
    })

    it('mergeFile a o c --diff3', async () => {
      // Setup
      const { fs, dir } = await makeFixture('test-mergeFile')
      // Test
      const { cleanMerge, mergedText } = mergeFileLogseq({
        ourContent: await fs.read(`${dir}/a.txt`, 'utf8'),
        baseContent: await fs.read(`${dir}/o.txt`, 'utf8'),
        theirContent: await fs.read(`${dir}/c.txt`, 'utf8'),
        format: 'diff3',
      })
      expect(cleanMerge).toBe(false)
      expect(mergedText).toEqual(await fs.read(`${dir}/aoc3.txt`, 'utf8'))
    })

    it('mergeFile a o c --diff3 --marker-size=10', async () => {
      // Setup
      const { fs, dir } = await makeFixture('test-mergeFile')
      // Test
      const { cleanMerge, mergedText } = mergeFileLogseq({
        ourContent: await fs.read(`${dir}/a.txt`, 'utf8'),
        baseContent: await fs.read(`${dir}/o.txt`, 'utf8'),
        theirContent: await fs.read(`${dir}/c.txt`, 'utf8'),
        format: 'diff3',
        markerSize: 10,
      })
      expect(cleanMerge).toBe(false)
      expect(mergedText).toEqual(await fs.read(`${dir}/aoc3-m10.txt`, 'utf8'))
    })
  }
})
