import './SitePreview.css'

function Action({ action, primary, onNavigate }) {
  if (!action?.label) return null
  return (
    <button
      className={primary ? 'siteButton primary' : 'siteButton secondary'}
      onClick={() => onNavigate(action.target)}
    >
      {action.label}
    </button>
  )
}

function Cards({ items, type }) {
  if (type === 'form' || type === 'newsletter') {
    return (
      <form className={`siteForm ${type}`} onSubmit={(event) => event.preventDefault()}>
        {items.map((item, index) => {
          const inputType = ['email', 'tel', 'date', 'time'].includes(item.meta) ? item.meta : 'text'
          return (
            <label key={`${item.title}-${index}`}>
              <span>{item.title}</span>
              {item.meta === 'textarea'
                ? <textarea placeholder={item.text || item.title} />
                : <input type={inputType} placeholder={item.text || item.title} />}
            </label>
          )
        })}
        <button type="submit">Submit</button>
      </form>
    )
  }
  return (
    <div className={`siteGrid ${type}`}>
      {items.map((item, index) => (
        <article className="siteCard" key={`${item.title}-${index}`}>
          <span className="cardNumber">{String(index + 1).padStart(2, '0')}</span>
          {item.label && <small>{item.label}</small>}
          <h3>{item.title}</h3>
          {item.price && <strong className="price">{item.price}</strong>}
          {item.text && <p>{item.text}</p>}
          {item.meta && <span className="meta">{item.meta}</span>}
        </article>
      ))}
    </div>
  )
}

function SectionImage({ image, className = '' }) {
  if (!image?.src) return null
  return (
    <figure className={`sectionImage ${className}`}>
      <img src={image.src} alt={image.alt || ''} />
      {image.credit && <figcaption>{image.credit}</figcaption>}
    </figure>
  )
}

function Section({ section, onNavigate }) {
  if (section.type === 'hero') {
    return (
      <section id={section.id} className="siteSection siteHero">
        <div className="heroGlow" />
        <div className="heroContent">
          {section.eyebrow && <p className="siteEyebrow">{section.eyebrow}</p>}
          <h1>{section.title}</h1>
          <p className="heroText">{section.text}</p>
          <div className="siteActions">
            <Action action={section.primaryAction} primary onNavigate={onNavigate} />
            <Action action={section.secondaryAction} onNavigate={onNavigate} />
          </div>
        </div>
        {section.image?.src
          ? <SectionImage image={section.image} className="heroImage" />
          : <div className="heroArt"><span>{section.title.charAt(0)}</span></div>}
      </section>
    )
  }

  const isCallout = section.type === 'cta' || section.type === 'contact'
  return (
    <section id={section.id} className={`siteSection layout-${section.layout || 'default'} ${isCallout ? 'siteCallout' : ''}`}>
      <div className="sectionHeading">
        {section.eyebrow && <p className="siteEyebrow">{section.eyebrow}</p>}
        <h2>{section.title}</h2>
        {section.text && <p>{section.text}</p>}
      </div>
      <SectionImage image={section.image} />
      {!!section.items?.length && <Cards items={section.items} type={section.type} />}
      {(section.primaryAction || section.secondaryAction) && (
        <div className="siteActions">
          <Action action={section.primaryAction} primary onNavigate={onNavigate} />
          <Action action={section.secondaryAction} onNavigate={onNavigate} />
        </div>
      )}
    </section>
  )
}

export default function SitePreview({ project, page, onNavigate }) {
  const theme = project.theme

  function navigate(target) {
    const targetPage = project.pages.find((item) => item.id === target)
    if (targetPage) {
      onNavigate(targetPage.id)
      return
    }
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div
      className={`generatedSite font-${theme.font} style-${theme.style || 'minimal'}`}
      style={{
        '--site-primary': theme.primary,
        '--site-accent': theme.accent,
        '--site-bg': theme.background,
        '--site-surface': theme.surface,
        '--site-text': theme.text,
        '--site-muted': theme.muted,
        '--site-radius': theme.radius,
      }}
    >
      <nav className="siteNav">
        <button className="siteLogo" onClick={() => onNavigate(project.pages[0].id)}>
          <span>{project.name.charAt(0)}</span>{project.name}
        </button>
        <div>
          {project.pages.map((item) => (
            <button
              className={item.id === page.id ? 'active' : ''}
              key={item.id}
              onClick={() => onNavigate(item.id)}
            >
              {item.name}
            </button>
          ))}
        </div>
        <button className="navCta" onClick={() => navigate(project.navigation.ctaTarget)}>
          {project.navigation.ctaLabel}
        </button>
      </nav>

      {page.sections.map((section) => (
        <Section section={section} onNavigate={navigate} key={section.id} />
      ))}

      <footer className="siteFooter">
        <strong>{project.name}</strong>
        <p>{project.description}</p>
        <span>Built locally with KSL Intelligence</span>
      </footer>
    </div>
  )
}
