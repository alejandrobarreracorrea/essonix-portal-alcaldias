# Despliegue a producción — Plataforma Alcaldías

URL final: **https://alcaldias.essionix.com** (HTTPS + Basic Auth).
Arquitectura: S3 privado (OAC) → CloudFront (Basic Auth en el edge) ; ACM (us-east-1) + Route53 ; deploy automático por GitHub Actions (OIDC).

La infraestructura (Terraform) y los workflows ya están en el repo. Estos son los pasos que **debes ejecutar tú** (requieren tus credenciales de AWS y permisos sobre el repo). Pégalos en tu terminal con `! <comando>` si quieres que la salida quede en esta sesión.

---

## 1. Autenticación AWS (perfil `essionix`)

```bash
aws sts get-caller-identity --profile essionix      # debe responder con la cuenta Essionix
aws route53 list-hosted-zones --profile essionix --query "HostedZones[?Name=='essionix.com.']"
```
La segunda debe devolver la zona `essionix.com` (Terraform creará el registro `alcaldias` dentro de ella). Si no aparece, la zona no está en esta cuenta → avísame.

## 2. Definir la credencial de Basic Auth

Elige usuario y clave para el acceso compartido y genera el base64:

```bash
printf 'USUARIO:CLAVE' | base64        # reemplaza USUARIO y CLAVE
```

Crea `infra/terraform.tfvars` (NO se versiona — `.gitignore` lo excluye) con el resultado:

```hcl
basic_auth_b64 = "PEGA_AQUI_EL_BASE64"
```

Las demás variables ya tienen default correcto (dominio `alcaldias.essionix.com`, zona `essionix.com`, bucket `essonix-portal-alcaldias`, repo OIDC). Solo `basic_auth_b64` es obligatoria.

## 3. Crear la infraestructura

```bash
cd infra
terraform init
terraform apply        # revisa el plan y confirma con "yes"
```
> La validación del certificado ACM por DNS puede tardar varios minutos (Terraform espera). El estado es **local** (`infra/terraform.tfstate`) — no lo borres; para moverlo al backend S3 de Essionix más adelante, ver nota en `infra/versions.tf`.

Al terminar, lee los outputs:

```bash
terraform output           # bucket_name, distribution_id, deploy_role_arn, url
```

## 4. Configurar los secrets del repo en GitHub

Con los outputs anteriores (necesitas `gh auth login` una vez, o hazlo por la web del repo → Settings → Secrets and variables → Actions):

```bash
cd ..
gh secret set AWS_DEPLOY_ROLE_ARN        --body "$(cd infra && terraform output -raw deploy_role_arn)"
gh secret set S3_BUCKET                  --body "$(cd infra && terraform output -raw bucket_name)"
gh secret set CLOUDFRONT_DISTRIBUTION_ID --body "$(cd infra && terraform output -raw distribution_id)"
```

## 5. Primer despliegue

El workflow `deploy.yml` se dispara con cada push a `main` (corre tests → build → `s3 sync` → invalidación). Para lanzar el primero sin cambios de código:

```bash
git commit --allow-empty -m "chore: primer despliegue" && git push
```
Sigue la ejecución en la pestaña **Actions** del repo (o `gh run watch`).

## 6. Verificación

- Abre **https://alcaldias.essionix.com** → el navegador debe pedir **usuario/contraseña** (los del paso 2). Sin credencial válida: 401, no se entrega nada.
- Tras autenticarte, la app carga igual que en local: subir los 3 insumos → análisis + informe.
- Comprueba que el bucket S3 **no** es accesible directo (sin CloudFront): `curl https://<bucket>.s3.amazonaws.com/index.html` debe dar AccessDenied.

---

### Notas
- Cambiar la credencial luego: actualiza `basic_auth_b64` en `terraform.tfvars` y `terraform apply` (re-publica la CloudFront Function). No requiere redeploy de la app.
- El nombre del repo es `essonix` (sin la 2ª "i"); si lo renombras en GitHub, actualiza `var.github_repo` en Terraform antes del siguiente apply (el trust OIDC lo referencia).
