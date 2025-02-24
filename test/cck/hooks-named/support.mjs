import {Before,After,When} from '@cucumber/node'

Before({ name: 'A named before hook' }, () => {
  // no-op
})

When('a step passes', () => {
  // no-op
})

After({ name: 'A named after hook' }, () => {
  // no-op
})