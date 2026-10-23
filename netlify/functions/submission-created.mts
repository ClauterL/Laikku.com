import nodemailer from 'nodemailer'
import type { Context } from '@netlify/functions'

/* Yhteydenottolomakkeen sähköposti. Netlify kutsuu tätä funktiota automaattisesti jokaisesta hyväksytystä
   (ei roskapostiksi luokitellusta) lomakeviestistä – tiedostonimi submission-created on tapahtuman nimi.
   Viesti lähtee Google Workspacen SMTP:llä havaida.comin nimissä: Google allekirjoittaa sen DKIM:llä (d=havaida.com),
   joten havaida.comin DMARC-tarkistus menee läpi eikä viesti päädy roskapostiin.

   Ympäristömuuttujat Netlifyssä (Project configuration → Environment variables, scope sisältää Functions):
   - CONTACT_SMTP_USER  Google-tili, jolla lähetetään (info@havaida.com, tai tili, jolla info@ on aliaksena
                        Gmailin "Lähetä viestejä nimellä" -asetuksissa)
   - CONTACT_SMTP_PASS  tilin sovellussalasana (myaccount.google.com/apppasswords; vaatii 2-vaiheisen tunnistuksen)
   - CONTACT_FROM       valinnainen, oletus info@havaida.com
   - CONTACT_TO         valinnainen, pilkulla erotettu, oletus claus.laikku@havaida.com,claikku@gmail.com
   - CONTACT_SMTP_HOST / CONTACT_SMTP_PORT  valinnaiset, oletus smtp.gmail.com:465 (TLS) – toinen palvelu tarvittaessa
   Muuttujat luetaan julkaisuhetkellä: muutoksen jälkeen tarvitaan uusi julkaisu. */

type Submission = {
  form_name?: string
  created_at?: string
  data?: Record<string, string | undefined>
}

const DEFAULT_FROM = 'info@havaida.com'
const DEFAULT_TO = 'claus.laikku@havaida.com,claikku@gmail.com'

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c] ?? c)
/** otsakkeisiin ei rivinvaihtoja */
const oneLine = (s: string, max: number) => s.replace(/[\r\n\t]+/g, ' ').trim().slice(0, max)
const isEmail = (s: string) => /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[^\s@<>(),;:"]+$/.test(s)

export default async (req: Request, _context: Context) => {
  const body = (await req.json()) as { payload?: Submission }
  const sub = body.payload
  if (!sub || sub.form_name !== 'contact') return new Response('ignored')

  const user = Netlify.env.get('CONTACT_SMTP_USER')
  const pass = Netlify.env.get('CONTACT_SMTP_PASS')
  if (!user || !pass) {
    console.error('[contact] CONTACT_SMTP_USER / CONTACT_SMTP_PASS puuttuu – viesti on tallessa vain Netlifyn Forms-näkymässä')
    return new Response('smtp not configured', { status: 500 })
  }

  const d = sub.data ?? {}
  const name = oneLine(d.name ?? '', 120) || '–'
  const email = oneLine(d.email ?? '', 200)
  const message = (d.message ?? '').trim().slice(0, 20000)
  const subject = oneLine(d.subject || `Yhteydenotto laikku.comista – ${name}`, 200)
  const when = new Date(sub.created_at ?? Date.now()).toLocaleString('fi-FI', { timeZone: 'Europe/Helsinki' })
  const from = Netlify.env.get('CONTACT_FROM') || DEFAULT_FROM
  const to = (Netlify.env.get('CONTACT_TO') || DEFAULT_TO)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const text = `${message}\n\n—\n${name}${email ? ` <${email}>` : ''}\nLähetetty laikku.comin yhteydenottolomakkeella ${when}.\nVastaa-painike vastaa suoraan lähettäjälle.`
  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.55;color:#2a1524">
<p style="white-space:pre-wrap;margin:0 0 18px">${esc(message)}</p>
<p style="margin:0;color:#6b4a5c">— <b>${esc(name)}</b>${email ? ` &lt;<a href="mailto:${esc(email)}">${esc(email)}</a>&gt;` : ''}</p>
<p style="margin:14px 0 0;font-size:12px;color:#8a7380">Lähetetty laikku.comin yhteydenottolomakkeella ${esc(when)}. Vastaa-painike vastaa suoraan lähettäjälle.</p>
</div>`

  const port = Number(Netlify.env.get('CONTACT_SMTP_PORT') || 465)
  const transport = nodemailer.createTransport({
    host: Netlify.env.get('CONTACT_SMTP_HOST') || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: { user, pass },
  })
  await transport.sendMail({
    from: { name: 'Laikku.com', address: from },
    to,
    replyTo: isEmail(email) ? { name, address: email } : undefined,
    subject,
    text,
    html,
  })
  console.info(`[contact] viesti välitetty: ${to.join(', ')}`)
  return new Response('sent')
}
