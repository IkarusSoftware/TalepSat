import { getCheckoutFormContent } from '@/lib/billing-service';

function htmlPage(content: string) {
  return `<!doctype html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>TalepSat Güvenli Ödeme</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        background: #f7f3ee;
        color: #1f2937;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .shell {
        max-width: 920px;
        margin: 0 auto;
        padding: 32px 20px 64px;
      }
      .card {
        background: #ffffff;
        border: 1px solid rgba(15, 23, 42, 0.08);
        border-radius: 28px;
        padding: 24px;
        box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
      }
      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(234, 88, 12, 0.12);
        color: #c2410c;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      h1 {
        margin: 18px 0 8px;
        font-size: 34px;
        line-height: 1.1;
      }
      p {
        margin: 0 0 18px;
        color: #6b7280;
        line-height: 1.65;
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <div class="card">
        <span class="eyebrow">TalepSat x iyzico</span>
        <h1>Güvenli ödeme</h1>
        <p>Ödemeyi tamamladıktan sonra bu pencereyi kapatabilir ve TalepSat abonelik ekranına dönebilirsin.</p>
        ${content}
      </div>
    </div>
  </body>
</html>`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return new Response(htmlPage('<p>Geçersiz checkout oturumu.</p>'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const content = await getCheckoutFormContent(token);
  if (!content) {
    return new Response(htmlPage('<p>Checkout içeriği bulunamadı. Lütfen tekrar deneyin.</p>'), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  return new Response(htmlPage(content), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
