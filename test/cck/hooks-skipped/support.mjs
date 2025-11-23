import { After, Before, When } from '@cucumber/node'

Before({}, function () {
  // no-op
})

Before({ tags: '@skip-before' }, (t) => {
  t.skip()
})

Before({}, function () {
  // no-op
})

When('a normal step', function () {
  // no-op
})

When('a step that skips', (t) => {
  t.skip()
})

After({}, function () {
  // no-op
})

After({ tags: '@skip-after' }, (t) => {
  t.skip()
})

After({}, function () {
  // no-op
})
