import fs from 'node:fs/promises';
import path from 'node:path';
import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const hasSmtp = Boolean(env.smtp.host);

const transporter = hasSmtp
  ? nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    })
  : null;

export const mailMode = transporter ? 'smtp' : 'outbox';
export const isOutboxMode = () => !transporter;

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function layout({ title, preheader = '', body }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f7f0e4;font-family:'Trebuchet MS',Arial,sans-serif;color:#2a172f;">
    <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</span>
    <div style="max-width:620px;margin:0 auto;padding:28px 16px;">
      <div style="background:#2b1234;border-radius:24px 24px 0 0;padding:26px 30px;">
        <div style="font-size:28px;font-weight:800;letter-spacing:-1px;color:#ffcf3f;">Slice<span style="color:#ff4d62;">Theory</span></div>
        <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#f9e7c9;opacity:.75;margin-top:4px;">More than pizza. It's a theory.</div>
      </div>
      <div style="background:#fffaf1;padding:34px 30px;border-radius:0 0 24px 24px;border:1px solid #eadfcb;border-top:0;">
        ${body}
      </div>
      <div style="text-align:center;color:#8b7a8f;font-size:12px;line-height:1.7;padding:20px 12px;">
        Slice Theory · Good pizza. Good mood.<br />
        This is an automated message. Need help? Reply to this email.
      </div>
    </div>
  </body>
</html>`;
}

const button = (href, label, color = '#e7334a') =>
  `<a href="${href}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;padding:14px 26px;border-radius:999px;font-weight:700;font-size:15px;">${escapeHtml(
    label
  )}</a>`;

export async function sendMail({ to, subject, html, text }) {
  if (!transporter) {
    await fs.mkdir(env.outboxDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const slug = String(to).toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) || 'mail';
    const filename = `${stamp}-${slug}.html`;
    const filePath = path.join(env.outboxDir, filename);
    await fs.writeFile(filePath, html, 'utf8');
    console.log(`[mail:outbox] ${subject} -> ${to}`);
    console.log(`[mail:outbox] ${filePath}`);
    return { status: 'outbox', filePath };
  }

  await transporter.sendMail({ from: env.emailFrom, to, subject, html, text });
  return { status: 'sent' };
}

export function verificationEmail({ name, url }) {
  const safeName = escapeHtml(name || 'Pizza friend');
  return {
    subject: 'Verify your Slice Theory account',
    html: layout({
      title: 'Verify your email',
      preheader: 'One quick tap and your slice is ready.',
      body: `
        <h1 style="font-size:28px;line-height:1.15;margin:0 0 14px;">Hey ${safeName}, let's get baking.</h1>
        <p style="font-size:15px;line-height:1.7;color:#5c4a60;">Confirm your email to activate your Slice Theory account and start building your perfect pizza.</p>
        <p style="margin:28px 0;">${button(url, 'Verify my email')}</p>
        <p style="font-size:13px;color:#8b7a8f;line-height:1.7;">This link expires in 24 hours. If the button doesn't work, copy this link:<br />
          <span style="word-break:break-all;color:#4b2b55;">${escapeHtml(url)}</span>
        </p>`,
    }),
    text: `Verify your Slice Theory account: ${url}`,
  };
}

export function resetEmail({ name, url }) {
  const safeName = escapeHtml(name || 'Pizza friend');
  return {
    subject: 'Reset your Slice Theory password',
    html: layout({
      title: 'Reset password',
      preheader: 'A fresh password, hot from the oven.',
      body: `
        <h1 style="font-size:28px;line-height:1.15;margin:0 0 14px;">Password reset, ${safeName}?</h1>
        <p style="font-size:15px;line-height:1.7;color:#5c4a60;">We received a request to reset your password. This link is valid for 30 minutes.</p>
        <p style="margin:28px 0;">${button(url, 'Choose a new password', '#45214f')}</p>
        <p style="font-size:13px;color:#8b7a8f;line-height:1.7;">Didn't request this? You can safely ignore this email — your password stays the same.</p>`,
    }),
    text: `Reset your Slice Theory password: ${url}`,
  };
}

export function lowStockEmail({ items, figure }) {
  const rows = items
    .map(
      (item) => `<tr>
        <td style="padding:10px 8px;border-bottom:1px solid #f0e4d3;text-transform:capitalize;">${escapeHtml(item.category)}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #f0e4d3;font-weight:700;">${escapeHtml(item.name)}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #f0e4d3;color:#c0263d;font-weight:800;">${item.stock} ${escapeHtml(item.unit)}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #f0e4d3;color:#7b6a7f;">${item.threshold}</td>
      </tr>`
    )
    .join('');

  return {
    subject: `Low stock alert — ${items.length} item${items.length === 1 ? '' : 's'} need attention`,
    html: layout({
      title: 'Low stock alert',
      preheader: 'The kitchen shelf is looking light.',
      body: `
        <h1 style="font-size:27px;line-height:1.15;margin:0 0 10px;">The oven is hungry.</h1>
        <p style="font-size:15px;line-height:1.7;color:#5c4a60;">${items.length} inventory item${items.length === 1 ? ' has' : 's have'} dropped to or below the configured threshold.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin:22px 0;">
          <thead><tr style="text-align:left;color:#8b7a8f;font-size:11px;letter-spacing:1px;text-transform:uppercase;">
            <th style="padding:8px;">Category</th><th style="padding:8px;">Item</th><th style="padding:8px;">In stock</th><th style="padding:8px;">Threshold</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin:26px 0;">${button(`${figure}/admin`, 'Open Admin Studio', '#ffbf24')}</p>
        <p style="font-size:13px;color:#8b7a8f;">Alerts respect a ${env.lowStockCooldownHours}-hour cooldown per item. Stock is checked automatically by the scheduled job.</p>`,
    }),
    text: `Low stock alert:\n${items.map((i) => `${i.category} · ${i.name}: ${i.stock} ${i.unit} (threshold ${i.threshold})`).join('\n')}`,
  };
}

export function orderConfirmedEmail({ order, name, cod = false }) {
  const rows = order.items
    .map(
      (item) =>
        `<tr><td style="padding:9px 8px;border-bottom:1px solid #f0e4d3;">${item.quantity} × ${escapeHtml(
          item.name
        )} <span style="color:#8b7a8f;font-size:12px;">(${escapeHtml(item.sizeLabel)})</span></td>
        <td style="padding:9px 8px;border-bottom:1px solid #f0e4d3;text-align:right;">₹${item.lineTotal.toFixed(0)}</td></tr>`
    )
    .join('');

  const totalLabel = cod ? 'Payable on delivery (cash)' : 'Total paid';

  return {
    subject: cod
      ? `Order ${order.orderNumber} confirmed — pay cash when your pizza arrives`
      : `Order ${order.orderNumber} confirmed — we're firing up the oven`,
    html: layout({
      title: 'Order confirmed',
      preheader: `Order ${order.orderNumber} is in the kitchen.`,
      body: `
        <h1 style="font-size:28px;line-height:1.15;margin:0 0 8px;">Your pizza is official.</h1>
        <p style="font-size:15px;line-height:1.7;color:#5c4a60;">Thanks ${escapeHtml(name || 'friend')} — order <strong>${escapeHtml(
        order.orderNumber
      )}</strong> has been received and is heading to the kitchen.${cod ? ' Keep ₹' + order.pricing.total.toFixed(0) + ' in cash ready for our delivery hero.' : ''}</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin:22px 0;">${rows}
          <tr><td style="padding:12px 8px;font-weight:800;">${totalLabel}</td>
          <td style="padding:12px 8px;text-align:right;font-weight:800;">₹${order.pricing.total.toFixed(0)}</td></tr>
        </table>
        <p style="margin:26px 0;">${button(`${env.clientUrls[0]}/orders/${order._id || order.id}`, 'Track my order')}</p>`,
    }),
    text: cod
      ? `Order ${order.orderNumber} confirmed. Cash on delivery: ₹${order.pricing.total.toFixed(0)}.`
      : `Order ${order.orderNumber} confirmed. Total ₹${order.pricing.total.toFixed(0)}.`,
  };
}
