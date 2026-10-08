# Deploy no Cloudflare Workers (OpenNext)

Guia para publicar o Dalce Estoque diretamente no **Cloudflare Workers** usando
`@opennextjs/cloudflare`. Este é o caminho usado quando o build roda no
Cloudflare (Workers Builds / `wrangler`).

> Se você só quer usar o Cloudflare como DNS/CDN na frente da Vercel, veja
> `docs/CLOUDFLARE_SETUP.md`.

## 1. Requisitos

- Node.js **>= 20.9.0** (o projeto declara isso em `engines`).
- Conta Cloudflare com Workers habilitado.
- `package-lock.json` **sincronizado** com o `package.json` (veja a seção 5).

## 2. Build local (opcional, para testar)

```bash
npm install
npm run preview   # opennextjs-cloudflare build && opennextjs-cloudflare preview
```

O `preview` sobe um servidor local que simula o Worker.

## 3. Deploy

```bash
npm run deploy    # opennextjs-cloudflare build && opennextjs-cloudflare deploy
```

Ou, se o build for feito pelo Cloudflare (Workers Builds), configure:

| Configuração | Valor |
|--------------|-------|
| Build command | `npx opennextjs-cloudflare build` |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` |

## 4. Variáveis de ambiente

As variáveis **públicas** podem ficar em `wrangler.jsonc` (seção `vars`) ou no
painel do Cloudflare. As **secretas** devem ser cadastradas como secrets:

```bash
npx wrangler secret put NEXT_PUBLIC_SUPABASE_URL
npx wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

> `NEXT_PUBLIC_*` são embutidas no bundle em tempo de build. Se mudarem, é
> preciso **rebuildar** o Worker.

## 5. Lockfile sincronizado (causa do erro ETARGET)

O Cloudflare roda `npm clean-install`, que **exige** que o `package-lock.json`
esteja 100% sincronizado com o `package.json`. Se estiver desatualizado, o build
falha com erros como:

```
npm error code ETARGET
npm error notarget No matching version found for typescript@5.6.0.
```

Para corrigir, rode **localmente** (no Termux):

```bash
rm -rf node_modules package-lock.json
npm install
```

Isso regenera o `package-lock.json` com todas as dependências (incluindo
`@opennextjs/cloudflare` e `wrangler`). Depois faça commit do lockfile novo.

> **Importante**: nunca edite o `package-lock.json` à mão. Ele deve ser sempre
> gerado pelo `npm install`.

## 6. Compatibilidade

- `compatibility_flags: ["nodejs_compat"]` é obrigatório para o runtime Node
  usado pelo Next.js.
- `compatibility_date` deve ser recente (o projeto usa `2025-03-01`).
- O binding `ASSETS` aponta para `.open-next/assets`.

## 7. Troubleshooting

### `ETARGET No matching version found`

Lockfile desatualizado — veja a seção 5.

### `ERESOLVE overriding peer dependency` (react / react-dom)

Aviso benigno quando as versões de `react` e `react-dom` divergem. Mantenha as
duas **na mesma versão** no `package.json` (aqui: `19.0.0`).

### `Could not resolve "@opennextjs/cloudflare"`

A dependência não está no lockfile. Rode `npm install` e faça commit do
`package-lock.json`.

### Erro de módulo Node não suportado

Confirme `nodejs_compat` em `wrangler.jsonc` e que o `compatibility_date` é
recente.
