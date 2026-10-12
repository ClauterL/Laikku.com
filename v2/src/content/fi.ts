import type { Content } from './types'
import { images, links } from './images'

const year = new Date().getFullYear()

/* ============================================================
   SUOMENKIELINEN SISÄLTÖ — muokkaa tekstit täältä.
   Sama rakenne englanniksi tiedostossa en.ts.
   ============================================================ */
export const fi: Content = {
  htmlLang: 'fi',
  title: 'Claus Laikku – Rakentaja & seikkailija',
  description:
    'Claus Laikku – kehittäjä ja yrittäjä Jyväskylästä. Rakennan asioita, jotka lentävät, valaisevat ja laskevat.',
  name: 'Claus Laikku',

  nav: {
    items: [
      { label: 'Minusta', href: '#about' },
      { label: 'Projektit', href: '#projects' },
      { label: 'Koodi', href: '#code' },
      { label: 'Palvelut', href: '#services' },
      { label: 'Yhteys', href: '#contact' },
    ],
    cta: { label: 'Ota yhteyttä', href: '#contact' },
  },

  hero: {
    eyebrow: 'Hei, olen',
    firstName: 'Claus',
    lastName: 'Laikku',
    role: 'Rakentaja & seikkailija',
    pitch:
      'Rakennan asioita, jotka lentävät, valaisevat ja laskevat – ohjelmistoja, automaatiota ja laitteita Jyväskylästä käsin.',
    primary: { label: 'Ota yhteyttä', href: '#contact' },
    secondary: { label: 'Katso projektit', href: '#projects' },
    available: true,
    availability: 'Vapaana uusiin projekteihin',
    note: 'Rakenna se itse, kun kukaan muu ei tee.',
    image: { ...images.hero, alt: 'Claus Laikku viininpunaisessa paidassa ja mustassa liivissä, kädet ristissä.' },
    cutout: { ...images.cutout, alt: 'Claus Laikku viininpunaisessa paidassa ja mustassa liivissä, kädet ristissä.' },
    badges: [
      { label: 'React', icon: 'react' },
      { label: 'TypeScript', icon: 'typescript' },
      { label: 'Node.js', icon: 'nodejs' },
      { label: 'Supabase', icon: 'supabase' },
      { label: 'Claude Code', icon: 'claude' },
      { label: 'Dronet', icon: 'drone' },
    ],
  },

  now: {
    heading: 'Nyt',
    items: [
      { title: 'Havaida Oy', caption: 'Perustaja · 2026' },
      { title: 'C2 SmartLight', caption: 'Tekninen tuki & kehitys' },
      { title: 'JAMK', caption: 'ICT-opinnot · valmis 2027–28' },
      { title: 'Jyväskylä → Split', caption: 'Suunta 2027' },
    ],
  },

  pillars: [
    {
      key: 'builder',
      name: 'Builder',
      text: 'Ohjelmistoja, automaatiota ja laitteita. Jos työkalua ei ole, teen sen itse.',
      image: { ...images.builder, alt: 'Claus juottaa dronen piirilevyä työpöydän ääressä, vieressä läppäri ja koodia.' },
    },
    {
      key: 'adventure',
      name: 'Adventure',
      text: 'HEMA, sukellus, golf ja metsä. Jyväskylästä Splitiin.',
      image: { ...images.adventure, alt: 'Claus seisoo kallioharjanteella syksyisen järvimaiseman yllä.' },
    },
    {
      key: 'discipline',
      name: 'Discipline',
      text: 'Juoksu, sali ja marssi – joka päivä, myös silloin kun ei huvita.',
      image: { ...images.discipline, alt: 'Claus marssii rinkka selässä sumuisella metsätiellä aamunkoitteessa.' },
    },
  ],

  projects: {
    eyebrow: 'Portfolio',
    heading: 'Projektit',
    lead: 'Valikoituja töitä – yrityksestä omaan työpajaan.',
    items: [
      {
        tag: 'Yritys',
        title: 'Havaida Oy',
        text: 'Verkkosivut, automaatio ja AI-ratkaisut yrityksille. Oma sivusto, palvelulinjat ja tarjoustyökalut.',
        tech: ['React', 'Vite', 'Netlify'],
        image: { ...images.havaida, alt: 'havaida.com-sivuston etusivu.' },
        href: links.havaida,
        linkLabel: 'havaida.com',
      },
      {
        tag: 'Verkkosivut',
        title: 'Demosivustot',
        text: 'Yhdeksän esimerkkisivustoa eri toimialoille – kuntosalista golfkenttään ja talotekniikkaan.',
        tech: ['HTML', 'CSS', 'JavaScript'],
        image: { ...images.demot, alt: 'Havaidan demosivustojen galleria.' },
        href: links.demot,
        linkLabel: 'havaida.com/demot',
      },
      {
        tag: 'Työpaja',
        title: 'Dronet ja 3D-tulostus',
        text: 'Kotilabra, jossa ideat testataan ennen kuin niistä tulee tuotteita. Rakentelua, elektroniikkaa ja lentäviä laitteita.',
        tech: ['Dronet', '3D-tulostus', 'Elektroniikka'],
        image: { ...images.tyopaja, alt: 'Claus kokoaa hiilikuituisen dronen runkoa työpöydällä.' },
      },
    ],
  },

  dev: {
    eyebrow: 'GitHub & työpöytä',
    heading: 'Koodi',
    lead: 'Mitä GitHubissa ja työpöydällä tapahtuu.',
    activity: {
      title: 'GitHub-aktiivisuus',
      summary: '{n} julkista kontribuutiota viimeisen 12 kuukauden aikana',
      note: 'Vain julkiset kontribuutiot – JAMKin GitLab ja yksityiset repot eivät näy.',
      less: 'Vähemmän',
      more: 'Enemmän',
      link: { label: 'Profiili GitHubissa', href: links.github },
      contributions: 'kontribuutiota / 12 kk',
      streak: 'nykyinen putki',
      longest: 'pisin putki',
      repos: 'julkista repoa',
    },
    repos: {
      title: 'Julkiset repot',
      empty: 'Ei kuvausta',
      link: { label: 'Kaikki repot', href: `${links.github}?tab=repositories` },
      updated: 'päivitetty',
    },
    desk: {
      title: 'Työpöydällä nyt',
      lead: 'Suurin osa työstä tapahtuu yksityisissä repoissa. Tässä se, mikä on juuri nyt pöydällä.',
      items: [
        {
          title: 'Agenttitoimisto',
          text: 'AI-agenttien työtila, jossa osastot ja agentit hoitavat Havaidan sisäisiä rutiineja – laskutuksesta sisällöntuotantoon.',
          status: 'käytössä',
        },
        {
          title: 'Kilpailijatiedustelu',
          text: 'Paikallinen työkalu, joka seuraa kilpailijoiden mainontaa Meta Ad Librarystä ja tiivistää havainnot.',
          status: 'rakenteilla',
        },
        {
          title: 'Koulutusportaali',
          text: 'Videokurssit ja tehtävät yrityksille AI- ja automaatiokoulutukseen – oma alusta, ei kolmannen osapuolen lukkoa.',
          status: 'suunnittelussa',
        },
        {
          title: 'Voice AI -puhelinlinja',
          text: 'Puheohjattu AI-puhelinlinja, jossa soittaja keskustelee hahmon kanssa reaaliajassa. Ensimmäinen demo joulukaudelle.',
          status: 'rakenteilla',
        },
      ],
    },
    stack: {
      title: 'Tekniikat',
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
      title: 'Tutkin nyt',
      items: ['AI-agentit', 'Dronet ja autonomia', 'Koneoppiminen', 'Self-hosting', 'Voice AI'],
    },
    hood: {
      title: 'Konepellin alla',
      rows: [
        { label: 'Runko', value: 'React 19 · Vite 8 · TypeScript' },
        { label: 'Ulkoasu', value: 'Tailwind CSS 4 · shadcn/ui · Radix UI' },
        { label: 'Julkaisu', value: 'GitHub Actions → GitHub Pages' },
        { label: 'Data', value: 'GitHub-tiedot haetaan jokaisessa buildissa' },
        { label: 'Kuvat', value: 'Higgsfield · Claus-referenssihahmo' },
      ],
      updated: 'Päivitetty',
      link: { label: 'Lähdekoodi', href: links.repo },
    },
  },

  about: {
    eyebrow: 'Kuka',
    heading: 'Minusta',
    title: 'Rakennan työkaluja, joita kukaan muu ei ehtinyt tehdä.',
    paragraphs: [
      'Olen Claus Laikku, kehittäjä ja yrittäjä Jyväskylästä. Perustin Havaida Oy:n kesällä 2026, työskentelen teknisen tuen asiantuntijana ja kehittäjänä älyvalaistusyhtiö C2 SmartLightilla ja opiskelen tieto- ja viestintätekniikkaa JAMKissa.',
      'Vapaalla HEMA, sukellus, golf ja metsä. Vuonna 2027 suunta on Split.',
    ],
    quote: 'Odotin vuoden, että joku julkaisisi työkalun. Sitten tein sen viikonloppuna.',
    portrait: { ...images.portrait, alt: 'Claus Laikku työpajassaan työpöydän ääressä, taustalla drone ja 3D-tulostin.' },
    info: [
      { label: 'Nimi', value: 'Claus Laikku' },
      { label: 'Sähköposti', value: links.email, href: `mailto:${links.email}` },
      { label: 'Sijainti', value: 'Jyväskylä, Suomi' },
      { label: 'Saatavuus', value: 'Vapaana uusiin projekteihin' },
    ],
    // Muokkaa luvut omiksesi – nämä ovat lähtöarvoja.
    stats: [
      { value: '2+', label: 'vuotta älytekniikan parissa' },
      { value: '9', label: 'valmista demosivustoa' },
      { value: '4', label: 'Havaidan palvelulinjaa' },
      { value: '100 %', label: 'itse rakennettu stack' },
    ],
    // cv: { label: 'Lataa CV', href: '/cv/claus-laikku-cv.pdf' },  ← lisää PDF public/cv-kansioon ja poista kommentti
    signature: 'Claus Laikku',
  },

  skills: {
    eyebrow: 'Osaaminen',
    heading: 'Taidot ja teknologiat',
    lead: 'Mitä käytän päivittäin – ja mihin olen vasta uppoamassa.',
    bars: [
      { name: 'React & TypeScript', level: 90 },
      { name: 'Tailwind CSS & shadcn/ui', level: 90 },
      { name: 'Node.js & Supabase', level: 80 },
      { name: 'AI-agentit & automaatio (Claude Code, MCP)', level: 85 },
      { name: 'Playwright-testaus', level: 70 },
      { name: 'Python & data', level: 65 },
      { name: 'Elektroniikka, dronet & 3D-tulostus', level: 70 },
    ],
    gridTitle: 'Työkalupakki',
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
      { title: 'Web ja SaaS', items: ['React', 'TypeScript', 'Vite', 'Next.js', 'Node.js', 'Supabase'] },
      { title: 'Automaatio ja AI', items: ['Claude Code', 'MCP-palvelimet', 'Playwright', 'Agenttityönkulut', 'Voice AI'] },
      { title: 'Laitteet', items: ['Älyvalaistus', 'Dronet', '3D-tulostus', 'Elektroniikka'] },
    ],
  },

  testimonials: {
    eyebrow: 'Suositukset',
    heading: 'Mitä yhteistyöstä sanotaan',
    lead: 'Lyhyitä sanoja asiakkailta ja kollegoilta.',
    placeholder: 'Paikkamerkki – korvaa oikealla lainauksella tiedostossa src/content/fi.ts',
    items: [
      {
        quote: 'Tähän tulee asiakkaan tai kollegan lyhyt lainaus yhteistyöstä: mitä tehtiin, mikä toimi ja mitä se muutti.',
        name: 'Nimi Sukunimi',
        role: 'Rooli · Yritys',
        placeholder: true,
      },
      {
        quote: 'Toinen lainaus – esimerkiksi C2 SmartLightin kollegalta tai Havaidan asiakkaalta. Pyydä se sähköpostilla ja liitä tähän.',
        name: 'Nimi Sukunimi',
        role: 'Rooli · Yritys',
        placeholder: true,
      },
      {
        quote: 'Kolmas lainaus. Kolme riittää hyvin; karuselli toimii myös kahdella tai viidellä.',
        name: 'Nimi Sukunimi',
        role: 'Rooli · Yritys',
        placeholder: true,
      },
    ],
    prev: 'Edellinen',
    next: 'Seuraava',
  },

  services: {
    eyebrow: 'Havaida Oy',
    heading: 'Palvelut',
    lead: 'Havaida Oy:n kautta.',
    items: [
      {
        title: 'Verkkosivut',
        text: 'Tuotteistetut sivupaketit yrityksille ja luoville ammatinharjoittajille – nopea käyttöönotto, ei mallipohjan makua.',
      },
      {
        title: 'Automaatio ja AI-ratkaisut',
        text: 'Toistuvat työt pois pöydältä: integraatiot, agentit ja työnkulut, jotka toimivat oikeasti.',
      },
      {
        title: 'AI- ja datakoulutus',
        text: 'Käytännön koulutusta tiimeille: työkalut, työnkulut ja pelisäännöt.',
      },
    ],
    link: { label: 'Katso paketit ja hinnat', href: links.havaida },
  },

  cta: {
    eyebrow: 'Tehdään yhdessä',
    heading: 'Onko sinulla projekti mielessä?',
    text: 'Kerro lyhyesti, mitä olet rakentamassa – vastaan viikon sisällä.',
    button: { label: 'Ota yhteyttä', href: '#contact' },
    image: { ...images.winter, alt: 'Claus Laikku talvisella kadulla tummassa takissa ja viininpunaisessa huivissa.' },
  },

  contact: {
    eyebrow: 'Yhteydenotto',
    heading: 'Yhteys',
    lead: 'Kysymys, projekti vai pelkkä moikka? Laita viestiä.',
    email: links.email,
    location: 'Jyväskylä, Suomi',
    form: {
      name: 'Nimi',
      email: 'Sähköposti',
      message: 'Viesti',
      submit: 'Lähetä viesti',
      subject: 'Yhteydenotto laikku.comista',
      hint: 'Lomake avaa sähköpostiohjelmasi valmiiksi täytettynä – ei evästeitä, ei välikäsiä.',
    },
    image: { ...images.vest, alt: 'Claus Laikku viininpunaisessa paidassa ja mustassa liivissä.' },
  },

  links: [
    { label: 'Instagram', value: '@claus.laikku', href: links.instagram },
    { label: 'GitHub', value: 'ClauterL', href: links.github },
    { label: 'Havaida', value: 'havaida.com', href: links.havaida },
    { label: 'Sähköposti', value: links.email, href: `mailto:${links.email}` },
  ],

  footer: {
    place: 'Jyväskylä → Split 2027',
    copyright: `© ${year} Claus Laikku`,
    built: 'Rakennettu Reactilla, Tailwindilla ja shadcn/ui:lla. Ei evästeitä.',
  },

  ui: {
    langToggle: 'Kieli',
    skipToContent: 'Siirry sisältöön',
    externalLink: 'avautuu uuteen välilehteen',
    menu: 'Valikko',
    closeMenu: 'Sulje valikko',
    themeDark: 'Tumma tila',
    themeLight: 'Vaalea tila',
    months: ['tammi', 'helmi', 'maalis', 'huhti', 'touko', 'kesä', 'heinä', 'elo', 'syys', 'loka', 'marras', 'joulu'],
    weekdays: ['su', 'ma', 'ti', 'ke', 'to', 'pe', 'la'],
    contributionsOn: (n, date) =>
      n === 0 ? `Ei kontribuutioita ${date}` : n === 1 ? `1 kontribuutio ${date}` : `${n} kontribuutiota ${date}`,
  },
}
