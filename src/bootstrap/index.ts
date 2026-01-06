import { register } from 'node:module'

register('../loader/index.js', new URL(import.meta.url))
