# Laikku.com

Claus Laikun henkilökohtainen portfoliosivusto – **laikku.com**.

Yksisivuinen, kaksikielinen (fi/en) ja täysin staattinen sivusto, vaalea ja tumma teema
(kytkin headerissa, muuten seuraa käyttöjärjestelmän asetusta). Tyyli ottaa mallia
[havaida.com](https://havaida.com)-sivusta (monta osiota, pilleri-napit, 32 px:n yläkulma
hero-kuvassa, navy-footer) ja tummista portfolio-templateista (hero kelluvilla
teknologiamerkeillä ja hehkukaarilla, tietokortti + lukutiilet, taitopalkit + ikoniruudukko,
suositukset). Paletti: luu · hiili · viini · hiekka · Havaida-sininen. Koodi-osio on
navy-kaista havaida.comin väreillä molemmissa teemoissa.

## Stack

| Osa            | Mitä                                                                 |
| -------------- | -------------------------------------------------------------------- |
| Runko          | React 19 · Vite 8 · TypeScript                                       |
| Tyylit         | Tailwind CSS 4 (`@tailwindcss/vite`) · `tw-animate-css`              |
| Komponentit    | shadcn/ui (new-york) Radix UI -primitiivien päällä: Button, Badge, Card, Sheet (mobiilivalikko), Tooltip (kontribuutiokalenteri), ToggleGroup (kielivalinta), Separator, Accordion |
| Ikonit         | lucide-react (UI) · simple-icons (teknologialogot, CC0)              |
| Kuvat          | Higgsfield, Claus-referenssihahmo → WebP kahdessa koossa (`public/images`); hero-cutout taustanpoistolla |
| Data           | `scripts/fetch-github.mjs` hakee julkiset GitHub-tiedot build-aikana → `src/data/github.json` |
| Julkaisu       | GitHub Actions → GitHub Pages (custom domain `laikku.com`, `public/CNAME`) |

> `tw-animate-css` on Tailwind v4 -yhteensopiva seuraaja `tailwindcss-animate`-paketille
> (sama `animate-in` / `fade-in` / `slide-in-from-*` -syntaksi).

## Komennot

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # hakee GitHub-datan (prebuild) + tsc + vite build → dist/
npm run preview      # http://localhost:5180
npm run fetch:github # päivitä vain src/data/github.json
npm run typecheck
```

Node ≥ 22.12 (Vite 8).

## Rakenne

```
src/
  main.tsx, App.tsx          sovelluksen juuri ja osioiden järjestys
  index.css                  Tailwind v4 -teema, brändi-tokenit, shadcn-muuttujat, utilityt
  content/
    types.ts                 sisällön tyyppi
    fi.ts, en.ts             KAIKKI TEKSTIT – muokkaa näitä
    images.ts                kuvien polut, koot ja ulkoiset linkit
  components/
    Header (kieli + teemakytkin), Hero (cutout + kelluvat merkit), Now, Pillars, Projects,
    Code (navy-kaista), About (tietokortti + lukutiilet), Skills (palkit + ikoniruudukko),
    Services, Testimonials (karuselli), Cta, Contact, Footer
    TechIcon.tsx             teknologiaikonit (simple-icons / lucide) avaimella
    Picture.tsx              responsiivinen <img srcset>
    SectionHead.tsx          eyebrow + otsikko + lead
    ui/                      shadcn/ui-komponentit (muokattavissa)
  hooks/
    useLang.ts               kieli (localStorage + selaimen kieli)
    useTheme.ts              vaalea/tumma (localStorage + prefers-color-scheme)
    useReveal.ts             paljastus vieritettäessä (.reveal → .in-view)
  data/github.json           build-aikana generoitu GitHub-data (committoitu fallbackina)
scripts/fetch-github.mjs     GitHub-haku (ei tokenia; GITHUB_TOKEN nostaa rate limitiä)
public/images/               WebP-kuvat (hero, portrait, builder, adventure, discipline, …)
.github/workflows/deploy.yml GitHub Pages -julkaisu + päivittäinen rebuild (data pysyy tuoreena)
```

## Sisällön muokkaus

- **Suositukset** ovat paikkamerkkejä (`placeholder: true`): korvaa `testimonials.items`
  oikeilla lainauksilla ja poista `placeholder`-lippu, niin "Paikkamerkki"-merkintä katoaa.
- **Lukutiilet** (`about.stats`) ja **taitopalkit** (`skills.bars`) ovat lähtöarvoja – muokkaa.
- **CV-painike**: lisää PDF `public/cv/`-kansioon ja ota `about.cv` käyttöön.
- Teknologiaikonit: avaimet löytyvät `src/components/TechIcon.tsx`-rekisteristä.

- Tekstit: `src/content/fi.ts` ja `src/content/en.ts` (sama rakenne, tyyppitarkistettu).
- "Työpöydällä nyt" -kortit Koodi-osiossa: `dev.desk.items` samoissa tiedostoissa.
- Linkit (Instagram, GitHub, sähköposti…): `src/content/images.ts` → `links`.
- Kuvan vaihto: tallenna uusi WebP `public/images/<nimi>-<leveys>.webp` kahdessa koossa
  ja päivitä `src/content/images.ts`.

## Julkaisu GitHub Pagesiin

1. Repo `ClauterL/Laikku.com`, branch `main`.
2. GitHub → Settings → Pages → Source: **GitHub Actions**.
3. Custom domain `laikku.com` (DNS: A-tietueet GitHub Pagesin IP:ihin tai CNAME `clauterl.github.io`),
   "Enforce HTTPS" päälle. `public/CNAME` pitää domainin asetuksissa joka deployssa.
4. Workflow ajaa buildin jokaisesta pushista ja kerran päivässä (GitHub-data).

## Yhteydenottolomake

Sivu on staattinen, joten lomake koostaa `mailto:`-linkin. Jos haluat oikean lähetyksen,
vaihda `src/components/Contact.tsx`:n `onSubmit` esim. Formspree- tai Netlify Forms -kutsuksi.
