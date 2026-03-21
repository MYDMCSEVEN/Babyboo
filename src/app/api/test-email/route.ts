import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function GET() {
  const config = {
    host: process.env.SMTP_HOST || 'NOT SET',
    port: process.env.SMTP_PORT || 'NOT SET',
    user: process.env.SMTP_USER || 'NOT SET',
    passLength: process.env.SMTP_PASSWORD ? process.env.SMTP_PASSWORD.length : 0,
    adminEmail: process.env.ADMIN_EMAIL || 'NOT SET',
  }

  if (!process.env.SMTP_PASSWORD) {
    return NextResponse.json({ error: 'SMTP_PASSWORD not set', config })
  }

  const smtpPort = parseInt(process.env.SMTP_PORT || '465')

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mail.infomaniak.com',
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: process.env.SMTP_USER || 'info@babyboo-creations.ch',
        pass: process.env.SMTP_PASSWORD,
      },
    })

    // Verify connection
    await transporter.verify()

    // Send test email
    await transporter.sendMail({
      from: '"Babyboo Créations" <info@babyboo-creations.ch>',
      to: process.env.ADMIN_EMAIL || 'info@babyboo-creations.ch',
      subject: 'Test email — Babyboo Créations',
      html: '<h2>Test réussi !</h2><p>Les emails fonctionnent correctement.</p>',
    })

    return NextResponse.json({ success: true, message: 'Email envoyé !', config })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      code: error.code,
      config,
    })
  }
}
