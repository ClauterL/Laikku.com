# Laikku.com — ohjeet avustajalle

Claus Laikun portfoliosivusto (laikku.com). Rakenne ja komennot: README.md.

## Ympäristö

- Projektin polku käyttäjän koneella: `H:\Havaida\Laikku.com` (Windows, Git Bash).
- Node ≥ 22.12. `npm run dev` → http://localhost:5173, `npm run preview` → :5180.
- GitHub-repo: `ClauterL/Laikku.com`, julkaisu GitHub Pagesiin (custom domain laikku.com).

## Säännöt

- Kaikki näkyvä teksti tulee `src/content/fi.ts` ja `src/content/en.ts` -tiedostoista.
  Älä kovakoodaa tekstejä komponentteihin; lisää uudet kentät myös `types.ts`:ään.
- Tyylit: Tailwind v4 -utilityt + `src/index.css`:n tokenit (`bg-viini`, `text-hiili`, `bg-luu-2`…).
  Koodi-osio ja footer käyttävät `.dark`-luokkaa ja havaida.comin navy-palettia.
- UI-primitiivit ovat shadcn/ui-tyylisiä (`src/components/ui`), Radix UI:n päällä.
  Uudet komponentit samaan tyyliin (`cn()`, `data-slot`, cva-variantit).
- Kuvat: WebP kahdessa koossa `public/images/`, polut `src/content/images.ts`.
  Henkilökuvat generoidaan Higgsfieldillä Claus-referenssihahmolla.
- `src/data/github.json` on generoitu tiedosto (scripts/fetch-github.mjs) – älä muokkaa käsin.
- Pidä sivu staattisena: ei backendia, ei evästeitä, ei kolmannen osapuolen skriptejä
  (Google Fonts on ainoa ulkoinen resurssi).
