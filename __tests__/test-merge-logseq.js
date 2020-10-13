/* eslint-env node, browser, jasmine */
const { merge, log } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('merge', () => {
  it('merge logseq special-cases', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-merge-logseq')
    const commit = (
      await log({
        fs,
        gitdir,
        depth: 1,
        ref: 'merge-devices',
      })
    )[0].commit

    const report = await merge({
      fs,
      gitdir,
      ours: 'device-2',
      theirs: 'device-1',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
    })
    const mergeCommit = (
      await log({
        fs,
        gitdir,
        ref: 'device-2',
        depth: 1,
      })
    )[0].commit
    expect(report.tree).toBe(commit.tree)
    expect(mergeCommit.tree).toEqual(commit.tree)
    expect(mergeCommit.message).toEqual(commit.message)
    expect(mergeCommit.parent).toEqual(commit.parent)
  })
})
