import { Readable } from 'node:stream'

import { Attachment, AttachmentContentEncoding } from '@cucumber/messages'

import { AttachmentOptions } from '../types.js'

const LOG_MEDIA_TYPE = 'text/x.cucumber.log+plain'
const LINK_MEDIA_TYPE = 'text/uri-list'

export async function makeAttachment(
  data: Readable | Buffer | string,
  options: AttachmentOptions
): Promise<Attachment> {
  let body = '',
    contentEncoding = AttachmentContentEncoding.IDENTITY

  if (typeof data === 'string') {
    body = data
  } else if (Buffer.isBuffer(data)) {
    body = data.toString('base64')
    contentEncoding = AttachmentContentEncoding.BASE64
  } else {
    const chunks = []
    for await (const chunk of data) {
      chunks.push(chunk)
    }
    body = Buffer.concat(chunks).toString('base64')
    contentEncoding = AttachmentContentEncoding.BASE64
  }

  return {
    body,
    contentEncoding,
    mediaType: options.mediaType,
    fileName: options.fileName,
  }
}

export async function makeLog(text: string) {
  return makeAttachment(text, { mediaType: LOG_MEDIA_TYPE })
}

export async function makeLink(url: string, title?: string) {
  return makeAttachment(url, { mediaType: LINK_MEDIA_TYPE, fileName: title })
}
