# Landing page do SmartTrip

Página estática de apresentação do projeto: HTML e CSS puros, sem build, sem npm, sem JavaScript, sem CDN e sem analytics. A fonte (Plus Jakarta Sans, licença OFL em `static/fonts/OFL.txt`) é servida do próprio projeto.

O SmartTrip em si roda só localmente (ele grava num arquivo JSON na sua máquina), então esta página não leva a nenhum app hospedado. Ela mostra os prints, as decisões técnicas e como rodar o projeto.

## Ver localmente

Qualquer servidor estático serve. Na raiz do repositório:

```bash
npx serve landing
```

Abrir o `index.html` direto no navegador também funciona.

## Deploy na Vercel

1. Importe o repositório em um novo projeto da Vercel.
2. Em **Root Directory**, escolha `landing`.
3. **Framework Preset**: Other. Deixe o Build Command e o Output Directory em branco.

O `vercel.json` desta pasta aplica `cleanUrls` e os cabeçalhos de segurança (CSP restrita, `X-Frame-Options`, `Referrer-Policy` e outros).

A imagem de compartilhamento (`og:image`) aponta para `https://raw.githubusercontent.com/Miguel-de-Castro/SmartTrip/main/landing/static/og.png`, então só passa a funcionar depois que esta pasta estiver na `main`.
