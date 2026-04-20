import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { email, name } = await req.json();
    if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });

    const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const onboardingUrl = `${appUrl}/onboarding`;

    await resend.emails.send({
      from: "Isabella Team <onboarding@resend.dev>",
      to: email,
      subject: "Welcome to the Isabella Team — Complete Your Onboarding",
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #0f0f0f; color: #f5f5f5; border-radius: 12px;">
          <h2 style="color: #ffffff; margin-bottom: 8px;">Welcome${name ? `, ${name}` : ""}! 👋</h2>
          <p style="color: #aaaaaa; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
            You've been added to the Isabella team. Please complete your onboarding form so we can get you set up properly.
          </p>
          <a href="${onboardingUrl}"
            style="display: inline-block; background: #4f46e5; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
            Complete Onboarding Form →
          </a>
          <p style="color: #666; font-size: 13px; margin-top: 32px;">
            If the button doesn't work, copy and paste this link:<br/>
            <a href="${onboardingUrl}" style="color: #818cf8;">${onboardingUrl}</a>
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("send-form error:", err);
    return NextResponse.json({ error: err.message ?? "Failed to send email" }, { status: 500 });
  }
}
