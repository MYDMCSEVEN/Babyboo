import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'mail.infomaniak.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'info@babyboo-creations.ch',
    pass: process.env.SMTP_PASSWORD || '',
  },
})

interface OrderEmailData {
  orderId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  paymentMethod: string
  items: { name: string; quantity: number; price: number }[]
  subtotal: number
  shipping: number
  total: number
  personalization?: string
  address?: string
}

function getPaymentInfo(method: string): string {
  switch (method) {
    case 'cash':
      return 'Espèces — Retrait à Fully (VS). Vous serez contacté(e) pour convenir d\'un rendez-vous.'
    case 'twint':
      return 'Twint — Envoi postal dès réception du paiement. Délai : 7 jours ouvrables.'
    case 'stripe':
      return 'Carte bancaire — Envoi postal dès réception du paiement. Délai : 7 jours ouvrables.'
    default:
      return method
  }
}

function buildItemsHtml(items: { name: string; quantity: number; price: number }[]): string {
  return items.map(item =>
    `<tr><td style="padding:8px;border-bottom:1px solid #eee">${item.name}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">x${item.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${(item.price * item.quantity).toFixed(2)} CHF</td></tr>`
  ).join('')
}

export async function sendCustomerEmail(data: OrderEmailData) {
  if (!process.env.SMTP_PASSWORD) return

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#5C4033">
      <div style="text-align:center;padding:30px 0;background:#F8E8E0;border-radius:12px 12px 0 0">
        <h1 style="margin:0;font-size:24px">Babyboo Création</h1>
        <p style="margin:5px 0 0;color:#C4A882">Merci pour votre commande !</p>
      </div>
      <div style="padding:30px;background:#fff">
        <p>Bonjour ${data.customerName},</p>
        <p>Votre commande <strong>#${data.orderId.slice(-6)}</strong> a bien été enregistrée.</p>

        <h3 style="color:#E8B4B8;border-bottom:2px solid #F8E8E0;padding-bottom:8px">Détails de la commande</h3>
        <table style="width:100%;border-collapse:collapse">
          ${buildItemsHtml(data.items)}
          <tr><td style="padding:8px" colspan="2">Sous-total</td><td style="padding:8px;text-align:right">${data.subtotal.toFixed(2)} CHF</td></tr>
          <tr><td style="padding:8px" colspan="2">Livraison</td><td style="padding:8px;text-align:right">${data.shipping === 0 ? 'Gratuit' : data.shipping.toFixed(2) + ' CHF'}</td></tr>
          <tr style="font-weight:bold;font-size:18px"><td style="padding:12px 8px" colspan="2">Total</td><td style="padding:12px 8px;text-align:right;color:#E8B4B8">${data.total.toFixed(2)} CHF</td></tr>
        </table>

        ${data.personalization ? `<p><strong>Personnalisation :</strong> ${data.personalization}</p>` : ''}
        ${data.address ? `<p><strong>Adresse de livraison :</strong><br>${data.address}</p>` : ''}

        <div style="background:#F5F0EB;padding:16px;border-radius:8px;margin:20px 0">
          <p style="margin:0"><strong>Paiement :</strong> ${getPaymentInfo(data.paymentMethod)}</p>
        </div>

        ${data.paymentMethod === 'twint' ? `
          <div style="background:#F8E8E0;padding:16px;border-radius:8px;margin:20px 0">
            <p style="margin:0 0 8px"><strong>Paiement Twint :</strong></p>
            <p style="margin:0">Envoyez le montant de <strong>${data.total.toFixed(2)} CHF</strong> au <strong>079 270 41 01</strong></p>
            <p style="margin:8px 0 0">Référence : <strong>#${data.orderId.slice(-6)}</strong></p>
          </div>
        ` : ''}

        <p style="color:#888;font-size:14px;margin-top:30px">
          Pour toute question, contactez-nous à info@babyboo-creations.ch ou au 079 270 41 01.
        </p>
      </div>
      <div style="text-align:center;padding:20px;background:#F5F0EB;border-radius:0 0 12px 12px;font-size:12px;color:#888">
        <p>Babyboo Création — Fait main avec amour en Suisse 🇨🇭</p>
      </div>
    </div>
  `

  await transporter.sendMail({
    from: '"Babyboo Création" <info@babyboo-creations.ch>',
    to: data.customerEmail,
    subject: `Confirmation de commande #${data.orderId.slice(-6)} — Babyboo Création`,
    html,
  })
}

export async function sendAdminEmail(data: OrderEmailData) {
  if (!process.env.SMTP_PASSWORD) return

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <h2>🧸 Nouvelle commande #${data.orderId.slice(-6)}</h2>

      <h3>Client</h3>
      <p>Nom : ${data.customerName}<br>
      Email : ${data.customerEmail}<br>
      Téléphone : ${data.customerPhone}</p>

      <h3>Articles</h3>
      <table style="width:100%;border-collapse:collapse">
        ${buildItemsHtml(data.items)}
        <tr><td style="padding:8px" colspan="2">Sous-total</td><td style="padding:8px;text-align:right">${data.subtotal.toFixed(2)} CHF</td></tr>
        <tr><td style="padding:8px" colspan="2">Livraison</td><td style="padding:8px;text-align:right">${data.shipping === 0 ? 'Gratuit (retrait)' : data.shipping.toFixed(2) + ' CHF'}</td></tr>
        <tr style="font-weight:bold"><td style="padding:8px" colspan="2">Total</td><td style="padding:8px;text-align:right">${data.total.toFixed(2)} CHF</td></tr>
      </table>

      <p><strong>Paiement :</strong> ${getPaymentInfo(data.paymentMethod)}</p>
      ${data.personalization ? `<p><strong>Personnalisation :</strong> ${data.personalization}</p>` : ''}
      ${data.address ? `<p><strong>Adresse :</strong><br>${data.address}</p>` : ''}
    </div>
  `

  await transporter.sendMail({
    from: '"Babyboo Création" <info@babyboo-creations.ch>',
    to: 'info@babyboo-creations.ch',
    subject: `🧸 Nouvelle commande #${data.orderId.slice(-6)} — ${data.customerName}`,
    html,
  })
}
