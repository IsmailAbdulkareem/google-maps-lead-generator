import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

function getTransporter() {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("EMAIL_USER and EMAIL_PASS must be set in environment");
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });
}

function thankYouHtml(name: string) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px">
      <h2 style="color:#111">You're on the waitlist!</h2>
      <p style="color:#444;line-height:1.6">
        Hi${name ? ` ${name}` : ""},<br/><br/>
        Thank you for your interest in <strong>Pro</strong>. We've added you to
        the waitlist and will notify you the moment it launches.
      </p>
      <p style="color:#444;line-height:1.6">
        In the meantime, keep using the Free plan — your leads are saved on your
        device and new credits never expire.
      </p>
      <p style="color:#888;font-size:12px;margin-top:32px">
        — Lead Generator Team
      </p>
    </div>
  `;
}

function adminNotificationHtml(email: string, name: string) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px">
      <h2 style="color:#111">New Pro Waitlist Signup</h2>
      <table style="border-collapse:collapse;margin-top:12px">
        <tr>
          <td style="padding:6px 12px;color:#888">Name</td>
          <td style="padding:6px 12px;color:#111;font-weight:600">${name || "(not provided)"}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px;color:#888">Email</td>
          <td style="padding:6px 12px;color:#111;font-weight:600">${email}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px;color:#888">Date</td>
          <td style="padding:6px 12px;color:#111">${new Date().toISOString()}</td>
        </tr>
      </table>
    </div>
  `;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body.email?.trim();
    const name = body.name?.trim() ?? "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const transporter = getTransporter();

    // Send thank-you email to the user
    await transporter.sendMail({
      from: `"Lead Generator" <${EMAIL_USER}>`,
      to: email,
      subject: "You're on the Pro waitlist!",
      html: thankYouHtml(name),
    });

    // Send notification to admin
    await transporter.sendMail({
      from: `"Lead Generator Waitlist" <${EMAIL_USER}>`,
      to: EMAIL_USER,
      subject: `New waitlist signup: ${email}`,
      html: adminNotificationHtml(email, name),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Waitlist] Error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
