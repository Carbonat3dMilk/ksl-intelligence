import { useEffect, useMemo, useState } from 'react'
import './App.css'
import SitePreview from './SitePreview'
import ImagePanel from './ImagePanel'
import {
  MODEL,
  createStarterProject,
  normalizeProject,
  projectSchemaPrompt,
} from './projectSchema'

const STORAGE_KEY = 'local-studio-project-v1'

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced ? fenced[1] : text
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')

  if (start < 0 || end <= start) {
    throw new Error('The AI did not return a valid project. Please try again.')
  }

  return JSON.parse(candidate.slice(start, end + 1))
}

async function askOllama(messages) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      stream: false,
      format: 'json',
      messages,
      options: {
        temperature: 0.25,
        num_ctx: 8192,
        num_predict: 2600,
      },
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(
      response.status === 404
        ? `Ollama cannot find ${MODEL}. Run: ollama pull ${MODEL}`
        : `Ollama returned ${response.status}: ${details.slice(0, 120)}`
    )
  }

  const data = await response.json()
  if (!data.message?.content) throw new Error('Ollama returned an empty response.')
  return data.message.content
}

function App() {
  const [prompt, setPrompt] = useState(
    'Create a premium one-page website for a neighbourhood coffee shop called North & Pine. Warm, calm, modern, with a menu preview, story, reviews and visit section.'
  )
  const [editPrompt, setEditPrompt] = useState('')
  const [project, setProject] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? normalizeProject(JSON.parse(saved)) : createStarterProject()
    } catch {
      return createStarterProject()
    }
  })
  const [history, setHistory] = useState([])
  const [activePageId, setActivePageId] = useState(project.pages[0].id)
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState('')
  const [error, setError] = useState('')
  const [device, setDevice] = useState('desktop')

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project))
    } catch {
      setError('This browser has run out of local image storage. Export the project, then remove some uploaded images.')
    }
  }, [project])

  const activePage = useMemo(
    () => project.pages.find((page) => page.id === activePageId) || project.pages[0],
    [project, activePageId]
  )

  function commitProject(nextProject) {
    setHistory((items) => [...items.slice(-9), project])
    const normalized = normalizeProject(nextProject)
    setProject(normalized)
    setActivePageId(normalized.pages[0].id)
  }

  async function generateProject() {
    if (!prompt.trim() || loading) return
    setLoading(true)
    setError('')
    setStage('Planning pages and sections')

    try {
      const response = await askOllama([
        {
          role: 'system',
          content: `You are the planning engine in a local no-code website builder.
Turn the request into a polished website project using the supplied JSON schema.
Choose only supported section types. Write specific, believable copy for the requested business.
Return one JSON object only. Never return HTML, CSS, Markdown, or explanations.

${projectSchemaPrompt}`,
        },
        { role: 'user', content: prompt },
      ])

      setStage('Validating the project')
      commitProject(extractJson(response))
      setStage('')
    } catch (generationError) {
      setError(generationError.message || 'The project could not be generated.')
      setStage('')
    } finally {
      setLoading(false)
    }
  }

  async function editProject() {
    if (!editPrompt.trim() || loading) return
    setLoading(true)
    setError('')
    setStage('Applying your changes')

    try {
      const response = await askOllama([
        {
          role: 'system',
          content: `You edit an existing no-code website project.
Apply the user's requested change while preserving everything unrelated.
Return the complete updated JSON object only. Never return HTML, CSS, Markdown, or explanations.

${projectSchemaPrompt}`,
        },
        {
          role: 'user',
          content: `CURRENT PROJECT:\n${JSON.stringify(project)}\n\nREQUESTED CHANGE:\n${editPrompt}`,
        },
      ])

      commitProject(extractJson(response))
      setEditPrompt('')
      setStage('')
    } catch (generationError) {
      setError(generationError.message || 'The edit could not be applied.')
      setStage('')
    } finally {
      setLoading(false)
    }
  }

  function undo() {
    if (!history.length || loading) return
    const previous = history.at(-1)
    setHistory((items) => items.slice(0, -1))
    setProject(previous)
    setActivePageId(previous.pages[0].id)
  }

  function downloadProject() {
    const blob = new Blob([JSON.stringify(project, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${project.slug || 'website'}-project.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  function setSectionImage(pageId, sectionId, image) {
    const nextProject = {
      ...project,
      pages: project.pages.map((page) => page.id !== pageId ? page : {
        ...page,
        sections: page.sections.map((section) =>
          section.id === sectionId ? { ...section, image } : section
        ),
      }),
    }
    commitProject(nextProject)
    setActivePageId(pageId)
  }

  return (
    <main className="builder">
      <header className="topbar">
        <div className="brand">
          <span className="brandMark">L</span>
          <div>
            <strong>KSL Intelligence</strong>
            <small>AI website builder</small>
          </div>
        </div>

        <div className="topActions">
          <span className="status"><i />{MODEL}</span>
          <button onClick={undo} disabled={!history.length || loading}>Undo</button>
          <button onClick={downloadProject}>Export JSON</button>
        </div>
      </header>

      <section className="workspace">
        <aside className="controls">
          <p className="eyebrow">New project</p>
          <h1>Build anything you can describe.</h1>
          <p className="description">
            The AI creates a structured project from reusable components, then you can
            refine it with ordinary instructions.
          </p>

          <label htmlFor="buildPrompt">Describe your website</label>
          <textarea
            id="buildPrompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="A modern portfolio for..."
            disabled={loading}
          />
          <button
            className="primaryButton"
            onClick={generateProject}
            disabled={loading || !prompt.trim()}
          >
            {loading && stage ? stage : 'Generate website'}
          </button>

          <div className="divider"><span>then refine it</span></div>

          <label htmlFor="editPrompt">Ask for a change</label>
          <textarea
            id="editPrompt"
            className="editBox"
            value={editPrompt}
            onChange={(event) => setEditPrompt(event.target.value)}
            placeholder='Try “Make it darker”, “Add pricing”, or “Rewrite the hero for families”.'
            disabled={loading}
          />
          <button
            className="secondaryButton"
            onClick={editProject}
            disabled={loading || !editPrompt.trim()}
          >
            Apply change
          </button>

          {error && <p className="error">{error}</p>}

          <div className="divider"><span>images</span></div>
          <ImagePanel
            project={project}
            activePageId={activePage.id}
            onSetImage={setSectionImage}
          />

          <div className="projectInfo">
            <strong>{project.name}</strong>
            <span>{project.pages.length} page{project.pages.length === 1 ? '' : 's'}</span>
            <span>{project.pages.reduce((sum, page) => sum + page.sections.length, 0)} sections</span>
            <span>Saved automatically on this computer</span>
          </div>
        </aside>

        <section className="previewPanel">
          <div className="previewBar">
            <div className="trafficLights"><i /><i /><i /></div>
            <div className="pageTabs">
              {project.pages.map((page) => (
                <button
                  className={page.id === activePage.id ? 'active' : ''}
                  key={page.id}
                  onClick={() => setActivePageId(page.id)}
                >
                  {page.name}
                </button>
              ))}
            </div>
            <div className="devicePicker">
              {['desktop', 'tablet', 'mobile'].map((size) => (
                <button
                  className={device === size ? 'active' : ''}
                  key={size}
                  onClick={() => setDevice(size)}
                  title={size}
                >
                  {size[0].toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className={`previewViewport ${device}`}>
            <SitePreview
              project={project}
              page={activePage}
              onNavigate={setActivePageId}
            />
          </div>

          {loading && (
            <div className="loadingOverlay">
              <div className="spinner" />
              <strong>{stage || 'Working locally'}</strong>
              <span>This can take a few minutes on an 8 GB Mac.</span>
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

export default App
