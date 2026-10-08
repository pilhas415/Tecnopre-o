# TecnoPreço 1.0 — Fase 156

## Backend real + base de dados
- Backend funcional em Node.js 22+ usando `node:sqlite`, sem dependências externas.
- Base de dados SQLite persistente para produtos, ofertas, utilizadores, sessões e registos de sincronização.
- API versionada `/api/v1/...` para pesquisa/detalhe de produtos, autenticação e sincronização de ofertas.
- Hash de palavras-passe com `scrypt` e sessões por token com assinatura HMAC.
- Endpoint de saúde `/api/health` e centro visual de Backend v146.
- O servidor inicializa o catálogo a partir de `products.json` apenas na primeira execução.
- Preparação para feeds/APIs autorizados; nenhum preço real é inventado.
- Configuração same-origin para execução do projecto através do servidor.
- Mantido o visual futurista, PWA, partilha, desempenho, recuperação e funcionalidades anteriores.

## Arranque

```bash
TECNOPRECO_TOKEN_SECRET="altera-esta-chave" node backend/server.js
```

Depois abre `http://127.0.0.1:8787/`.


## v147 — API de catálogo central
- Paginação e ordenação do catálogo.
- Endpoints de categorias e marcas.
- Pesquisa centralizada no backend.


## v148 — Lojas e ofertas centralizadas
- Endpoint de lojas e métricas.
- Consulta de ofertas por loja/produto.
- Estrutura pronta para fontes autorizadas.


## v149 — Sincronização e jobs
- Fila de sincronização persistente.
- Criação e consulta de jobs de actualização.
- Registo das sincronizações.


## v150 — Conta e sessões
- Perfil autenticado.
- Actualização do nome.
- Consulta de sessões activas.


## v151 — Alertas de preço reais no backend
- Criação e remoção de alertas.
- Verificação automática durante sincronização de preços.
- Registo do momento em que o alvo é atingido.


## v152 — Segurança de produção
- Rate limiting básico.
- Headers HTTP de segurança.
- Políticas de permissões e referrer.


## v153 — Privacidade e RGPD
- Exportação dos dados da conta.
- Gestão de consentimentos.
- Eliminação da conta pelo utilizador.


## v154 — Testes finais automatizados
- Smoke tests da API.
- Validação do health endpoint e catálogo.
- Script de testes integrado no backend.


## v155 — Preparação de publicação
- Dockerfile de produção.
- Docker Compose com volume persistente.
- Configuração para servidor externo.


## v156 — TecnoPreço 1.0 FINAL
- Release final consolidada.
- Endpoint de versão final.
- Documento de release e inventário.
- Modo futurista preservado.
