import { register } from 'node:module'

register('./loader.js', new URL(import.meta.url))
