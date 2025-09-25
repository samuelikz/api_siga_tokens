# API (NestJS + Prisma)

Projeto NestJS com duas bases de dados (Primary e Secondary), autenticação JWT (rotas primárias),
API Key com escopos (rotas secundárias), documentação via Swagger e paginação com tratamento
de `BigInt` para JSON.

---

## Sumário

- [Stack](#stack)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Requisitos](#requisitos)
- [Ambiente (.env)](#ambiente-env)
- [Instalação & Execução](#instalação--execução)
- [Prisma (Primary & Secondary)](#prisma-primary--secondary)
- [Swagger](#swagger)
- [CORS](#cors)
- [BigInt → JSON](#bigint--json)
- [Autenticação & Autorização](#autenticação--autorização)
  - [JWT (rotas primárias)](#jwt-rotas-primárias)
  - [API Key (rotas secundárias)](#api-key-rotas-secundárias)
- [Módulos & Rotas](#módulos--rotas)
  - [Auth](#auth)
  - [Users (Primary / JWT)](#users-primary--jwt)
  - [Tokens (Primary / JWT)](#tokens-primary--jwt)
  - [Imóveis (Secondary / API Key)](#imóveis-secondary--api-key)
- [Consultas SQL úteis](#consultas-sql-úteis)
- [Scripts (packagejson)](#scripts-packagejson)
- [Dicas](#dicas)
- [Licença](#licença)

---

## Stack

- **Node.js / NestJS 11**
- **Prisma 6** (dois schemas: `primary` e `secondary`)
- **PostgreSQL**
- **Swagger** (`@nestjs/swagger`)
- **JWT** (`@nestjs/jwt`, `passport-jwt`)
- **API Key** com escopos (`READ`, `WRITE`, `READ_WRITE`)
- **bcrypt** para hash de API Keys
- **class-validator / class-transformer**
- **cookie-parser**

---

## Estrutura do Projeto

```
D:.
│   .env
│   .env.example
│   .gitignore
│   .prettierrc
│   eslint.config.mjs
│   nest-cli.json
│   package.json
│   pnpm-lock.yaml
│   README.md
│   tsconfig.build.json
│   tsconfig.json
│
├───prisma
│   ├───primary
│   │       schema.prisma
│   │       seed.ts
│   │
│   └───secondary
│           schema.prisma
│
└───src
    │   app.controller.ts
    │   app.module.ts
    │   app.service.ts
    │   main.ts
    │
    ├───auth
    │   │   auth.controller.ts
    │   │   auth.module.ts
    │   │   auth.service.ts
    │   │
    │   ├───dto
    │   │       login.dto.ts
    │   │
    │   └───jwt-strategy
    │           jwt-strategy.service.ts
    │
    ├───bootstrap
    │       swagger-secondary.ts
    │
    ├───common
    │   ├───guards
    │   │   ├───api-key
    │   │   │       api-key.guard.ts
    │   │   │
    │   │   ├───decorators
    │   │   │       required-scope.decorator.ts
    │   │   │
    │   │   └───jwt-auth
    │   │           jwt-auth.guard.ts
    │   │
    │   ├───interceptors
    │   │       bigint.interceptor.ts
    │   │
    │   └───types
    │           enums.ts
    │
    ├───config
    │       cors.config.ts
    │       swagger.config.ts
    │
    ├───imoveis
    │   │   imoveis.controller.ts
    │   │   imoveis.docs.ts
    │   │   imoveis.include.ts
    │   │   imoveis.mapper.ts
    │   │   imoveis.module.ts
    │   │   imoveis.service.ts
    │   │   imoveis.where.ts
    │   │
    │   └───dto
    │       │   imovel.dto.ts
    │       │
    │       ├───create-imovel.dto
    │       │       create-imovel.dto.ts
    │       │
    │       ├───imovel-view.dto.ts
    │       │       imovel-view.dto.ts
    │       │
    │       └───list-imoveis.query
    │               list-imoveis.query.ts
    │
    ├───prisma
    │       prisma-primary.service.ts
    │       prisma-secondary.service.ts
    │       prisma.module.ts
    │
    ├───tokens
    │   │   tokens.controller.ts
    │   │   tokens.module.ts
    │   │   tokens.service.ts
    │   │
    │   └───dto
    │       ├───create-token.dto
    │       │       create-token.dto.ts
    │       │
    │       ├───list-tokens.dto
    │       │       list-tokens.query.ts
    │       │
    │       └───revoke-token.dto
    │               revoke-token.dto.ts
    │
    └───users
        │   users.controller.ts
        │   users.module.ts
        │   users.service.ts
        │
        └───dto
            │   user.dto.ts
            │
            └───list-users.query
                    list-users.query.ts
```

---

## Requisitos

- Node.js LTS
- PostgreSQL acessível para os dois schemas (PRIMARY e SECONDARY)
- PNPM

---

## Ambiente (.env)

Exemplo usado no projeto:

```ini
# App
PORT=3333
NODE_ENV=development
AUTH_COOKIE_NAME=accessToken

# JWT (rotas PRIMÁRIA)
JWT_SECRET=troque_isto
JWT_EXPIRES_IN=1d
BCRYPT_SALT_ROUNDS=10

# DBs
PRIMARY_DATABASE_URL="postgresql://dbapiservice:dbapiservice@10.0.0.120:5431/dbapiservice"
SECONDARY_DATABASE_URL="postgresql://sigapg:sigapg@10.0.0.120:5431/sigapg"

# User Default
SEED_ADMIN_EMAIL=admin@local.com
SEED_ADMIN_PASSWORD=admin
SEED_ADMIN_NAME=Admin
SEED_ADMIN_ROLE=ADMIN

# Cors 
CORS_ORIGINS=http://localhost:*
CORS_METHODS=GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS
CORS_ALLOWED_HEADERS=Content-Type,Authorization,x-api-key
CORS_EXPOSED_HEADERS=Content-Length,Content-Disposition

# Swagger
SWAGGER_SERVER_URL=http://localhost:3011
CORS_CREDENTIALS=true
CORS_MAX_AGE=86400
SWAGGER_USER=admin
SWAGGER_PASS=supersecreto

# (opcional) paginação padrão de imóveis
# IMOVEIS_PAGE_SIZE_DEFAULT=10
```

> **Nota:** As variáveis acima refletem o que foi utilizado durante o desenvolvimento aqui.
Ajuste credenciais e hosts conforme seu ambiente.

---

## Instalação & Execução

```bash
pnpm install

# desenvolvimento
pnpm run start:dev

# produção (build + start)
pnpm run build
pnpm run start:prod
```

---

## Prisma (Primary & Secondary)

- `prisma/primary/schema.prisma` – banco “aplicacional” (users, tokens, etc)
- `prisma/secondary/schema.prisma` – banco “legado”/SIGA (imóveis etc)

Geração dos clients (é automático no `postinstall`):
```bash
pnpm prisma:gen
```

Pull dos schemas a partir do banco real:
```bash
pnpm prisma:pull:primary
pnpm prisma:pull:secondary
```

Seed (primary):
```bash
pnpm seed:primary
```

Prisma Studio (primary):
```bash
pnpm prisma:studio:primary
```

---

## Swagger

Configuração central em `src/config/swagger.config.ts` + bootstrap
em `src/bootstrap/swagger-secondary.ts` (no projeto foram usados helpers).
A doc fica exposta em:

```
/docs
```

Seguranças configuradas:
- **Bearer (JWT)** – para rotas primárias protegidas por `JwtAuthGuard`
- **API Key (x-api-key)** – para rotas secundárias protegidas por `ApiKeyGuard`

> A UI do Swagger mantém autenticação (`persistAuthorization: true`).

*(Opcional)* Você pode proteger a **rota do Swagger** com Basic Auth antes de expor,
mas esse middleware não está incluído por padrão no código principal.

---

## CORS

`src/config/cors.config.ts` lê as origens/headers/métodos do `.env` e suporta regex
(ex.: `/.*\.homolog\.seudominio\.com$/`). Em desenvolvimento, se `CORS_ORIGINS` estiver vazio,
a origem é liberal.

Headers relevantes já incluídos:
- `Authorization`
- `x-api-key`

---

## BigInt → JSON

Para corrigir o erro “**Do not know how to serialize a BigInt**”, o projeto usa
um **interceptor global** `BigIntInterceptor` que converte `bigint/Decimal` para `string`
(ou `number`, conforme configuração). Habilitado em `main.ts`:

```ts
app.useGlobalInterceptors(new BigIntInterceptor('string'));
```

---

## Autenticação & Autorização

### JWT (rotas primárias)

- Guard: `JwtAuthGuard`
- Exemplo de login (`POST /auth/login`):
  ```bash
  curl -X POST http://localhost:3333/auth/login \
    -H "content-type: application/json" \
    -d '{"email":"admin@local.com","password":"admin"}'
  ```
  **Resposta (exemplo):**
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "me": { "id": "uuid", "email": "admin@local.com", "role": "ADMIN" }
  }
  ```

- O cookie `AUTH_COOKIE_NAME` também recebe o token (httpOnly).

### API Key (rotas secundárias)

- Guard: `ApiKeyGuard`
- Escopos: `READ` | `WRITE` | `READ_WRITE`
- Decorator: `@RequiredScope('READ' | 'WRITE')` em cada rota.
- **De onde a chave é lida**:
  1. Header `x-api-key` **ou** `Authorization: Bearer <key>`
  2. **Query** `?apikey=<key>` **somente em requisições GET**
     - Se `apikey` vier na URL e o método **não** for GET → **401**

Validação: `TokensService.validateKey(key, requiredScope)` compara com hash (bcrypt)
e checa o escopo através de ranking:
```
READ(1) < WRITE(2) < READ_WRITE(3)
```

Criação/Revogação de tokens (rotas primárias via JWT) está no módulo **Tokens**.

---

## Módulos & Rotas

### Auth

- `POST /auth/login` – autentica por email/senha (Primary), retorna JWT e objeto `me`.

### Users (Primary / JWT)

- Guard: `JwtAuthGuard`
- `GET /users` – lista paginada de usuários (Primary).
  - Query: `page`, `pageSize`
  - Swagger documenta exemplo de resposta paginada.

### Tokens (Primary / JWT)

- `POST /tokens` – cria API Key (hash fica no banco; a **chave real** é retornada **uma vez**).
  - Regras:
    - `USER` não pode criar para terceiros.
    - `ADMIN` pode criar para si ou para outro usuário via `userId`.
  - Body (exemplo):
    ```json
    { "scope": "READ", "expiresAt": "2030-12-31T23:59:59.000Z", "description": "chave de leitura" }
    ```
  - Resposta:
    ```json
    { "apiKey": "tok_...", "token": { "...dados do registro..." } }
    ```

- `DELETE /tokens/:id` – revoga a chave (`revokedAt` + `isActive=false`).

*(Se houver rota GET para listar tokens, ela segue o mesmo guard JWT; não está descrita aqui se não tiver sido adicionada no código.)*

### Imóveis (Secondary / API Key)

- Guard: `ApiKeyGuard` + `@RequiredScope`

#### `GET /imoveis`
Lista paginada de imóveis com “flatten” de joins.

- Query:
  - `search` (busca em `nome_proprietario` e `desc_logradouro`)
  - `page` (padrão `1`)
  - `pageSize` (padrão `10` ou `IMOVEIS_PAGE_SIZE_DEFAULT` se configurado)
  - `numg_municipio`
  - `numg_destinacao`
  - `apikey` (opcional **somente em GET**)
- Security:
  - `x-api-key: <key>` **ou** `Authorization: Bearer <key>` **ou** `?apikey=`
- Retorno:
  ```json
  {
    "meta": { "page": 1, "pageSize": 10, "total": 245 },
    "items": [ { "...ImovelViewDto" } ]
  }
  ```

**Exemplo cURL:**
```bash
curl "http://localhost:3333/imoveis?search=rua&page=1&pageSize=10" \
  -H "x-api-key: tok_XXXX"
```

#### `GET /imoveis/:id`
Busca um imóvel por `numg_imovel` (BigInt representado como **string**).

- Path: `id` (ex.: `"983"`)
- Security: igual ao `GET /imoveis`

```bash
curl "http://localhost:3333/imoveis/983" \
  -H "x-api-key: tok_XXXX"
```

#### `POST /imoveis`
Cria um imóvel + relacionamentos opcionais (projeto, vistoria, laudo).

- **Somente com escopo `WRITE`** e **chave no header** (`x-api-key` ou `Authorization: Bearer`).
- **`?apikey=` na URL é bloqueado para POST** pelo guard.

Body segue `CreateImovelDto` (campos mapeados para `ad_imovel` e tabelas relacionadas).
Campos `Decimal/BigInt` são aceitos como `string` e transformados no service.

---

## Consultas SQL úteis

- Coordenadas direto do imóvel:
  ```sql
  SELECT codg_latitude, codg_longitude
  FROM ad_imovel
  WHERE numg_imovel = 983;
  ```

- Registros relacionados por `numg_imovel` (existem nas tabelas do schema):
  - `ad_imovel_projeto` – projetos e anexos de projeto/certidão/habitese
  - `ad_imovel_vistoria` – vistorias e seus anexos
  - `ad_imovel_laudo` – laudos e seus anexos

> As colunas de latitude/longitude no schema secundário aparecem em `ad_imovel (codg_latitude, codg_longitude)` e também em `ad_servico (codg_latitude, codg_longitude)`, mas **serviços** não são imóveis.

---

## Scripts (package.json)

Principais:

- `start`, `start:dev`, `build`, `start:prod`
- `postinstall`: gera os clients Prisma (primary + secondary)
- Prisma:
  - `prisma:migrate:primary`
  - `prisma:pull:primary`
  - `prisma:deploy:primary`
  - `prisma:pull:secondary`
  - `prisma:gen:primary`
  - `prisma:gen:secondary`
  - `prisma:gen`
  - `prisma:studio:primary`
  - `seed:primary`
- Utilitários:
  - `clean`
  - `regen` (clean + generate)

> **Atenção:** corrigir o **typo** se existir `prisma//primary` no script de pull do primary:
> `prisma db pull --schema prisma/primary/schema.prisma`

---

## Dicas

- **BigInt/Decimal → string**: fica resolvido pelo `BigIntInterceptor('string')` global.
- **API Key em navegador**: permitido **somente em GET** via `?apikey=` (os demais métodos exigem header).
- **Swagger** já exibe `Authorize` com `Bearer` e `x-api-key` (config em `swagger.config.ts`).
- **Paginação default**: pode ser controlada via `IMOVEIS_PAGE_SIZE_DEFAULT` no `.env` (o service usa esse valor como fallback).
- Sempre rode `pnpm prisma:gen` após atualizar os schemas Prisma.

---

