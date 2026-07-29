export const MODEL = 'qwen2.5-coder:3b'

const allowedTypes = new Set([
  'hero', 'features', 'products', 'testimonials', 'stats', 'pricing',
  'team', 'gallery', 'faq', 'content', 'contact', 'cta',
])

export function createStarterProject() {
  return {
    name: 'Your new website',
    slug: 'your-new-website',
    description: 'A locally generated website project.',
    theme: {
      primary: '#6d5dfc',
      accent: '#f4b860',
      background: '#f7f7f4',
      surface: '#ffffff',
      text: '#17171b',
      muted: '#666671',
      radius: '18px',
      font: 'modern',
    },
    navigation: { ctaLabel: 'Get started', ctaTarget: 'contact' },
    pages: [
      {
        id: 'home',
        name: 'Home',
        sections: [
          {
            id: 'hero',
            type: 'hero',
            eyebrow: 'Made on your computer',
            title: 'Turn one clear prompt into a real website.',
            text: 'Generate a complete design, then refine the words, colours and sections through conversation.',
            primaryAction: { label: 'Start a project', target: 'contact' },
            secondaryAction: { label: 'See features', target: 'features' },
          },
          {
            id: 'features',
            type: 'features',
            eyebrow: 'How it works',
            title: 'Structured, editable and entirely local',
            text: 'The AI plans the content. Reusable components keep the result reliable.',
            items: [
              { title: 'Prompt to project', text: 'Describe any business, portfolio, event or product.' },
              { title: 'Conversation editing', text: 'Request changes without touching code.' },
              { title: 'Saved locally', text: 'Your latest project stays in this browser.' },
            ],
          },
          {
            id: 'contact',
            type: 'cta',
            eyebrow: 'Ready',
            title: 'Describe what you want to build.',
            text: 'Your first generated project is one prompt away.',
            primaryAction: { label: 'Create something', target: 'hero' },
          },
        ],
      },
    ],
  }
}

const cleanString = (value, fallback = '') =>
  typeof value === 'string' ? value.slice(0, 500) : fallback

function normalizeSection(section, index) {
  const type = allowedTypes.has(section?.type) ? section.type : 'content'
  return {
    id: cleanString(section?.id, `${type}-${index + 1}`)
      .toLowerCase().replace(/[^a-z0-9-]/g, '-') || `${type}-${index + 1}`,
    type,
    eyebrow: cleanString(section?.eyebrow),
    title: cleanString(section?.title, 'Untitled section'),
    text: cleanString(section?.text),
    primaryAction: section?.primaryAction
      ? {
          label: cleanString(section.primaryAction.label, 'Learn more'),
          target: cleanString(section.primaryAction.target, 'contact'),
        }
      : undefined,
    secondaryAction: section?.secondaryAction
      ? {
          label: cleanString(section.secondaryAction.label, 'Explore'),
          target: cleanString(section.secondaryAction.target, 'features'),
        }
      : undefined,
    imageQuery: cleanString(section?.imageQuery, section?.title || ''),
    image: section?.image?.src
      ? {
          src: cleanString(section.image.src, ''),
          alt: cleanString(section.image.alt, section?.title || ''),
          credit: cleanString(section.image.credit),
          sourceUrl: cleanString(section.image.sourceUrl),
        }
      : undefined,
    items: Array.isArray(section?.items)
      ? section.items.slice(0, 8).map((item) => ({
          title: cleanString(item?.title, 'Item'),
          text: cleanString(item?.text),
          meta: cleanString(item?.meta),
          price: cleanString(item?.price),
          label: cleanString(item?.label),
        }))
      : [],
  }
}

export function normalizeProject(value) {
  const fallback = createStarterProject()
  const rawPages = Array.isArray(value?.pages) ? value.pages.slice(0, 5) : []
  const pages = rawPages.map((page, pageIndex) => ({
    id: cleanString(page?.id, `page-${pageIndex + 1}`)
      .toLowerCase().replace(/[^a-z0-9-]/g, '-') || `page-${pageIndex + 1}`,
    name: cleanString(page?.name, `Page ${pageIndex + 1}`),
    sections: (Array.isArray(page?.sections) ? page.sections : [])
      .slice(0, 12)
      .map(normalizeSection),
  })).filter((page) => page.sections.length)

  const theme = value?.theme || {}
  return {
    name: cleanString(value?.name, fallback.name),
    slug: cleanString(value?.slug, fallback.slug)
      .toLowerCase().replace(/[^a-z0-9-]/g, '-') || fallback.slug,
    description: cleanString(value?.description, fallback.description),
    theme: {
      primary: /^#[0-9a-f]{6}$/i.test(theme.primary) ? theme.primary : fallback.theme.primary,
      accent: /^#[0-9a-f]{6}$/i.test(theme.accent) ? theme.accent : fallback.theme.accent,
      background: /^#[0-9a-f]{6}$/i.test(theme.background) ? theme.background : fallback.theme.background,
      surface: /^#[0-9a-f]{6}$/i.test(theme.surface) ? theme.surface : fallback.theme.surface,
      text: /^#[0-9a-f]{6}$/i.test(theme.text) ? theme.text : fallback.theme.text,
      muted: /^#[0-9a-f]{6}$/i.test(theme.muted) ? theme.muted : fallback.theme.muted,
      radius: ['0px', '8px', '14px', '18px', '24px'].includes(theme.radius)
        ? theme.radius : fallback.theme.radius,
      font: ['modern', 'editorial', 'friendly'].includes(theme.font)
        ? theme.font : fallback.theme.font,
    },
    navigation: {
      ctaLabel: cleanString(value?.navigation?.ctaLabel, 'Get started'),
      ctaTarget: cleanString(value?.navigation?.ctaTarget, 'contact'),
    },
    pages: pages.length ? pages : fallback.pages,
  }
}

export const projectSchemaPrompt = `JSON SHAPE:
{
  "name": "Site name",
  "slug": "site-name",
  "description": "Short summary",
  "theme": {
    "primary": "#sixhex", "accent": "#sixhex", "background": "#sixhex",
    "surface": "#sixhex", "text": "#sixhex", "muted": "#sixhex",
    "radius": "0px|8px|14px|18px|24px",
    "font": "modern|editorial|friendly"
  },
  "navigation": { "ctaLabel": "Label", "ctaTarget": "section-id" },
  "pages": [{
    "id": "home", "name": "Home",
    "sections": [{
      "id": "unique-id",
      "type": "hero|features|products|testimonials|stats|pricing|team|gallery|faq|content|contact|cta",
      "eyebrow": "Optional short label",
      "title": "Heading",
      "text": "Supporting copy",
      "imageQuery": "Short, specific photo search phrase",
      "image": { "src": "Added later by the image tool", "alt": "Description", "credit": "Creator", "sourceUrl": "Source page" },
      "primaryAction": { "label": "Button", "target": "section-id-or-page-id" },
      "secondaryAction": { "label": "Button", "target": "section-id-or-page-id" },
      "items": [{ "title": "Item heading", "text": "Description", "meta": "Optional metadata", "price": "Optional price", "label": "Optional label" }]
    }]
  }]
}

RULES:
- Use 1 to 4 pages and 4 to 9 sections per page.
- Every page needs a hero or content introduction and a cta or contact ending.
- Use concise copy. Use at most 6 items per section.
- Use valid six-digit hex colours.
- IDs and targets use lowercase kebab-case.
- Set imageQuery for every hero, gallery, product, team and content section.
- Leave image undefined. Images are selected later by the image tool.
- Do not add keys outside this schema.`
