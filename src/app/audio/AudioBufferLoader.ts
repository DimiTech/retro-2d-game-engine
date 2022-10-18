import context from './AudioContext'

export function load(URI: string): Promise<AudioBuffer> {
  return new Promise((resolve) => {
    const request = new XMLHttpRequest()
    request.open('GET', URI, true)
    request.responseType = 'arraybuffer'
    request.onload = () => {
      context.decodeAudioData(request.response, buffer => {
        return resolve(buffer)
      })
    }
    request.send()
  })
}
