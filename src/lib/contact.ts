/* Yhteydenottolomake Netlify Formsin kautta: viesti lähtee suoraan, ei sähköpostiohjelmaa eikä omaa palvelinta.
   Netlify tunnistaa lomakkeen rungosta public/__forms.html (kenttien nimet täsmälleen samat) ja lähettää jokaisesta
   viestistä sähköposti-ilmoituksen osoitteisiin claus.laikku@havaida.com ja claikku@gmail.com (Netlifyssä: Forms →
   Submission notifications; otsikko = piilokenttä subject). Valinnainen info@havaida.com-lähetys:
   netlify/functions/submission-created.mts.
   Kehityspalvelimella (vite) ei lähetetä mitään: kentät tulostetaan konsoliin ja lähetys "onnistuu". */

export type ContactMessage = {
  name: string
  email: string
  message: string
  /** sähköposti-ilmoituksen otsikko */
  subject: string
  /** roskapostiansa: ihminen ei täytä tätä */
  botField?: string
}

export async function sendContact(m: ContactMessage) {
  const body = new URLSearchParams({
    'form-name': 'contact',
    subject: m.subject,
    name: m.name,
    email: m.email,
    message: m.message,
    'bot-field': m.botField ?? '',
  })
  if (import.meta.env.DEV) {
    console.info('[contact] kehitystila – ei lähetetä:', Object.fromEntries(body))
    return
  }
  const res = await fetch('/__forms.html', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!res.ok) throw new Error(`Lomakkeen lähetys epäonnistui: ${res.status}`)
}
