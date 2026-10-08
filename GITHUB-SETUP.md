# TecnoPreço — GitHub

## Versão
v156 — TecnoPreço 1.0 FINAL

## Publicação local
1. Instalar Node.js LTS.
2. Entrar na pasta do projecto.
3. `cd backend && npm install`
4. `npm start`
5. Abrir o frontend através do servidor definido pelo projecto.

## Variáveis de ambiente
Copiar `backend/.env.example` para `backend/.env` e preencher apenas valores locais/secretos.
Nunca fazer commit de `backend/.env`.

## Git
```bash
git init
git add .
git commit -m "TecnoPreço v156 — release inicial"
git branch -M main
git remote add origin https://github.com/TEU_UTILIZADOR/TecnoPreco.git
git push -u origin main
```

Substitui `TEU_UTILIZADOR` pelo teu nome de utilizador GitHub.
