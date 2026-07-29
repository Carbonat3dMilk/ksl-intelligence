import JSZip from 'jszip'

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

function actionLink(action, className = '') {
  if (!action?.label) return ''
  return `<a class="button ${className}" href="#${escapeHtml(action.target)}">${escapeHtml(action.label)}</a>`
}

function renderItems(section) {
  if (!section.items?.length) return ''
  if (section.type === 'form' || section.type === 'newsletter') {
    const fields = section.items.map((item) => {
      const type = ['email', 'tel', 'date', 'time'].includes(item.meta) ? item.meta : 'text'
      const control = item.meta === 'textarea'
        ? `<textarea placeholder="${escapeHtml(item.text || item.title)}"></textarea>`
        : `<input type="${type}" placeholder="${escapeHtml(item.text || item.title)}">`
      return `<label><span>${escapeHtml(item.title)}</span>${control}</label>`
    }).join('')
    return `<form class="site-form ${section.type}" onsubmit="event.preventDefault()">${fields}<button type="submit">Submit</button></form>`
  }
  return `<div class="grid ${escapeHtml(section.type)}">${section.items.map((item, index) => `
    <article class="card">
      <span class="number">${String(index + 1).padStart(2, '0')}</span>
      ${item.label ? `<small>${escapeHtml(item.label)}</small>` : ''}
      <h3>${escapeHtml(item.title)}</h3>
      ${item.price ? `<strong class="price">${escapeHtml(item.price)}</strong>` : ''}
      ${item.text ? `<p>${escapeHtml(item.text)}</p>` : ''}
      ${item.meta ? `<span class="meta">${escapeHtml(item.meta)}</span>` : ''}
    </article>`).join('')}</div>`
}

function renderImage(section) {
  if (!section.image?.src) return ''
  return `<figure class="section-image">
    <img src="${escapeHtml(section.image.src)}" alt="${escapeHtml(section.image.alt)}">
    ${section.image.credit ? `<figcaption>${escapeHtml(section.image.credit)}</figcaption>` : ''}
  </figure>`
}

function renderSection(section) {
  const actions = `${actionLink(section.primaryAction, 'primary')}${actionLink(section.secondaryAction)}`
  if (section.type === 'hero') {
    return `<section id="${escapeHtml(section.id)}" class="section hero">
      <div class="hero-copy">
        ${section.eyebrow ? `<p class="eyebrow">${escapeHtml(section.eyebrow)}</p>` : ''}
        <h1>${escapeHtml(section.title)}</h1>
        <p class="lead">${escapeHtml(section.text)}</p>
        <div class="actions">${actions}</div>
      </div>
      ${renderImage(section) || `<div class="placeholder">${escapeHtml(section.title.charAt(0))}</div>`}
    </section>`
  }

  const callout = ['cta', 'contact'].includes(section.type) ? ' callout' : ''
  return `<section id="${escapeHtml(section.id)}" class="section layout-${escapeHtml(section.layout || 'default')}${callout}">
    <header class="section-heading">
      ${section.eyebrow ? `<p class="eyebrow">${escapeHtml(section.eyebrow)}</p>` : ''}
      <h2>${escapeHtml(section.title)}</h2>
      ${section.text ? `<p>${escapeHtml(section.text)}</p>` : ''}
    </header>
    ${renderImage(section)}
    ${renderItems(section)}
    ${actions ? `<div class="actions">${actions}</div>` : ''}
  </section>`
}

function createPage(project, page) {
  const pageLinks = project.pages.map((item) => {
    const href = item.id === project.pages[0].id ? 'index.html' : `${item.id}.html`
    return `<a href="${href}">${escapeHtml(item.name)}</a>`
  }).join('')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeHtml(project.description)}">
  <title>${escapeHtml(page.name)} | ${escapeHtml(project.name)}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <nav>
    <a class="logo" href="index.html"><span>${escapeHtml(project.name.charAt(0))}</span>${escapeHtml(project.name)}</a>
    <div class="nav-links">${pageLinks}</div>
    <a class="nav-cta" href="#${escapeHtml(project.navigation.ctaTarget)}">${escapeHtml(project.navigation.ctaLabel)}</a>
  </nav>
  <main>${page.sections.map(renderSection).join('')}</main>
  <footer><strong>${escapeHtml(project.name)}</strong><p>${escapeHtml(project.description)}</p><span>© ${new Date().getFullYear()}</span></footer>
</body>
</html>`
}

function createStyles(theme) {
  return `*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;color:${theme.text};background:${theme.background};font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;line-height:1.55}a{color:inherit;text-decoration:none}nav{min-height:74px;padding:0 6vw;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:20px;border-bottom:1px solid color-mix(in srgb,${theme.text} 12%,transparent);position:sticky;top:0;z-index:5;background:color-mix(in srgb,${theme.background} 90%,transparent);backdrop-filter:blur(14px)}.logo{justify-self:start;display:flex;align-items:center;gap:9px;font-weight:850}.logo span{width:30px;height:30px;display:grid;place-items:center;border-radius:50%;color:#fff;background:${theme.primary}}.nav-links{display:flex;gap:20px;color:${theme.muted};font-size:13px}.nav-cta,.button{padding:11px 17px;border:1px solid color-mix(in srgb,${theme.text} 20%,transparent);border-radius:${theme.radius};font-size:13px;font-weight:750}.nav-cta{justify-self:end;color:#fff;background:${theme.primary};border-color:${theme.primary}}.section{padding:clamp(70px,9vw,125px) max(6vw,28px);scroll-margin-top:74px}.layout-centered .section-heading{margin-left:auto;margin-right:auto;text-align:center}.layout-centered .actions{justify-content:center}.layout-split:not(.hero){display:grid;grid-template-columns:.8fr 1.2fr;gap:6vw;align-items:center}.layout-bento .grid{grid-template-columns:repeat(4,1fr)}.layout-bento .card:first-child{grid-column:span 2;grid-row:span 2}.layout-compact{padding-top:48px;padding-bottom:48px}.hero{min-height:620px;display:grid;grid-template-columns:1.18fr .82fr;align-items:center;gap:7vw}.eyebrow{margin:0 0 14px;color:${theme.primary};font-size:11px;font-weight:850;letter-spacing:.14em;text-transform:uppercase}.hero h1{margin:0;font-size:clamp(48px,7vw,92px);line-height:.98;letter-spacing:-.055em}.lead{max-width:620px;margin:24px 0 0;color:${theme.muted};font-size:clamp(16px,1.7vw,20px)}.actions{margin-top:28px;display:flex;flex-wrap:wrap;gap:10px}.button.primary{color:#fff;background:${theme.primary};border-color:${theme.primary}}.placeholder{aspect-ratio:1;display:grid;place-items:center;border-radius:${theme.radius};color:#fff;background:linear-gradient(145deg,${theme.primary},${theme.accent});font-size:clamp(90px,15vw,190px);font-weight:900}.section-image{position:relative;margin:0 0 38px;overflow:hidden;border-radius:${theme.radius};background:${theme.surface}}.hero .section-image{aspect-ratio:1;margin:0}.section-image img{width:100%;height:100%;max-height:560px;display:block;object-fit:cover}.section-image figcaption{position:absolute;right:8px;bottom:8px;padding:4px 7px;border-radius:5px;color:#fff;background:#0009;font-size:9px}.section-heading{max-width:720px;margin-bottom:38px}.section-heading h2{margin:0;font-size:clamp(34px,4.5vw,58px);line-height:1.05;letter-spacing:-.045em}.section-heading>p:last-child{color:${theme.muted}}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.card{min-height:210px;padding:25px;border:1px solid color-mix(in srgb,${theme.text} 10%,transparent);border-radius:${theme.radius};background:${theme.surface};transition:transform .18s ease,box-shadow .18s ease}.card:hover{transform:translateY(-4px);box-shadow:0 18px 45px color-mix(in srgb,${theme.text} 9%,transparent)}.number,.card small{color:${theme.primary};font-weight:800}.card h3{margin:36px 0 9px;font-size:20px}.card p,.meta{color:${theme.muted};font-size:13px}.price{display:block;margin:12px 0;color:${theme.primary};font-size:30px}.grid.logos{grid-template-columns:repeat(4,1fr)}.grid.logos .card{min-height:100px;display:grid;place-items:center;text-align:center}.grid.logos .number,.grid.logos p{display:none}.site-form{max-width:780px;padding:clamp(20px,4vw,38px);display:grid;grid-template-columns:repeat(2,1fr);gap:16px;border:1px solid color-mix(in srgb,${theme.text} 10%,transparent);border-radius:${theme.radius};background:${theme.surface}}.site-form label{display:grid;gap:7px;font-size:12px;font-weight:750}.site-form input,.site-form textarea{width:100%;min-height:48px;padding:12px 14px;border:1px solid color-mix(in srgb,${theme.text} 16%,transparent);border-radius:${theme.radius};color:${theme.text};background:${theme.background};font:inherit}.site-form textarea{min-height:110px;resize:vertical}.site-form button{min-height:48px;padding:0 20px;border:0;border-radius:${theme.radius};color:#fff;background:${theme.primary};font-weight:800}.site-form.newsletter{max-width:680px;grid-template-columns:1fr auto}.callout{margin:35px max(3vw,16px);padding:clamp(60px,8vw,100px);border-radius:${theme.radius};color:#fff;background:linear-gradient(135deg,${theme.primary},color-mix(in srgb,${theme.primary} 58%,#111))}.callout .eyebrow,.callout .section-heading>p:last-child{color:#ffffffb8}.callout .button.primary{color:${theme.primary};background:#fff;border-color:#fff}footer{padding:42px 6vw;display:grid;grid-template-columns:1fr 2fr 1fr;gap:20px;border-top:1px solid color-mix(in srgb,${theme.text} 12%,transparent);color:${theme.muted};font-size:12px}footer p{margin:0}footer span{text-align:right}@media(max-width:740px){nav{grid-template-columns:1fr auto}.nav-links{display:none}.hero,.layout-split:not(.hero){min-height:auto;grid-template-columns:1fr}.grid,.layout-bento .grid{grid-template-columns:1fr}.layout-bento .card:first-child{grid-column:auto;grid-row:auto}.grid.logos{grid-template-columns:repeat(2,1fr)}.site-form,.site-form.newsletter{grid-template-columns:1fr}footer{grid-template-columns:1fr}footer span{text-align:left}}`
}

async function moveEmbeddedImages(project, zip) {
  const copy = structuredClone(project)
  let imageNumber = 0
  for (const page of copy.pages) {
    for (const section of page.sections) {
      const source = section.image?.src || ''
      if (!source.startsWith('data:image/')) continue
      const match = source.match(/^data:image\/([^;]+);base64,(.+)$/)
      if (!match) continue
      const extension = match[1] === 'jpeg' ? 'jpg' : match[1]
      const path = `assets/image-${++imageNumber}.${extension}`
      zip.file(path, match[2], { base64: true })
      section.image.src = path
    }
  }
  return copy
}

export async function exportWebsiteZip(project) {
  const zip = new JSZip()
  const exportProject = await moveEmbeddedImages(project, zip)
  exportProject.pages.forEach((page, index) => {
    zip.file(index === 0 ? 'index.html' : `${page.id}.html`, createPage(exportProject, page))
  })
  zip.file('styles.css', createStyles(exportProject.theme))
  zip.file('project.json', JSON.stringify(exportProject, null, 2))
  zip.file('README.txt', 'Open index.html to view this website. Upload all files and folders together when publishing.')

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${project.slug || 'website'}.zip`
  link.click()
  URL.revokeObjectURL(url)
}
