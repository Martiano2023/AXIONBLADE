# 🚀 INSTRUÇÕES DE DEPLOY NO VERCEL

## ✅ Pré-requisitos Completos

- ✅ Git commit realizado (commit 78f60be)
- ✅ Repositório GitHub criado: https://github.com/Martiano2023/AXIONBLADE
- ✅ Código enviado para GitHub (156 arquivos, 23,982 inserções)
- ✅ Configuração `.env.production` atualizada com variáveis devnet

## 📋 PASSOS PARA DEPLOY NO VERCEL

### Passo 1: Login no Vercel CLI

```bash
cd ~/Desktop/AXIONBLADE/app
npx vercel login
```

Isso abrirá seu navegador para autenticação. Confirme com seu email.

### Passo 2: Deploy para Produção

```bash
npx vercel --prod
```

O CLI vai perguntar:
- **Set up and deploy?** → Yes
- **Which scope?** → Selecione sua conta pessoal
- **Link to existing project?** → No
- **Project name?** → axionblade (ou mantenha o sugerido)
- **Directory?** → ./ (diretório atual)
- **Override settings?** → No

Aguarde o build e deploy (~3-5 minutos).

### Passo 3: Configurar Variáveis de Ambiente no Dashboard

Após o deploy, acesse: https://vercel.com/dashboard

1. Clique no projeto **axionblade**
2. Vá em **Settings** → **Environment Variables**
3. Adicione as seguintes variáveis (todas marcadas como "Production"):

```
NEXT_PUBLIC_SOLANA_NETWORK = devnet
NEXT_PUBLIC_RPC_URL = https://api.devnet.solana.com
NEXT_PUBLIC_CLUSTER = devnet
NEXT_PUBLIC_CREATOR_WALLET = HgThD22yumQsiv7ymLNNWnfzEsfrhKd5sG1X3ffYxNbk

# Program IDs
NEXT_PUBLIC_PROGRAM_CORE = 9jNGhtBFjLFcUKdDdxgwpbKMj6Z6iQw2oBGCeaVBj8gE
NEXT_PUBLIC_PROGRAM_PROOF = 3SNcx2kAf5NXNJd68eLK5gZ3cUvvMEUkC8F4N1ZSUZqV
NEXT_PUBLIC_PROGRAM_TREASURY = EMNF5A4cpqusBuUajMv3FUzjbwR7GQMFyJ7JDi4FjLFu
NEXT_PUBLIC_PROGRAM_APOLLO = 92WeuJoJdh3o1jLcvSLKuTUitQMnUhMRzoTYaSzgo3Ee
NEXT_PUBLIC_PROGRAM_HERMES = Hfv5AS3sydnniyqgF8dwXgN76NU4aKAysgcQJ3uncmTj
NEXT_PUBLIC_PROGRAM_AUDITOR = CGLy91mAXwz761z6soTnap2pNVVA8d8zfsGZjLkqwvTe
NEXT_PUBLIC_PROGRAM_SERVICE = 9ArzMqH6jSWVwvQyYfsdtUQ595wCQXFQAQzXxcoM4LbY

# Protocol Metadata
NEXT_PUBLIC_PROTOCOL_NAME = AXIONBLADE
NEXT_PUBLIC_PROTOCOL_VERSION = 3.3.0
NEXT_PUBLIC_LAUNCH_DATE = 2026-02-15
NEXT_PUBLIC_PRICING_PHASE = launch

# Optional (configure depois se necessário)
# NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID =
# NEXT_PUBLIC_TIPLINK_CLIENT_ID =
```

### Passo 4: Redeploy com Variáveis

Após adicionar as variáveis, clique em **Deployments** → três pontinhos no deploy mais recente → **Redeploy**.

Marque: ☑️ **Use existing Build Cache**

Clique em **Redeploy**.

### Passo 5: Testar o Site Público

Quando o redeploy terminar, você receberá um link tipo:

```
https://axionblade.vercel.app
```

Teste as seguintes páginas:

- ✅ **Landing page** (`/`) — Carrega corretamente
- ✅ **Dashboard** (`/dashboard`) — Mostra overview
- ✅ **Wallet Scanner** (`/wallet-scanner`) — Input aceita endereço
- ✅ **Pool Analyzer** (`/pool-analyzer`) — Interface funcional
- ✅ **Connect Wallet** — Botão mostra 8 wallets
- ✅ **Navegação** — Sidebar funciona
- ✅ **Responsivo** — Mobile e desktop OK

### Passo 6: Verificação de Segurança

Teste o paywall:
1. Conecte uma wallet
2. Tente usar Wallet Scanner
3. Deve pedir pagamento de 0.05 SOL
4. Faça uma transação de teste na devnet
5. Verifique se a análise é liberada após pagamento

## 🔧 ALTERNATIVA: Deploy via GitHub Integration

Se preferir integração contínua:

1. Acesse: https://vercel.com/new
2. Clique em **Import Git Repository**
3. Selecione: `Martiano2023/AXIONBLADE`
4. Configure:
   - **Root Directory**: `app`
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. Adicione as variáveis de ambiente listadas acima
6. Clique em **Deploy**

## 📊 Checklist Pós-Deploy

- [ ] Site acessível publicamente
- [ ] Landing page carrega sem erros
- [ ] Dashboard mostra métricas
- [ ] Wallet connect funciona
- [ ] Navegação entre páginas OK
- [ ] Responsivo em mobile
- [ ] Console sem erros críticos
- [ ] Payment flow testado (devnet)

## 🎯 URL Final

Após deploy completo, seu site estará em:

```
https://axionblade.vercel.app
```

Ou o domínio customizado que você configurar no Vercel.

## 📱 Próximos Passos

1. ✅ Deploy no Vercel
2. ⬜ Testar todas as páginas
3. ⬜ Gravar vídeo demo
4. ⬜ Registrar no Colosseum Eternal
5. ⬜ Criar conta Twitter @AxionBlade
6. ⬜ Primeiro tweet com link do site

---

**Preparado por**: Claude Code
**Data**: 2026-02-12
**Versão**: AXIONBLADE v3.3.0
