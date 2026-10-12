import type { Content } from './types'
import { images, links } from './images'

const year = new Date().getFullYear()

/* ============================================================
   ENGLISH CONTENT — mirrors fi.ts.
   ============================================================ */
export const en: Content = {
  htmlLang: 'en',
  title: 'Claus Laikku – Builder & adventurer',
  description:
    'Claus Laikku – developer and entrepreneur from Jyväskylä, Finland. I build things that fly, light up and compute.',
  name: 'Claus Laikku',

  nav: {
    items: [
      { label: 'About', href: '#about' },
      { label: 'Projects', href: '#projects' },
      { label: 'Code', href: '#code' },
      { label: 'Services', href: '#services' },
      { label: 'Contact', href: '#contact' },
    ],
    cta: { label: 'Get in touch', href: '#contact' },
  },

  hero: {
    eyebrow: 'Hello, I’m',
    firstName: 'Claus',
    lastName: 'Laikku',
    role: 'Builder & adventurer',
    pitch: 'I build things that fly, light up and compute – software, automation and hardware, from Jyväskylä, Finland.',
    primary: { label: 'Get in touch', href: '#contact' },
    secondary: { label: 'See projects', href: '#projects' },
    available: true,
    availability: 'Open to new projects',
    note: 'Build it yourself when nobody else will.',
    image: { ...images.hero, alt: 'Claus Laikku in a burgundy shirt and black waistcoat, arms crossed.' },
    cutout: { ...images.cutout, alt: 'Claus Laikku in a burgundy shirt and black waistcoat, arms crossed.' },
    badges: [
      { label: 'React', icon: 'react' },
      { label: 'TypeScript', icon: 'typescript' },
      { label: 'Node.js', icon: 'nodejs' },
      { label: 'Supabase', icon: 'supabase' },
      { label: 'Claude Code', icon: 'claude' },
      { label: 'Drones', icon: 'drone' },
    ],
  },

  now: {
    heading: 'Now',
    items: [
      { title: 'Havaida Oy', caption: 'Founder · 2026' },
      { title: 'C2 SmartLight', caption: 'Technical support & development' },
      { title: 'JAMK', caption: 'ICT studies · graduating 2027–28' },
      { title: 'Jyväskylä → Split', caption: 'Heading there in 2027' },
    ],
  },

  pillars: [
    {
      key: 'builder',
      name: 'Builder',
      text: 'Software, automation and hardware. If the tool doesn’t exist, I make it.',
      image: { ...images.builder, alt: 'Claus soldering a drone circuit board at a workbench next to a laptop with code.' },
    },
    {
      key: 'adventure',
      name: 'Adventure',
      text: 'HEMA, diving, golf and the forest. From Jyväskylä to Split.',
      image: { ...images.adventure, alt: 'Claus standing on a rocky ridge above an autumn lake.' },
    },
    {
      key: 'discipline',
      name: 'Discipline',
      text: 'Running, the gym and ruck marches – every day, including the days I don’t feel like it.',
      image: { ...images.discipline, alt: 'Claus on a ruck march along a misty forest road at dawn.' },
    },
  ],

  projects: {
    eyebrow: 'Portfolio',
    heading: 'Projects',
    lead: 'Selected work – from the company to my own workshop.',
    items: [
      {
        tag: 'Company',
        title: 'Havaida Oy',
        text: 'Websites, automation and AI solutions for businesses. Our own site, service lines and quoting tools.',
        tech: ['React', 'Vite', 'Netlify'],
        image: { ...images.havaida, alt: 'The havaida.com front page.' },
        href: links.havaida,
        linkLabel: 'havaida.com',
      },
      {
        tag: 'Websites',
        title: 'Demo sites',
        text: 'Nine example sites for different industries – from a gym to a golf course and building services.',
        tech: ['HTML', 'CSS', 'JavaScript'],
        image: { ...images.demot, alt: 'Gallery of Havaida demo sites.' },
        href: links.demot,
        linkLabel: 'havaida.com/demot',
      },
      {
        tag: 'Workshop',
        title: 'Drones and 3D printing',
        text: 'A home lab where ideas get tested before they become products. Building, electronics and things that fly.',
        tech: ['Drones', '3D printing', 'Electronics'],
        image: { ...images.tyopaja, alt: 'Claus assembling a carbon-fibre drone frame on a workbench.' },
      },
    ],
  },

  dev: {
    eyebrow: 'GitHub & desk',
    heading: 'Code',
    lead: 'What’s happening on GitHub and on the desk.',
    activity: {
      title: 'GitHub activity',
      summary: '{n} public contributions in the last 12 months',
      note: 'Public contributions only – JAMK’s GitLab and private repos don’t show.',
      less: 'Less',
      more: 'More',
      link: { label: 'Profile on GitHub', href: links.github },
      contributions: 'contributions / 12 mo',
      streak: 'current streak',
      longest: 'longest streak',
      repos: 'public repos',
    },
    repos: {
      title: 'Public repositories',
      empty: 'No description',
      link: { label: 'All repositories', href: `${links.github}?tab=repositories` },
      updated: 'updated',
    },
    desk: {
      title: 'On the desk right now',
      lead: 'Most of the work lives in private repos. This is what’s on the bench at the moment.',
      items: [
        {
          title: 'Agent office',
          text: 'A workspace where AI agents, organised into departments, run Havaida’s internal routines – from invoicing to content.',
          status: 'in use',
        },
        {
          title: 'Competitor ad intelligence',
          text: 'A local tool that tracks competitors’ advertising in the Meta Ad Library and summarises what it finds.',
          status: 'building',
        },
        {
          title: 'Training portal',
          text: 'Video courses and assignments for companies learning AI and automation – our own platform, no third-party lock-in.',
          status: 'planning',
        },
        {
          title: 'Voice AI phone line',
          text: 'A voice-driven AI phone line where the caller talks to a character in real time. First demo for the holiday season.',
          status: 'building',
        },
      ],
    },
    stack: {
      title: 'Stack',
      items: [
        { name: 'React', icon: 'react' },
        { name: 'TypeScript', icon: 'typescript' },
        { name: 'Vite', icon: 'vite' },
        { name: 'Next.js', icon: 'nextjs' },
        { name: 'Node.js', icon: 'nodejs' },
        { name: 'Supabase', icon: 'supabase' },
        { name: 'Tailwind', icon: 'tailwind' },
        { name: 'Playwright', icon: 'playwright' },
        { name: 'Claude Code', icon: 'claude' },
        { name: 'Git', icon: 'git' },
        { name: 'Netlify', icon: 'netlify' },
        { name: 'Python', icon: 'python' },
      ],
    },
    exploring: {
      title: 'Currently exploring',
      items: ['AI agents', 'Drones and autonomy', 'Machine learning', 'Self-hosting', 'Voice AI'],
    },
    hood: {
      title: 'Under the hood',
      rows: [
        { label: 'Framework', value: 'React 19 · Vite 8 · TypeScript' },
        { label: 'UI', value: 'Tailwind CSS 4 · shadcn/ui · Radix UI' },
        { label: 'Deploy', value: 'GitHub Actions → GitHub Pages' },
        { label: 'Data', value: 'GitHub data fetched on every build' },
        { label: 'Images', value: 'Higgsfield · Claus reference character' },
      ],
      updated: 'Updated',
      link: { label: 'Source code', href: links.repo },
    },
  },

  about: {
    eyebrow: 'Who',
    heading: 'About',
    title: 'I build the tools nobody else got around to building.',
    paragraphs: [
      'I’m Claus Laikku, a developer and entrepreneur from Jyväskylä, Finland. I founded Havaida Oy in summer 2026, work as a technical support specialist and developer at the smart-lighting company C2 SmartLight, and study ICT engineering at JAMK.',
      'Off the clock: HEMA, diving, golf and the forest. In 2027 the compass points to Split, Croatia.',
    ],
    quote: 'I waited a year for someone to release the tool. Then I built it in a weekend.',
    portrait: { ...images.portrait, alt: 'Claus Laikku at his workshop bench, a drone and a 3D printer behind him.' },
    info: [
      { label: 'Name', value: 'Claus Laikku' },
      { label: 'Email', value: links.email, href: `mailto:${links.email}` },
      { label: 'Location', value: 'Jyväskylä, Finland' },
      { label: 'Availability', value: 'Open to new projects' },
    ],
    stats: [
      { value: '2+', label: 'years in smart technology' },
      { value: '9', label: 'ready-made demo sites' },
      { value: '4', label: 'Havaida service lines' },
      { value: '100 %', label: 'self-built stack' },
    ],
    signature: 'Claus Laikku',
  },

  skills: {
    eyebrow: 'Skills',
    heading: 'Skills & technologies',
    lead: 'What I use every day – and what I’m only just getting into.',
    bars: [
      { name: 'React & TypeScript', level: 90 },
      { name: 'Tailwind CSS & shadcn/ui', level: 90 },
      { name: 'Node.js & Supabase', level: 80 },
      { name: 'AI agents & automation (Claude Code, MCP)', level: 85 },
      { name: 'Playwright testing', level: 70 },
      { name: 'Python & data', level: 65 },
      { name: 'Electronics, drones & 3D printing', level: 70 },
    ],
    gridTitle: 'Toolbox',
    grid: [
      { name: 'React', icon: 'react' },
      { name: 'TypeScript', icon: 'typescript' },
      { name: 'Vite', icon: 'vite' },
      { name: 'Next.js', icon: 'nextjs' },
      { name: 'Node.js', icon: 'nodejs' },
      { name: 'Supabase', icon: 'supabase' },
      { name: 'Tailwind', icon: 'tailwind' },
      { name: 'Playwright', icon: 'playwright' },
      { name: 'Claude Code', icon: 'claude' },
      { name: 'Git', icon: 'git' },
      { name: 'Netlify', icon: 'netlify' },
      { name: 'Python', icon: 'python' },
      { name: 'Docker', icon: 'docker' },
      { name: 'Arduino', icon: 'arduino' },
      { name: 'Raspberry Pi', icon: 'raspberrypi' },
      { name: 'Blender', icon: 'blender' },
    ],
    groups: [
      { title: 'Web & SaaS', items: ['React', 'TypeScript', 'Vite', 'Next.js', 'Node.js', 'Supabase'] },
      { title: 'Automation & AI', items: ['Claude Code', 'MCP servers', 'Playwright', 'Agent workflows', 'Voice AI'] },
      { title: 'Hardware', items: ['Smart lighting', 'Drones', '3D printing', 'Electronics'] },
    ],
  },

  testimonials: {
    eyebrow: 'Testimonials',
    heading: 'What people say',
    lead: 'A few words from clients and colleagues.',
    placeholder: 'Placeholder – replace with a real quote in src/content/en.ts',
    items: [
      {
        quote: 'A short quote from a client or colleague goes here: what we did, what worked and what it changed.',
        name: 'First Last',
        role: 'Role · Company',
        placeholder: true,
      },
      {
        quote: 'A second quote – from a colleague at C2 SmartLight or a Havaida client, for example. Ask by email and paste it here.',
        name: 'First Last',
        role: 'Role · Company',
        placeholder: true,
      },
      {
        quote: 'A third quote. Three is plenty; the carousel also works with two or five.',
        name: 'First Last',
        role: 'Role · Company',
        placeholder: true,
      },
    ],
    prev: 'Previous',
    next: 'Next',
  },

  services: {
    eyebrow: 'Havaida Oy',
    heading: 'Services',
    lead: 'Through Havaida Oy.',
    items: [
      {
        title: 'Websites',
        text: 'Productised site packages for businesses and creative professionals – fast to launch, none of the template flavour.',
      },
      {
        title: 'Automation & AI solutions',
        text: 'Repetitive work off your desk: integrations, agents and workflows that actually run.',
      },
      {
        title: 'AI & data training',
        text: 'Hands-on training for teams: tools, workflows and ground rules.',
      },
    ],
    link: { label: 'See packages and pricing', href: links.havaida },
  },

  cta: {
    eyebrow: 'Let’s work together',
    heading: 'Have a project in mind?',
    text: 'Tell me briefly what you’re building – I reply within a week.',
    button: { label: 'Get in touch', href: '#contact' },
    image: { ...images.winter, alt: 'Claus Laikku on a snowy street in a dark coat and burgundy scarf.' },
  },

  contact: {
    eyebrow: 'Say hello',
    heading: 'Contact',
    lead: 'A question, a project or just a hello? Send a message.',
    email: links.email,
    location: 'Jyväskylä, Finland',
    form: {
      name: 'Name',
      email: 'Email',
      message: 'Message',
      submit: 'Send message',
      subject: 'Hello from laikku.com',
      hint: 'The form opens your email app with the message pre-filled – no cookies, no middlemen.',
    },
    image: { ...images.vest, alt: 'Claus Laikku in a burgundy shirt and black waistcoat.' },
  },

  links: [
    { label: 'Instagram', value: '@claus.laikku', href: links.instagram },
    { label: 'GitHub', value: 'ClauterL', href: links.github },
    { label: 'Havaida', value: 'havaida.com', href: links.havaida },
    { label: 'Email', value: links.email, href: `mailto:${links.email}` },
  ],

  footer: {
    place: 'Jyväskylä → Split 2027',
    copyright: `© ${year} Claus Laikku`,
    built: 'Built with React, Tailwind and shadcn/ui. No cookies.',
  },

  ui: {
    langToggle: 'Language',
    skipToContent: 'Skip to content',
    externalLink: 'opens in a new tab',
    menu: 'Menu',
    closeMenu: 'Close menu',
    themeDark: 'Dark mode',
    themeLight: 'Light mode',
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    contributionsOn: (n, date) =>
      n === 0 ? `No contributions on ${date}` : n === 1 ? `1 contribution on ${date}` : `${n} contributions on ${date}`,
  },
}
