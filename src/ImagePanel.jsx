import { useMemo, useState } from 'react'

async function resizeImage(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const image = await new Promise((resolve, reject) => {
    const element = new Image()
    element.onload = () => resolve(element)
    element.onerror = reject
    element.src = dataUrl
  })

  const scale = Math.min(1, 1200 / Math.max(image.width, image.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(image.width * scale)
  canvas.height = Math.round(image.height * scale)
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.72)
}

export default function ImagePanel({ project, activePageId, onSetImage }) {
  const page = project.pages.find((item) => item.id === activePageId) || project.pages[0]
  const [sectionId, setSectionId] = useState(page.sections[0]?.id || '')
  const selectedSection = useMemo(
    () => page.sections.find((section) => section.id === sectionId) || page.sections[0],
    [page, sectionId]
  )
  const [query, setQuery] = useState(selectedSection?.imageQuery || project.name)
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [message, setMessage] = useState('')

  async function upload(event) {
    const file = event.target.files?.[0]
    if (!file || !selectedSection) return

    try {
      setMessage('Preparing image…')
      const src = await resizeImage(file)
      onSetImage(page.id, selectedSection.id, {
        src,
        alt: file.name.replace(/\.[^.]+$/, ''),
        credit: 'Uploaded by you',
        sourceUrl: '',
      })
      setMessage('Image added')
    } catch {
      setMessage('That image could not be opened.')
    }
    event.target.value = ''
  }

  async function searchImages() {
    if (!query.trim()) return
    setSearching(true)
    setMessage('')

    try {
      const params = new URLSearchParams({
        action: 'query',
        generator: 'search',
        gsrsearch: `${query.trim()} filetype:bitmap`,
        gsrnamespace: '6',
        gsrlimit: '8',
        prop: 'imageinfo',
        iiprop: 'url|extmetadata',
        iiurlwidth: '900',
        format: 'json',
        origin: '*',
      })
      const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`)
      if (!response.ok) throw new Error()
      const data = await response.json()
      const images = Object.values(data.query?.pages || {}).map((item) => {
        const info = item.imageinfo?.[0] || {}
        const metadata = info.extmetadata || {}
        return {
          src: info.thumburl || info.url,
          alt: (metadata.ImageDescription?.value || item.title)
            .replace(/<[^>]*>/g, '').slice(0, 140),
          credit: (metadata.Artist?.value || 'Wikimedia Commons')
            .replace(/<[^>]*>/g, '').slice(0, 100),
          sourceUrl: info.descriptionurl || '',
        }
      }).filter((item) => item.src)
      setResults(images)
      setMessage(images.length ? '' : 'No images found. Try simpler words.')
    } catch {
      setMessage('Image search needs an internet connection.')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="imagePanel">
      <label htmlFor="imageSection">Image section</label>
      <select
        id="imageSection"
        value={selectedSection?.id || ''}
        onChange={(event) => {
          const next = page.sections.find((item) => item.id === event.target.value)
          setSectionId(event.target.value)
          setQuery(next?.imageQuery || next?.title || '')
          setResults([])
        }}
      >
        {page.sections.map((section) => (
          <option value={section.id} key={section.id}>{section.title}</option>
        ))}
      </select>

      <label className="uploadButton">
        Upload your image
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} />
      </label>

      <div className="imageSearch">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search free images"
          onKeyDown={(event) => event.key === 'Enter' && searchImages()}
        />
        <button onClick={searchImages} disabled={searching}>
          {searching ? '…' : 'Search'}
        </button>
      </div>

      {message && <small className="imageMessage">{message}</small>}

      {!!results.length && (
        <div className="imageResults">
          {results.map((image, index) => (
            <button
              key={`${image.src}-${index}`}
              onClick={() => {
                onSetImage(page.id, selectedSection.id, image)
                setMessage('Image added')
              }}
              title={`Use image by ${image.credit}`}
            >
              <img src={image.src} alt={image.alt} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
