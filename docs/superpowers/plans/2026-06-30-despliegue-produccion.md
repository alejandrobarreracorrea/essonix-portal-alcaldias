# Despliegue a producción — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`). NOTA: las tareas marcadas **[USUARIO]** tocan la nube/cuenta (AWS, GitHub remoto, DNS) y requieren autenticación/autorización del usuario; el asistente NO las ejecuta solo — prepara los comandos y el usuario los corre o autoriza paso a paso.

**Goal:** Publicar el MVP (SPA estático ya construido) en `https://alcaldias.essionix.com`, protegido con usuario/contraseña (Basic Auth en el edge), con infra como código (Terraform) y despliegue automático (GitHub Actions/OIDC), en el repo `essonix-portal-alcaldias`.

**Architecture:** S3 privado (OAC) + CloudFront + ACM(us-east-1) + Route53; CloudFront Function (viewer-request) valida Basic Auth antes de servir; GitHub Actions con OIDC hace build + `s3 sync` + invalidación en push a `main`. Sin backend.

**Tech Stack:** Vite/React (ya existe), Terraform (AWS), CloudFront Functions (JS), GitHub Actions.

## Global Constraints

- Repo destino: `/Users/alejandro/Essionix/essonix-portal-alcaldias` → `github.com/alejandrobarreracorrea/essonix-portal-alcaldias` (ya existe, `main` con README).
- Origen del código: `~/Essionix/PlataformaAlcaldias`, rama `feat/indicadores-4-5` (contiene todo; 173 tests).
- URL/dominio: `alcaldias.essionix.com`, zona Route53 `essionix.com`, cuenta AWS perfil `essionix`.
- ACM **en us-east-1** (requisito CloudFront). S3 privado (Block Public Access ON; acceso solo vía OAC).
- Credencial Basic Auth: **fuera del repo y del bundle**, inyectada en deploy (tfvars NO versionado / GitHub Secret).
- No backend, no base de datos, no persistencia central (fuera de alcance).
- Excluir de la migración: `node_modules/`, `dist/`, `.superpowers/`.

---

### Task 1: Migrar el MVP al repo destino  [parcial USUARIO para push]

**Files:**
- Copiar a `/Users/alejandro/Essionix/essonix-portal-alcaldias/`: `src/`, `tests/`, `scripts/`, `docs/`, `index.html`, `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `tailwind.config.js`, `postcss.config.js`, `eslint.config.js` (si existe), `.gitignore`, `public/` o `favicon`/`icons` si están en raíz.

- [ ] **Step 1: Copiar el árbol del MVP (sin node_modules/dist/.superpowers/.git)**

```bash
SRC=/Users/alejandro/Essionix/PlataformaAlcaldias
DST=/Users/alejandro/Essionix/essonix-portal-alcaldias
rsync -a --exclude '.git' --exclude 'node_modules' --exclude 'dist' --exclude '.superpowers' "$SRC"/ "$DST"/
```

- [ ] **Step 2: Instalar y verificar en el repo destino**

```bash
cd /Users/alejandro/Essionix/essonix-portal-alcaldias
npm ci
npm test
npm run build
```
Expected: `npm test` → 173 passed; `npm run build` → success (aviso de chunk-size esperado).

- [ ] **Step 3: Commit en `main`**

```bash
cd /Users/alejandro/Essionix/essonix-portal-alcaldias
git add -A
git commit -m "feat: importar MVP Plataforma Alcaldías (análisis presupuestal CCPET)"
```

- [ ] **Step 4: [USUARIO] Push a GitHub** (publica en el repo privado del usuario)

```bash
git push origin main
```
Expected: el repo `essonix-portal-alcaldias` queda con todo el código.

---

### Task 2: Terraform — S3 + CloudFront + OAC + Basic Auth + ACM + Route53 + OIDC

**Files (crear en el repo destino):**
- `infra/versions.tf`, `infra/variables.tf`, `infra/s3.tf`, `infra/cloudfront.tf`, `infra/acm.tf`, `infra/route53.tf`, `infra/oidc.tf`, `infra/outputs.tf`, `infra/functions/basic-auth.js.tftpl`, `infra/terraform.tfvars.example`, y añadir `infra/.terraform*`, `infra/*.tfvars`, `infra/.terraform.lock.hcl` (mantener lock) al `.gitignore` salvo el `.example`.

- [ ] **Step 1: `infra/versions.tf` (providers; ACM en us-east-1)**

```hcl
terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
  # Estado local para el primer apply. Para migrar al backend S3 de Essionix,
  # añadir aquí un bloque backend "s3" {...} y `terraform init -migrate-state`.
}
provider "aws" {
  region  = "us-east-1"
  profile = var.aws_profile
}
```
(Una sola región us-east-1 simplifica: bucket y ACM en la misma región; ACM us-east-1 es obligatorio para CloudFront.)

- [ ] **Step 2: `infra/variables.tf`**

```hcl
variable "aws_profile" { type = string, default = "essionix" }
variable "dominio"     { type = string, default = "alcaldias.essionix.com" }
variable "zona_raiz"   { type = string, default = "essionix.com" }
variable "bucket_name" { type = string, default = "essonix-portal-alcaldias" }
variable "github_repo" { type = string, default = "alejandrobarreracorrea/essonix-portal-alcaldias" }
# Base64 de "usuario:clave" para Basic Auth. NO versionar; pasar por tfvars o -var.
variable "basic_auth_b64" { type = string, sensitive = true }
```

- [ ] **Step 3: `infra/s3.tf` (bucket privado + OAC)**

```hcl
resource "aws_s3_bucket" "site" { bucket = var.bucket_name }

resource "aws_s3_bucket_public_access_block" "site" {
  bucket                  = aws_s3_bucket.site.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudfront_origin_access_control" "site" {
  name                              = "${var.bucket_name}-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

data "aws_iam_policy_document" "site" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.site.arn}/*"]
    principals { type = "Service", identifiers = ["cloudfront.amazonaws.com"] }
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.site.arn]
    }
  }
}
resource "aws_s3_bucket_policy" "site" {
  bucket = aws_s3_bucket.site.id
  policy = data.aws_iam_policy_document.site.json
}
```

- [ ] **Step 4: `infra/functions/basic-auth.js.tftpl` + función**

`infra/functions/basic-auth.js.tftpl`:
```js
function handler(event) {
  var request = event.request;
  var auth = request.headers.authorization;
  var expected = "Basic ${basic_auth_b64}";
  if (!auth || auth.value !== expected) {
    return {
      statusCode: 401,
      statusDescription: "Unauthorized",
      headers: { "www-authenticate": { value: "Basic realm=\"Plataforma Alcaldias\"" } }
    };
  }
  return request;
}
```
En `infra/cloudfront.tf`:
```hcl
resource "aws_cloudfront_function" "basic_auth" {
  name    = "${var.bucket_name}-basic-auth"
  runtime = "cloudfront-js-2.0"
  code    = templatefile("${path.module}/functions/basic-auth.js.tftpl", { basic_auth_b64 = var.basic_auth_b64 })
}
```

- [ ] **Step 5: `infra/cloudfront.tf` (distribución)**

```hcl
resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  default_root_object = "index.html"
  aliases             = [var.dominio]

  origin {
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_id                = "s3-site"
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }

  default_cache_behavior {
    target_origin_id       = "s3-site"
    viewer_protocol_policy  = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    cache_policy_id        = "658327ea-f89d-4fab-a63d-7e88639e58f6" # Managed-CachingOptimized
    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.basic_auth.arn
    }
  }

  # SPA de una sola ruta; fallback robusto por si se piden paths inexistentes
  custom_error_response { error_code = 403, response_code = 200, response_page_path = "/index.html" }
  custom_error_response { error_code = 404, response_code = 200, response_page_path = "/index.html" }

  restrictions { geo_restriction { restriction_type = "none" } }
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.site.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}
```

- [ ] **Step 6: `infra/acm.tf` + `infra/route53.tf` (cert DNS-validado + alias)**

```hcl
# acm.tf
resource "aws_acm_certificate" "site" {
  domain_name       = var.dominio
  validation_method = "DNS"
  lifecycle { create_before_destroy = true }
}
resource "aws_acm_certificate_validation" "site" {
  certificate_arn         = aws_acm_certificate.site.arn
  validation_record_fqdns = [for r in aws_route53_record.cert : r.fqdn]
}
```
```hcl
# route53.tf
data "aws_route53_zone" "raiz" { name = "${var.zona_raiz}." }

resource "aws_route53_record" "cert" {
  for_each = {
    for dvo in aws_acm_certificate.site.domain_validation_options :
    dvo.domain_name => { name = dvo.resource_record_name, type = dvo.resource_record_type, record = dvo.resource_record_value }
  }
  zone_id = data.aws_route53_zone.raiz.zone_id
  name    = each.value.name
  type    = each.value.type
  records = [each.value.record]
  ttl     = 60
  allow_overwrite = true
}

resource "aws_route53_record" "alias" {
  zone_id = data.aws_route53_zone.raiz.zone_id
  name    = var.dominio
  type    = "A"
  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}
```

- [ ] **Step 7: `infra/oidc.tf` (rol para GitHub Actions)**

```hcl
data "aws_caller_identity" "me" {}

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

data "aws_iam_policy_document" "trust" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals { type = "Federated", identifiers = [aws_iam_openid_connect_provider.github.arn] }
    condition { test = "StringEquals", variable = "token.actions.githubusercontent.com:aud", values = ["sts.amazonaws.com"] }
    condition { test = "StringLike", variable = "token.actions.githubusercontent.com:sub", values = ["repo:${var.github_repo}:ref:refs/heads/main"] }
  }
}
resource "aws_iam_role" "deploy" {
  name               = "${var.bucket_name}-gha-deploy"
  assume_role_policy = data.aws_iam_policy_document.trust.json
}
data "aws_iam_policy_document" "deploy" {
  statement { actions = ["s3:ListBucket"], resources = [aws_s3_bucket.site.arn] }
  statement { actions = ["s3:PutObject","s3:DeleteObject","s3:GetObject"], resources = ["${aws_s3_bucket.site.arn}/*"] }
  statement { actions = ["cloudfront:CreateInvalidation"], resources = [aws_cloudfront_distribution.site.arn] }
}
resource "aws_iam_role_policy" "deploy" {
  role   = aws_iam_role.deploy.id
  policy = data.aws_iam_policy_document.deploy.json
}
```

- [ ] **Step 8: `infra/outputs.tf` + `terraform.tfvars.example`**

```hcl
output "bucket_name"      { value = aws_s3_bucket.site.id }
output "distribution_id"  { value = aws_cloudfront_distribution.site.id }
output "deploy_role_arn"  { value = aws_iam_role.deploy.arn }
output "url"              { value = "https://${var.dominio}" }
```
`infra/terraform.tfvars.example`:
```hcl
# Copiar a terraform.tfvars (NO versionar) y poner el base64 de "usuario:clave":
#   printf 'usuario:CLAVE' | base64
basic_auth_b64 = "dXN1YXJpbzpDTEFWRQ=="
```
`.gitignore` (añadir): `infra/.terraform/`, `infra/*.tfvars`, `infra/*.tfstate*`.

- [ ] **Step 9: Validación estática (sin tocar la nube)**

```bash
cd /Users/alejandro/Essionix/essonix-portal-alcaldias/infra
terraform init -backend=false
terraform fmt -check
terraform validate
```
Expected: `Success! The configuration is valid.`

- [ ] **Step 10: Commit**

```bash
cd /Users/alejandro/Essionix/essonix-portal-alcaldias
git add infra .gitignore
git commit -m "feat(infra): terraform S3+CloudFront+BasicAuth+ACM+Route53+OIDC"
```

---

### Task 3: GitHub Actions (CI + deploy con OIDC)

**Files:** crear `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`.

- [ ] **Step 1: `.github/workflows/ci.yml` (en PR)**

```yaml
name: CI
on: { pull_request: { branches: [main] } }
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm test
      - run: npm run build
```

- [ ] **Step 2: `.github/workflows/deploy.yml` (push a main, OIDC)**

```yaml
name: Deploy
on: { push: { branches: [main] } }
permissions: { id-token: write, contents: read }
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
          aws-region: us-east-1
      - run: aws s3 sync dist/ "s3://${{ secrets.S3_BUCKET }}" --delete
      - run: aws cloudfront create-invalidation --distribution-id "${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }}" --paths "/*"
```

- [ ] **Step 3: Verificar sintaxis YAML (lint local) y commit**

```bash
cd /Users/alejandro/Essionix/essonix-portal-alcaldias
python3 -c "import yaml,sys; [yaml.safe_load(open(f)) for f in ['.github/workflows/ci.yml','.github/workflows/deploy.yml']]; print('YAML ok')"
git add .github/workflows
git commit -m "ci: workflows CI y deploy (OIDC) a S3+CloudFront"
```

---

### Task 4: [USUARIO] Provisionar la nube y primer despliegue

(Estos pasos requieren autenticación AWS del usuario y crean recursos reales / DNS. El asistente prepara los comandos; el usuario los ejecuta o autoriza uno a uno.)

- [ ] **Step 1: Autenticar AWS** (perfil `essionix`)

```bash
aws sts get-caller-identity --profile essionix   # confirmar cuenta correcta
```

- [ ] **Step 2: Crear `infra/terraform.tfvars` con la credencial Basic Auth (NO versionar)**

```bash
cd /Users/alejandro/Essionix/essonix-portal-alcaldias/infra
printf 'usuario:CLAVE_SEGURA' | base64   # copiar el resultado
# editar terraform.tfvars → basic_auth_b64 = "<resultado>"
```

- [ ] **Step 3: `terraform apply`** (crea S3, CloudFront, ACM, Route53, rol OIDC)

```bash
cd /Users/alejandro/Essionix/essonix-portal-alcaldias/infra
terraform init
terraform apply
# anotar outputs: bucket_name, distribution_id, deploy_role_arn, url
```
Expected: cert validado por DNS (puede tardar minutos), distribución creada.

- [ ] **Step 4: Cargar los secrets del repo en GitHub** (para el workflow)

```bash
gh secret set AWS_DEPLOY_ROLE_ARN --repo alejandrobarreracorrea/essonix-portal-alcaldias --body "<deploy_role_arn>"
gh secret set S3_BUCKET --repo alejandrobarreracorrea/essonix-portal-alcaldias --body "<bucket_name>"
gh secret set CLOUDFRONT_DISTRIBUTION_ID --repo alejandrobarreracorrea/essonix-portal-alcaldias --body "<distribution_id>"
```

- [ ] **Step 5: Disparar el deploy** (push vacío o re-run)

```bash
cd /Users/alejandro/Essionix/essonix-portal-alcaldias
git commit --allow-empty -m "chore: trigger deploy" && git push
# o: gh workflow run Deploy
```

- [ ] **Step 6: Verificar producción**

```bash
curl -sI https://alcaldias.essionix.com | head -1          # Expected: HTTP/2 401 (pide credencial)
curl -sI -u 'usuario:CLAVE_SEGURA' https://alcaldias.essionix.com | head -1   # Expected: HTTP/2 200
```
Y en el navegador: abrir la URL → prompt de usuario/clave → la app carga; subir insumos de Briceño y verificar el análisis + el Informe.

---

## Self-Review

**Cobertura del spec:**
- Migración del MVP (snapshot limpio) → Task 1. ✓
- S3 privado + OAC, CloudFront, ACM us-east-1, Route53 → Task 2. ✓
- Basic Auth en CloudFront Function, credencial fuera del repo/bundle (tfvars/secret) → Task 2 (steps 4, 8) + Task 4 (step 2). ✓
- CI/CD GitHub Actions OIDC (build+test+sync+invalidation) → Task 3 + rol OIDC en Task 2. ✓
- Dominio alcaldias.essionix.com → variables Task 2 + Route53 alias. ✓
- Acciones que requieren al usuario (AWS auth, apply, secrets, DNS) → Task 4 [USUARIO]. ✓
- Criterios de aceptación (401 sin credencial, 200 con credencial, redeploy en push) → Task 4 step 6. ✓

**Placeholders:** los `<deploy_role_arn>`/`<bucket_name>`/`<distribution_id>`/`CLAVE_SEGURA` son valores que produce `terraform apply` / define el usuario en runtime (no son placeholders de código sin resolver). El thumbprint de OIDC y el cache policy id son IDs reales/managed de AWS.

**Consistencia:** nombres `bucket_name`/`distribution_id`/`deploy_role_arn` coinciden entre outputs (Task 2), secrets (Task 4 step 4) y workflow (Task 3 step 2: `S3_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`, `AWS_DEPLOY_ROLE_ARN`). La función Basic Auth usa `var.basic_auth_b64` definido en variables y provisto por tfvars (Task 4 step 2).

**Notas:** estado Terraform local en el primer apply (migrable a backend S3 después). Región única us-east-1 (válida para ACM de CloudFront). Si renombran el repo a `essionix-...`, actualizar `var.github_repo` y la URL del remoto antes del deploy.
