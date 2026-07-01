# Despliegue a producción — Plataforma Alcaldías

URL final: **https://alcaldias.essionix.com** (HTTPS + Basic Auth).
Arquitectura: S3 privado (OAC) → CloudFront (Basic Auth en el edge) ; ACM (us-east-1) + Route53 ; **todo desde el pipeline** (GitHub Actions).

## Cómo funciona (100% pipeline, sin pasos locales)

Cada push a `main` (o *Run workflow* manual) dispara `.github/workflows/deploy.yml`, que:

1. **Job `infra`** — asume por **OIDC** el rol compartido de Essionix
   `arn:aws:iam::484005000536:role/essionix-role-pdn-us-east-1-oidc` (el mismo que usan
   los otros portales), corre **Terraform** con backend remoto S3
   (`essionix-s3-pdn-us-east-1-remotestates`, key `essonix-portal-alcaldias/pdn/terraform.tfstate`)
   y aplica la infra (S3 privado+OAC, CloudFront + función Basic Auth, ACM, Route53).
   La credencial Basic Auth entra como `TF_VAR_basic_auth_b64` desde el secret `BASIC_AUTH_B64`.
2. **Job `deploy`** — `npm ci` → `npm test` (gate) → `npm run build` → `aws s3 sync dist/` →
   invalidación de CloudFront. Lee bucket y distribution id de los outputs de Terraform.

No hay llaves AWS de larga vida ni estado local. `ci.yml` corre tests+build en cada PR.

## Configuración (ya hecha)

- **Secret `BASIC_AUTH_B64`** = base64 de `alcaldia2026:alcaldia2026` → ya está en el repo.
  Para cambiar la credencial: `printf 'USUARIO:CLAVE' | base64` y luego
  `gh secret set BASIC_AUTH_B64` con el nuevo valor; el siguiente deploy la aplica.
- El rol OIDC y el bucket de estado ya existen en la cuenta Essionix (compartidos).

## Verificación tras el primer deploy

- Sigue la corrida en la pestaña **Actions** del repo (o `gh run watch`). El primer
  `terraform apply` tarda unos minutos en la validación DNS del certificado ACM.
- Abre **https://alcaldias.essionix.com** → debe pedir usuario/contraseña (`alcaldia2026`).
- El bucket S3 no es accesible directo: `curl https://<bucket>.s3.amazonaws.com/index.html` → AccessDenied.

## Notas

- El rol OIDC compartido debe tener permisos para CloudFront Functions (`cloudfront:CreateFunction`,
  `PublishFunction`, `UpdateFunction`) además de S3/CloudFront/ACM/Route53. Si el primer apply falla
  por permisos de función, hay que ampliar la policy del rol.
- Nombre del repo: `essonix-portal-alcaldias` (sin 2ª "i"). La key del estado remoto usa ese nombre.
