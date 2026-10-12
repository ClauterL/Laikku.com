import type { Content } from './types'
import { goods, icons, images, links } from './images'

const year = new Date().getFullYear()

/* ============================================================
   SUOMENKIELINEN SISÄLTÖ – pelivalikko. Muokkaa tekstit täältä.
   Sama rakenne englanniksi tiedostossa en.ts.
   ============================================================ */
export const fi: Content = {
  htmlLang: 'fi',
  title: 'Claus Laikku – Rakentaja & seikkailija',
  description:
    'Claus Laikku – kehittäjä ja yrittäjä Jyväskylästä. Portfolio pelivalikon muodossa: varusteet, projektit, kartta ja tehtävät.',
  name: 'Claus Laikku',
  role: 'Rakentaja & seikkailija',

  start: {
    eyebrow: 'Portfolio · Jyväskylä',
    press: 'Paina mitä tahansa aloittaaksesi',
    hint: 'Sivulla on ääniefektejä – mykistä M-näppäimellä.',
    loading: 'Ladataan profiilia',
  },

  nav: {
    menu: 'Valikko',
    tabs: [
      { id: 'skills', label: 'Taidot' },
      { id: 'inventory', label: 'Projektit' },
      { id: 'items', label: 'Tavarat' },
      { id: 'map', label: 'Kartta' },
      { id: 'quests', label: 'Tehtävät' },
      { id: 'order', label: 'Havaida' },
      { id: 'codex', label: 'Koodeksi' },
    ],
    contact: 'Yhteys',
    sound: 'Ääni päällä',
    soundOff: 'Ääni pois',
  },

  hud: {
    level: { value: '25', label: 'Taso', caption: 'Rakentaja' },
    slots: [
      { id: 'study', name: 'Opinnot', icon: icons.study, meter: 4, caption: 'JAMK · ICT-insinööri' },
      { id: 'adventure', name: 'Seikkailu', icon: icons.adventure, meter: 3, caption: 'Seuraava etappi: Split' },
    ],
    bag: {
      title: 'Reppu',
      rows: [
        { key: 'commits', label: 'kontribuutiota / 12 kk' },
        { key: 'repos', label: 'julkista repoa' },
        { key: 'sites', label: 'demosivustoa', value: '9' },
        { key: 'tech', label: 'teknologiaa', value: '16' },
      ],
    },
  },

  inventory: {
    title: 'Projektit',
    gearTitle: 'Varusteet',
    itemsTitle: 'Projektit',
    langTitle: 'Kielet & työkalut',
    rarity: { common: 'Tavallinen', rare: 'Harvinainen', epic: 'Eeppinen', legendary: 'Legendaarinen' },
    levelLabel: 'Taso',
    statusLabel: 'Tila',
    techLabel: 'Tekniikat',
    linksLabel: 'Linkit',
    equipped: 'Käytössä',
    gear: [
      {
        id: 'code',
        kind: 'gear',
        name: 'Koodi',
        tag: 'Web & SaaS',
        icon: icons.code,
        rarity: 'legendary',
        level: 90,
        desc: 'Pääase. React- ja TypeScript-sovellukset, SaaS-tuotteet ja verkkosivut – suunnittelusta julkaisuun.',
        tech: ['React', 'TypeScript', 'Vite', 'Next.js', 'Node.js', 'Supabase', 'Tailwind'],
      },
      {
        id: 'ai',
        kind: 'gear',
        name: 'Automaatio & AI',
        tag: 'Agentit & työnkulut',
        icon: icons.ai,
        rarity: 'epic',
        level: 85,
        desc: 'Toistuvat työt pois pöydältä: AI-agentit, MCP-palvelimet, integraatiot ja testiautomaatio, jotka toimivat oikeasti.',
        tech: ['Claude Code', 'MCP-palvelimet', 'Playwright', 'Python', 'Docker'],
      },
      {
        id: 'electronics',
        kind: 'gear',
        name: 'Elektroniikka',
        tag: 'Laitteet',
        icon: icons.electronics,
        rarity: 'rare',
        level: 70,
        desc: 'Älyvalaistus, piirilevyt, mikrokontrollerit ja 3D-tulostetut kotelot. Kotilabra, jossa ideat testataan ennen kuin niistä tulee tuotteita.',
        tech: ['Älyvalaistus', 'Arduino', 'Raspberry Pi', '3D-tulostus'],
      },
      {
        id: 'drones',
        kind: 'gear',
        name: 'Dronet',
        tag: 'Lentävät laitteet',
        icon: icons.drone,
        rarity: 'rare',
        level: 70,
        desc: 'Rakentelua, lentodataa ja autonomiaa. Tavoitteena lentodata-SaaS ja fleet-hallinta kartalla.',
        tech: ['Rakentelu', 'Autonomia', 'Lentodata'],
      },
    ],
    items: [
      {
        id: 'waretrack',
        kind: 'item',
        name: 'WareTrack',
        tag: 'Varastonhallinta',
        icon: icons.waretrack,
        rarity: 'epic',
        status: 'rakenteilla',
        desc: 'Varastonhallintaohjelma 3D-näkymällä: hyllyt, lavat ja saldot yhdessä näkymässä, laajennettuna kokonaiseksi WMS:ksi.',
        tech: ['React', 'Three.js', 'Supabase'],
      },
      {
        id: 'kerros',
        kind: 'item',
        name: 'Kerros',
        tag: 'Taloyhtiö-dashboard',
        icon: icons.kerros,
        rarity: 'epic',
        status: 'rakenteilla',
        desc: 'Taloyhtiön hallinnan työpöytä, jossa talo piirretään 3D-kerrostalona avoimesta karttadatasta.',
        tech: ['React', 'Three.js', 'OpenStreetMap'],
      },
      {
        id: 'nfc',
        kind: 'item',
        name: 'NFC-sovellukset',
        tag: 'CardTap & DoorTap',
        icon: icons.nfc,
        rarity: 'rare',
        status: 'rakenteilla',
        desc: 'CardTap jakaa käyntikortin puhelimesta puhelimeen. DoorTap vie talon kulkuavaimen puhelimeen omalla ESP32-lukijalla.',
        tech: ['NFC', 'React', 'ESP32'],
      },
      {
        id: 'games',
        kind: 'item',
        name: 'Havaida Games',
        tag: 'Kuusi selainpeliä',
        icon: icons.games,
        rarity: 'rare',
        status: 'julkaistu',
        desc: 'Ticket Slash, Network Connect, Access Crossing, Signal Command, Bug Breaker ja Uptime Keeper – yritysteemaisia minipelejä, jotka tehtiin portfolioksi.',
        tech: ['React', 'Canvas', 'Vite'],
        links: [{ label: 'GitHub', href: links.games }],
      },
    ],
    languages: [
      { id: 'react', kind: 'lang', name: 'React', tag: 'Käyttöliittymät', icon: icons.react, logo: 'react', rarity: 'legendary', level: 90, desc: 'Komponentit, hookit ja suorituskyky – pääkirjasto kaikissa sovelluksissa.' },
      { id: 'typescript', kind: 'lang', name: 'TypeScript', tag: 'Tyypitetty koodi', icon: icons.typescript, logo: 'typescript', rarity: 'epic', level: 85, desc: 'Tyypitetty sovelluskoodi ja sisältömallit, joihin voi luottaa.' },
      { id: 'node', kind: 'lang', name: 'Node.js', tag: 'Palvelin & skriptit', icon: icons.node, logo: 'nodejs', rarity: 'epic', level: 80, desc: 'API:t, build-työkalut ja automaatioskriptit.' },
      { id: 'supabase', kind: 'lang', name: 'Supabase', tag: 'Tietokanta & auth', icon: icons.supabase, logo: 'supabase', rarity: 'rare', level: 75, desc: 'Postgres, kirjautuminen ja realtime SaaS-projekteissa.' },
      { id: 'tailwind', kind: 'lang', name: 'Tailwind', tag: 'Ulkoasu', icon: icons.tailwind, logo: 'tailwind', rarity: 'epic', level: 90, desc: 'Tailwind v4 + shadcn/ui – nopea, yhtenäinen ulkoasu.' },
      { id: 'python', kind: 'lang', name: 'Python', tag: 'Data & prototyypit', icon: icons.python, logo: 'python', rarity: 'rare', level: 65, desc: 'Datankäsittely, skriptit ja nopeat kokeilut.' },
    ],
  },

  goods: {
    title: 'Tavarat',
    lead: 'Mitä repusta löytyy: työaseman osat, laitteet ja työkalut sekä palvelut, joilla hommat tehdään. Vie hiiri ruudun päälle – Enter avaa tiedot.',
    countLabel: 'Määrä',
    specLabel: 'Tiedot',
    hint: 'Nuolet liikuttavat ruudukossa, Tab vaihtaa ryhmää.',
    xp: { label: 'Kokemus', value: 6184, max: 7900 },
    resources: [
      { id: 'repos', label: 'Repoa', icon: goods.github, key: 'repos' },
      { id: 'commits', label: 'Kontribuutiota', icon: goods.claudecode, key: 'commits' },
      { id: 'models', label: 'AI-mallia', icon: goods.ollama, value: '38' },
      { id: 'domains', label: 'Domainia', icon: goods.netlify, value: '4' },
      { id: 'agents', label: 'Agenttia', icon: goods.n8n, value: '35' },
      { id: 'storage', label: 'Tallennustilaa', icon: goods.pool, value: '6 TB' },
    ],
    groups: [
      {
        id: 'pc',
        title: 'Työaseman osat',
        items: [
          {
            id: 'cpu', kind: 'good', name: 'Prosessori', tag: 'Intel Core i7-12700K', icon: goods.cpu, rarity: 'legendary',
            desc: 'Työaseman sydän: 12 ydintä ja 20 säiettä. Kääntää, buildaa ja pyörittää paikallisia AI-malleja samaan aikaan.',
            spec: [
              { label: 'Ytimet', value: '8 P + 4 E · 20 säiettä' },
              { label: 'Kanta', value: 'LGA1700' },
            ],
          },
          {
            id: 'ram', kind: 'good', name: 'Keskusmuisti', tag: '96 GB', icon: goods.ram, rarity: 'epic', count: '96 GB',
            desc: 'Riittää virtuaalikoneille, Docker-pinoille ja isoille kielimalleille yhtä aikaa – muistin loppuminen ei ole enää tekosyy.',
            spec: [{ label: 'Käyttö', value: 'WSL2 · Docker · Ollama' }],
          },
          {
            id: 'gpu', kind: 'good', name: 'Näytönohjain', tag: 'NVIDIA RTX 3060', icon: goods.gpu, rarity: 'epic', count: '12 GB',
            desc: 'Paikallinen AI-kiihdytin: Ollama-mallit, Blender-renderit ja satunnainen pelihetki.',
            spec: [
              { label: 'Muisti', value: '12 GB GDDR6' },
              { label: 'Tehtävät', value: 'Ollama · Blender · CUDA' },
            ],
          },
          {
            id: 'nvme', kind: 'good', name: 'NVMe-levy', tag: 'Samsung 980', icon: goods.nvme, rarity: 'rare', count: '1 TB',
            desc: 'Järjestelmälevy. Windows, työkalut ja se, minkä pitää aueta heti.',
            spec: [{ label: 'Liitäntä', value: 'M.2 NVMe' }],
          },
          {
            id: 'ssd', kind: 'good', name: 'SATA-SSD', tag: 'WD Blue SA510', icon: goods.ssd, rarity: 'common', count: '1 TB',
            desc: 'Toinen SSD: Steam-kirjasto, WSL-Ubuntu ja Docker-data.',
            spec: [{ label: 'Liitäntä', value: 'SATA 2.5"' }],
          },
          {
            id: 'pool', kind: 'good', name: 'Storage Space', tag: 'H:-asema', icon: goods.pool, rarity: 'rare', count: '2 TB',
            desc: 'Havaidan, projektien ja simulaatioiden kotiasema. Repot, mallit, Blender-kohtaukset ja virtuaalikoneet.',
            spec: [
              { label: 'Tyyppi', value: 'Thin-provisioned NTFS' },
              { label: 'Sisältö', value: 'Havaida · dev · sim · ollama · vm' },
            ],
          },
          {
            id: 'mobo', kind: 'good', name: 'Emolevy', tag: 'LGA1700 ATX', icon: goods.mobo, rarity: 'rare',
            desc: 'Kaiken alusta. Neljä muistipaikkaa täynnä ja M.2-paikat käytössä.',
          },
          {
            id: 'monitor', kind: 'good', name: 'Näytöt', tag: 'Työpöytä', icon: goods.monitor, rarity: 'common',
            desc: 'Useampi näyttö – yksi koodille, yksi agenttien seuraamiseen, ja etänä tabletilta koko työpöytä RustDeskillä.',
          },
        ],
      },
      {
        id: 'gear',
        title: 'Laitteet & työkalut',
        items: [
          {
            id: 'excavator', kind: 'good', name: 'Kaivinkone', tag: 'Etäohjaushanke', icon: goods.excavator, rarity: 'legendary',
            desc: 'Vanha oma työkone, joka saa uuden elämän: etäohjaus kotoa joystickeillä ja myöhemmin autonomiaa.',
            spec: [{ label: 'Tila', value: 'prototyyppivaihe' }],
          },
          {
            id: 'drone', kind: 'good', name: 'Drone', tag: 'Lentodata', icon: goods.drone, rarity: 'epic',
            desc: 'Rakentelu- ja datalaite. Pohja Havaidan drone-linjalle: lentodata-SaaS ja fleet-hallinta kartalla.',
          },
          {
            id: 'robot', kind: 'good', name: 'Telarobotti', tag: 'Kauko-ohjattava', icon: goods.robot, rarity: 'epic',
            desc: 'Tela-alustainen robotti, jota muunnetaan marjanpoimintaan ja talvella lumitöihin.',
          },
          {
            id: 'boat', kind: 'good', name: 'Aurinkovene', tag: 'USV · suunnitteilla', icon: goods.boat, rarity: 'rare',
            desc: 'Autonominen aurinkovene, jonka on tarkoitus seilata Suomen satamasta Houstoniin. Vielä piirustuspöydällä.',
            spec: [{ label: 'Tila', value: 'suunnitteilla' }],
          },
          {
            id: 'streamdeck', kind: 'good', name: 'Stream Deck', tag: 'Ohjauspaneeli', icon: goods.streamdeck, rarity: 'rare', count: '15',
            desc: 'Työaseman ohjauspaneeli tabletilla: skriptit, agentit ja valot yhden napin takana.',
          },
          {
            id: 'tablet', kind: 'good', name: 'Tabletti', tag: 'Android · etäkäyttö', icon: goods.tablet, rarity: 'rare',
            desc: 'Toinen näyttö ja kaukosäädin: Tailscalen yli Moonlightilla tai RustDeskillä kiinni työasemaan.',
          },
          {
            id: 'esp32', kind: 'good', name: 'ESP32', tag: 'Mikrokontrolleri', icon: goods.esp32, rarity: 'common', count: '×3',
            desc: 'DoorTapin oma lukija ja muiden kotilabran kokeilujen aivot. Wi-Fi ja Bluetooth samassa sirussa.',
          },
          {
            id: 'nfctags', kind: 'good', name: 'NFC-tagit', tag: 'CardTap & DoorTap', icon: goods.nfctags, rarity: 'common', count: '×12',
            desc: 'Kortteja ja tarroja testaamiseen: käyntikortti puhelimesta puhelimeen ja kulkuavain oveen.',
          },
          {
            id: 'solder', kind: 'good', name: 'Juotin', tag: 'Kotilabra', icon: goods.solder, rarity: 'common',
            desc: 'Piirilevyt ja korjaukset. Kotilabrassa ideat juotetaan kiinni ennen kuin niistä tulee tuotteita.',
          },
          {
            id: 'meter', kind: 'good', name: 'Yleismittari', tag: 'Kotilabra', icon: goods.meter, rarity: 'common',
            desc: 'Ensimmäinen työkalu, kun jokin ei toimi. Jännite, virta, jatkuvuus.',
          },
          {
            id: 'keyboard', kind: 'good', name: 'Näppäimistö', tag: 'Mekaaninen', icon: goods.keyboard, rarity: 'common',
            desc: 'Pääase lähitaistelussa koodin kanssa.',
          },
          {
            id: 'mouse', kind: 'good', name: 'Hiiri', tag: 'Langaton', icon: goods.mouse, rarity: 'common',
            desc: 'Tarkkuusase 3D-näkymiin ja Blenderiin.',
          },
          {
            id: 'headset', kind: 'good', name: 'Kuulokkeet', tag: 'Mikrofonilla', icon: goods.headset, rarity: 'common',
            desc: 'Palaverit, asiakaspuhelut ja keskittymismusiikki.',
          },
        ],
      },
      {
        id: 'services',
        title: 'Palvelut & ohjelmistot',
        items: [
          {
            id: 'claude', kind: 'good', name: 'Claude Max', tag: 'AI-kumppani', icon: goods.claude, rarity: 'legendary',
            desc: 'Agentit, koodi ja suunnittelu. Havaidan ja opintojen tärkein yksittäinen työkalu.',
          },
          {
            id: 'claudecode', kind: 'good', name: 'Claude Code', tag: 'Agenttikoodaus', icon: goods.claudecode, rarity: 'epic',
            desc: 'Terminaalissa elävä kehittäjäagentti: repot, testit ja julkaisut ilman käsityötä.',
          },
          {
            id: 'ollama', kind: 'good', name: 'Ollama', tag: 'Paikalliset mallit', icon: goods.ollama, rarity: 'epic', count: '38',
            desc: 'Omalla raudalla pyörivät kielimallit. 38 mallia testattu, noin 650 GB malleja H:-asemalla.',
            spec: [{ label: 'Mallit', value: '~650 GB' }],
          },
          {
            id: 'higgsfield', kind: 'good', name: 'Higgsfield', tag: 'Kuvat & video', icon: goods.higgsfield, rarity: 'epic',
            desc: 'Tämän sivun hahmo, esineet ja tunnuksen intro on tehty täällä omalla referenssihahmolla.',
          },
          {
            id: 'supabase', kind: 'good', name: 'Supabase', tag: 'Tietokanta', icon: goods.supabase, rarity: 'rare',
            desc: 'Postgres, auth ja realtime SaaS-projekteissa – pilvessä ja itse ajettuna Dockerissa.',
          },
          {
            id: 'netlify', kind: 'good', name: 'Netlify', tag: 'Julkaisu', icon: goods.netlify, rarity: 'rare', count: '4',
            desc: 'Henkilöbrändin neljä domainia GitHub-repoista suoraan verkkoon.',
            spec: [{ label: 'Domainit', value: 'laikku.com · clausl.com · laikku.dev · clauster.dev' }],
          },
          {
            id: 'n8n', kind: 'good', name: 'n8n', tag: 'Automaatio', icon: goods.n8n, rarity: 'rare',
            desc: 'Työnkulut, jotka yhdistävät palvelut toisiinsa – paikallisesti omalla koneella.',
          },
          {
            id: 'blender', kind: 'good', name: 'Blender', tag: '3D', icon: goods.blender, rarity: 'rare',
            desc: '3D-mallit, visualisoinnit ja MCP-ohjattu mallinnus.',
          },
          {
            id: 'vast', kind: 'good', name: 'Vast.ai', tag: 'Laskentateho', icon: goods.vast, rarity: 'rare',
            desc: 'Vuokrattua GPU-tehoa, kun oma 3060 ei riitä.',
          },
          {
            id: 'github', kind: 'good', name: 'GitHub', tag: 'Repot', icon: goods.github, rarity: 'common',
            desc: 'Kaikki koodi versionhallinnassa. Julkiset repot näkyvät Koodeksissa.',
            links: [{ label: 'github.com/ClauterL', href: links.github }],
          },
          {
            id: 'docker', kind: 'good', name: 'Docker', tag: 'Kontit', icon: goods.docker, rarity: 'common',
            desc: 'Supabase-pinot, n8n ja muut palvelut siististi omissa konteissaan.',
          },
          {
            id: 'tailscale', kind: 'good', name: 'Tailscale', tag: 'Verkko', icon: goods.tailscale, rarity: 'common',
            desc: 'Oma mesh-VPN: työasema, tabletti ja palvelimet samassa verkossa missä tahansa.',
          },
          {
            id: 'oskeys', kind: 'good', name: 'Käyttöjärjestelmät', tag: 'Windows 11 + Ubuntu', icon: goods.oskeys, rarity: 'common', count: '×2',
            desc: 'Dual boot: Windows töihin ja peleihin, natiivi Ubuntu ja WSL2 kehitykseen.',
          },
          {
            id: 'obsidian', kind: 'good', name: 'Obsidian', tag: 'Muistiinpanot', icon: goods.obsidian, rarity: 'common',
            desc: 'Vault H:-asemalla: ideat, päätökset ja opintomuistiinpanot linkitettynä.',
          },
        ],
      },
    ],
  },

  skills: {
    title: 'Taidot',
    lead: 'Avatut taidot kolmessa haarassa. Prosentti kertoo, kuinka kotonaan olen työkalun kanssa.',
    unlocked: 'avattu',
    mastery: 'hallinta',
    branches: [
      {
        title: 'Web & SaaS',
        nodes: [
          { name: 'React', icon: 'react', level: 90, desc: 'Komponentit, hookit, suorituskyky.' },
          { name: 'TypeScript', icon: 'typescript', level: 85, desc: 'Tyypitetty sovelluskoodi ja sisältömallit.' },
          { name: 'Tailwind', icon: 'tailwind', level: 90, desc: 'Tailwind v4 + shadcn/ui.' },
          { name: 'Node.js', icon: 'nodejs', level: 80, desc: 'API:t, skriptit ja build-työkalut.' },
          { name: 'Supabase', icon: 'supabase', level: 75, desc: 'Postgres, auth ja realtime.' },
          { name: 'Next.js', icon: 'nextjs', level: 70, desc: 'Palvelinrenderöinti ja reititys.' },
        ],
      },
      {
        title: 'Automaatio & AI',
        nodes: [
          { name: 'Claude Code', icon: 'claude', level: 90, desc: 'Agenttipohjainen kehitys ja työnkulut.' },
          { name: 'MCP-palvelimet', icon: 'ai', level: 80, desc: 'Työkalut ja integraatiot agenteille.' },
          { name: 'Playwright', icon: 'playwright', level: 70, desc: 'Selaintestaus ja automaatio.' },
          { name: 'Python', icon: 'python', level: 65, desc: 'Data, skriptit ja prototyypit.' },
          { name: 'Docker', icon: 'docker', level: 55, desc: 'Self-hosting ja ympäristöt.' },
        ],
      },
      {
        title: 'Laitteet',
        nodes: [
          { name: 'Älyvalaistus', icon: 'lighting', level: 75, desc: 'Valaistuksen ohjausjärjestelmät.' },
          { name: 'Dronet', icon: 'drone', level: 70, desc: 'Rakentelu ja lentodata.' },
          { name: '3D-tulostus', icon: 'printer', level: 70, desc: 'Kotelot, osat, prototyypit.' },
          { name: 'Arduino', icon: 'arduino', level: 65, desc: 'Mikrokontrollerit ja anturit.' },
          { name: 'Raspberry Pi', icon: 'raspberrypi', level: 65, desc: 'Pienet palvelimet ja ohjaimet.' },
          { name: 'Blender', icon: 'blender', level: 50, desc: '3D-mallit webiin.' },
        ],
      },
    ],
  },

  map: {
    title: 'Kartta',
    lead: 'Oikea maailmankartta: tukikohta, matkasuunnitelma ja kaukainen tavoite. Rullaa zoomataksesi, raahaa siirtääksesi.',
    fastTravel: 'Pikamatkustus',
    offmapHint: 'Tutkimaton',
    legend: { home: 'Tukikohta', travel: 'Matka', quest: 'Tehtävä', offmap: 'Kaukana' },
    regions: [
      { name: 'Suomi', lat: 64.5, lon: 26.5, size: 'md' },
      { name: 'Itämeri', lat: 58.3, lon: 20.0, size: 'sm' },
      { name: 'Adrianmeri', lat: 42.6, lon: 15.6, size: 'sm' },
      { name: 'Välimeri', lat: 36.0, lon: 14.0, size: 'md' },
      { name: 'Atlantin valtameri', lat: 40.0, lon: -40.0, size: 'lg' },
      { name: 'Pohjois-Amerikka', lat: 45.0, lon: -100.0, size: 'lg' },
      { name: 'Eurooppa', lat: 50.0, lon: 12.0, size: 'lg' },
      { name: 'Afrikka', lat: 12.0, lon: 18.0, size: 'lg' },
      { name: 'Meksikonlahti', lat: 25.5, lon: -90.0, size: 'sm' },
    ],
    routes: [
      { id: 'move', label: 'Jyväskylä → Split 2027', kind: 'travel', points: [[25.75, 62.24], [16.44, 43.51]] },
      {
        id: 'boat',
        label: 'Robottiveneen reitti · idea',
        kind: 'plan',
        points: [[25.0, 60.1], [10.5, 57.8], [-5.0, 48.5], [-30.0, 38.0], [-60.0, 26.0], [-80.0, 24.5], [-95.37, 29.76]],
      },
    ],
    ui: { zoomIn: 'Lähennä', zoomOut: 'Loitonna', reset: 'Koko kartta', fog: 'Tutkimaton alue', explored: 'Tutkittu', coords: 'Sijainti' },
    markers: [
      {
        id: 'jkl',
        name: 'Jyväskylä',
        caption: 'Tukikohta · Suomi',
        lat: 62.24,
        lon: 25.75,
        kind: 'home',
        desc: 'Koti, työpaja, JAMK ja Havaida Oy. Täältä käsin rakennetaan.',
      },
      {
        id: 'split',
        name: 'Split',
        caption: 'Suunta 2027 · Kroatia',
        lat: 43.51,
        lon: 16.44,
        kind: 'travel',
        desc: 'Seuraava tukikohta Adrianmeren rannalla.',
      },
      {
        id: 'houston',
        name: 'Houston',
        caption: 'Robottivene · idea',
        lat: 29.76,
        lon: -95.37,
        kind: 'offmap',
        desc: 'Autonominen aurinkovene Suomen satamasta Houstoniin – legendaarinen sivutehtävä.',
      },
    ],
  },

  quests: {
    title: 'Tehtävät',
    lead: 'Päätehtävä ja sivutehtävät. Eteneminen päivittyy, kun asiat valmistuvat.',
    mainTitle: 'Päätehtävä',
    sideTitle: 'Sivutehtävät',
    objectives: 'Tavoitteet',
    reward: 'Palkinto',
    progress: 'Eteneminen',
    status: { active: 'Käynnissä', done: 'Valmis', planned: 'Suunniteltu', idea: 'Idea' },
    main: {
      id: 'havaida',
      type: 'main',
      title: 'Rakenna Havaida Oy',
      giver: 'Oma päätös · kesä 2026',
      status: 'active',
      progress: 45,
      desc: 'Verkkosivut, automaatio ja AI-ratkaisut yrityksille – oma yhtiö, omat työkalut.',
      objectives: [
        { text: 'Perusta yhtiö (1.7.2026)', done: true },
        { text: 'Julkaise havaida.com ja demosivustot', done: true },
        { text: 'Määritä palvelulinjat', done: true },
        { text: 'Ota agenttitoimisto sisäiseen käyttöön', done: true },
        { text: 'Ensimmäiset asiakasprojektit', done: false },
        { text: 'Koulutusportaali asiakkaille', done: false },
      ],
      reward: 'Vapaus valita projektit',
      links: [{ label: 'havaida.com', href: links.havaida }],
    },
    side: [
      {
        id: 'laikku',
        type: 'side',
        title: 'Laikku.com',
        status: 'done',
        progress: 100,
        desc: 'Portfolio pelivalikon muodossa – juuri tämä sivu.',
        objectives: [
          { text: 'Perinteinen portfolio (v2)', done: true },
          { text: 'Pelivalikko-UI äänillä', done: true },
        ],
        links: [{ label: 'Lähdekoodi', href: links.repo }],
      },
      {
        id: 'agents',
        type: 'side',
        title: 'Agenttitoimisto',
        status: 'active',
        progress: 70,
        desc: 'AI-agenttien työtila, jossa osastot hoitavat Havaidan rutiineja laskutuksesta sisällöntuotantoon.',
        objectives: [
          { text: 'Osastot ja agentit', done: true },
          { text: 'Kirjanpito- ja tietokantaintegraatiot', done: false },
        ],
      },
      {
        id: 'adscout',
        type: 'side',
        title: 'Kilpailijatiedustelu',
        status: 'active',
        progress: 40,
        desc: 'Paikallinen työkalu, joka seuraa kilpailijoiden mainontaa ja tiivistää havainnot.',
        objectives: [
          { text: 'Mainoskirjaston haku', done: true },
          { text: 'Yhteenvedot ja hälytykset', done: false },
        ],
      },
      {
        id: 'voice',
        type: 'side',
        title: 'Voice AI -puhelinlinja',
        status: 'active',
        progress: 30,
        desc: 'Puheohjattu AI-linja, jossa soittaja keskustelee hahmon kanssa reaaliajassa. Ensimmäinen demo joulukaudelle.',
        objectives: [
          { text: 'Puhemalli ja hahmo', done: false },
          { text: 'Puhelinnumero ja demo', done: false },
        ],
      },
      {
        id: 'jamk',
        type: 'side',
        title: 'Insinööritutkinto (JAMK)',
        status: 'active',
        progress: 60,
        desc: 'Tieto- ja viestintätekniikka. Valmistuminen 2027–28.',
        objectives: [
          { text: 'Ohjelmistosuunnittelu ja testaus', done: true },
          { text: 'Työelämäprojekti', done: false },
          { text: 'Opinnäytetyö', done: false },
        ],
      },
      {
        id: 'split',
        type: 'side',
        title: 'Muutto Splitiin',
        status: 'planned',
        progress: 15,
        desc: 'Uusi tukikohta Kroatiassa vuonna 2027.',
        objectives: [
          { text: 'Maa ja yritysrakenne valittu', done: true },
          { text: 'Asunto ja työpaja', done: false },
        ],
      },
      {
        id: 'boat',
        type: 'side',
        title: 'Robottivene Houstoniin',
        status: 'idea',
        progress: 5,
        desc: 'Autonominen aurinkovene Suomen satamasta Atlantin yli Houstoniin.',
        objectives: [
          { text: 'Konsepti ja reitti', done: true },
          { text: 'Prototyyppi järvellä', done: false },
        ],
        reward: 'Legendaarinen tarina',
      },
    ],
  },

  order: {
    title: 'Havaida',
    lead: 'Kilta, jonka kautta työt tehdään.',
    name: 'Havaida Oy',
    tagline: 'Intelligent technology. Real impact.',
    founded: 'Perustettu 2026 · Jyväskylä',
    desc: 'Havaida rakentaa älykkäitä työkaluja ihmisille ja yrityksille – verkosta pellolle. Verkkosivut, automaatio ja koulutus yhden tekijän vastuulla, ilman mallipohjan makua.',
    services: [
      {
        title: 'Verkkosivut',
        text: 'Tuotteistetut sivupaketit yrityksille ja luoville ammatinharjoittajille – nopea käyttöönotto.',
      },
      {
        title: 'Automaatio ja AI-ratkaisut',
        text: 'Integraatiot, agentit ja työnkulut, jotka toimivat oikeasti.',
      },
      {
        title: 'AI- ja datakoulutus',
        text: 'Käytännön koulutusta tiimeille: työkalut, työnkulut ja pelisäännöt.',
      },
    ],
    link: { label: 'havaida.com', href: links.havaida },
    cta: { label: 'Ota yhteyttä', href: '#codex' },
  },

  codex: {
    title: 'Koodeksi',
    lead: 'Kuka, missä ja miten minut tavoittaa.',
    paragraphs: [
      'Olen Claus Laikku, kehittäjä ja yrittäjä Jyväskylästä. Perustin Havaida Oy:n kesällä 2026, työskentelen älyvalaistuksen parissa teknisenä asiantuntijana ja opiskelen tieto- ja viestintätekniikkaa JAMKissa.',
      'Vapaalla HEMA, sukellus, golf ja metsä. Vuonna 2027 suunta on Split.',
    ],
    quote: 'Odotin vuoden, että joku julkaisisi työkalun. Sitten tein sen viikonloppuna.',
    info: [
      { label: 'Nimi', value: 'Claus Laikku' },
      { label: 'Sähköposti', value: links.email, href: `mailto:${links.email}` },
      { label: 'Sijainti', value: 'Jyväskylä, Suomi' },
      { label: 'Saatavuus', value: 'Vapaana uusiin projekteihin' },
    ],
    stats: [
      { value: '2+', label: 'vuotta älytekniikan parissa' },
      { value: '9', label: 'demosivustoa' },
      { value: '4', label: 'palvelulinjaa' },
      { value: '6', label: 'selainpeliä' },
    ],
    links: [
      { label: 'Instagram', value: '@claus.laikku', href: links.instagram },
      { label: 'GitHub', value: 'ClauterL', href: links.github },
      { label: 'Havaida', value: 'havaida.com', href: links.havaida },
      { label: 'Sähköposti', value: links.email, href: `mailto:${links.email}` },
    ],
    // cv: { label: 'Lataa CV', href: '/cv/claus-laikku-cv.pdf' },
    contactTitle: 'Lähetä viesti',
    form: {
      name: 'Nimi',
      email: 'Sähköposti',
      message: 'Viesti',
      submit: 'Lähetä',
      subject: 'Yhteydenotto laikku.comista',
      hint: 'Avaa sähköpostiohjelmasi valmiiksi täytettynä – ei evästeitä, ei välikäsiä.',
    },
    portrait: { ...images.portrait, alt: 'Claus Laikku työpajassaan, taustalla drone ja 3D-tulostin.' },
    builtWith: 'React · Tailwind v4 · shadcn/ui · Web Audio · kuvat Higgsfield',
  },

  hints: {
    details: 'Tiedot',
    stats: 'Tilastot',
    select: 'Valitse',
    back: 'Takaisin',
    prevTab: 'Edellinen',
    nextTab: 'Seuraava',
    mute: 'Ääni',
    move: 'Liiku',
  },

  ui: {
    langToggle: 'Kieli',
    close: 'Sulje',
    menu: 'Valikko',
    settings: 'Asetukset',
    ambient: 'Taustahumina',
    ambientHint: 'Hiljainen huminaääni valikon taustalla.',
    sfx: 'Ääniefektit',
    source: 'Lähdekoodi',
    github: 'GitHub',
    copyright: `© ${year} Claus Laikku`,
    place: 'Jyväskylä → Split 2027',
  },
}
