import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Email gönderici yapılandırması
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function POST(request: Request) {
  try {
    const { to, subject, html } = await request.json();

    // Email gönder
    await transporter.sendMail({
      from: `"Bakiye360" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email gönderme hatası:', error);
    return NextResponse.json(
      { error: 'Email gönderilemedi' },
      { status: 500 }
    );
  }
} 