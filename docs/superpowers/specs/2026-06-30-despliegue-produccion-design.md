# Diseño — Despliegue a producción (Plataforma Alcaldías)

- **Fecha:** 2026-06-30
- **Estado:** Aprobado para escribir plan de implementación
- **Repo destino:** `/Users/alejandro/Essionix/essonix-portal-alcaldias` → `github.com/alejandrobarreracorrea/essonix-portal-alcaldias` (privado/personal, ya creado con README + Initial commit en `main`)
- **URL:** `https://alcaldias.essionix.com`

## 1. Propósito

Llevar a producción el MVP (SPA React 100% cliente, ya construido y validado a tolerancia 0) para que el cliente lo use desde una URL con HTTPS, protegido por usuario/contraseña. Infra como código (Terraform) y despliegue automático (GitHub Actions). No se introduce backend: la app sigue siendo estática; el cálculo corre en el navegador y los datos no salen del equipo del usuario.

## 2. Decisiones (acordadas)

| Decisión | Resolución |
|---|---|
| Hosting | **S3 privado + CloudFront (OAC)** — SPA estático |
| HTTPS + dominio | **ACM (us-east-1) + Route53**, subdominio `alcaldias.essionix.com` (zona `essionix.com`) |
| Acceso | **HTTP Basic Auth** (1 credencial compartida) validada en el **edge** (CloudFront Function), credencial fuera del bundle y fuera del repo |
| IaC | **Terraform** (cuenta AWS Essionix), reusando el patrón de los otros portales |
| CI/CD | **GitHub Actions con OIDC** (sin llaves AWS en el repo): build + `s3 sync` + invalidación de CloudFront en push a `main` |
| Repo | `essonix-portal-alcaldias` (ya existe en GitHub); se migra todo el código del MVP a `main` |
| Fuera de alcance | backend, base de datos, persistencia central, multi-usuario con proveedor de identidad, multi-municipio |

## 3. Origen del código (migración)

El código vive hoy en `~/Essionix/PlataformaAlcaldias`, rama `feat/indicadores-4-5` (la punta de la pila de 11 ramas; **contiene todo**: 5 áreas tol-0 + sectores + traslados + indicadores 1/4/5 + rediseño + Informe v2, 173 tests). Se migra un **snapshot limpio** (no las 11 ramas) al repo destino:

- Copiar: `src/`, `tests/`, `scripts/`, `docs/` (specs, plans, PENDIENTES, DESIGN_SYSTEM), `index.html`, `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig*.json`, `tailwind.config.js`, `postcss.config.js`, `.gitignore`, `eslint`/config si aplica.
- Excluir: `node_modules/`, `dist/`, `.superpowers/` (scratch de ejecución).
- Commit en `main` del repo destino: "feat: importar MVP Plataforma Alcaldías". Verificar `npm ci && npm test && npm run build` en el repo nuevo (173 tests verdes, build limpio).

## 4. Arquitectura de despliegue

```
Usuario (HTTPS) ──► CloudFront
                      │  viewer-request: CloudFront Function (Basic Auth)
                      │     · si credencial inválida → 401 (no entrega nada)
                      ▼  si válida
                    S3 privado (OAC, sin acceso público)
                      └─ dist/ (index.html, assets/*.js, *.css, iconos)
ACM (us-east-1) = certificado HTTPS · Route53 = alias A/AAAA → CloudFront
```

- **S3:** bucket privado, *Block Public Access* activo; acceso solo desde CloudFront vía **OAC** (Origin Access Control). Sin S3 website hosting.
- **CloudFront:** default root object `index.html`; compresión activada; política de caché para assets con hash (largo) e `index.html` sin caché o corto. (No requiere SPA-fallback: la app es una sola ruta; aun así se puede mapear 403/404 → `/index.html` para robustez.)
- **ACM:** certificado para `alcaldias.essionix.com` en **us-east-1** (requisito de CloudFront), validado por DNS (registros en Route53).
- **Route53:** registro alias `alcaldias.essionix.com` → distribución CloudFront.

## 5. Autenticación (Basic Auth en el edge)

- **CloudFront Function** asociada al evento *viewer-request* que:
  - lee el header `Authorization`; si no coincide con `Basic base64("usuario:clave")`, responde **401** con `WWW-Authenticate: Basic` (el navegador muestra el prompt).
  - si coincide, deja pasar la petición a S3.
- **Gestión de la credencial:** el valor (base64 de `usuario:clave`) se inyecta en el despliegue como **variable de Terraform** alimentada por un **GitHub Secret** (o `terraform.tfvars` local NO versionado). **No** se commitea ni va en el bundle. Visible solo para admins de AWS, nunca para visitantes.
- Suficiente como gate compartido de MVP; migrable a Cognito/Clerk (usuarios individuales) si luego se requiere — fuera de alcance ahora.

## 6. Infra como código (Terraform)

- Carpeta `infra/` en el repo. Recursos: bucket S3 (+ política OAC), CloudFront Function (Basic Auth), distribución CloudFront, ACM cert (us-east-1) + validación Route53, registro Route53, rol IAM de despliegue para **GitHub OIDC**.
- **Estado de Terraform:** backend **S3** en la cuenta Essionix (mismo patrón que tus otros proyectos), con DynamoDB lock si aplica. (Alternativa MVP: estado local — a confirmar; se recomienda S3.)
- **Provider:** AWS, perfil `essionix`; un provider extra en `us-east-1` para el ACM de CloudFront.

## 7. CI/CD (GitHub Actions, OIDC)

- Workflow `deploy.yml`: en push a `main` →
  1. `npm ci`
  2. `npm test` (gate: si fallan, no despliega)
  3. `npm run build`
  4. `aws s3 sync dist/ s3://<bucket> --delete` (asumiendo rol vía **OIDC**, sin llaves guardadas)
  5. `aws cloudfront create-invalidation --paths "/*"`
- Workflow `ci.yml` (en PR): `npm ci && npm test && npm run build` (sin desplegar).
- `terraform plan/apply`: workflow aparte **manual** (`workflow_dispatch`) o ejecutado localmente con el perfil `essionix` (no auto-apply de infra en cada push).

## 8. Lo que requiere acción/autorización del usuario (no lo puede hacer el asistente solo)

- **Autenticación AWS** (perfil `essionix`) para `terraform apply` y el primer deploy — el usuario la corre o autoriza paso a paso (acciones sobre su infra).
- **Definir la credencial** Basic Auth (usuario/clave) y cargarla como GitHub Secret / tfvars.
- Confirmar que la **zona Route53 `essionix.com`** está en esa cuenta.
- Configurar el **rol IAM OIDC** (lo crea Terraform) y los **secrets** del repo (rol ARN, bucket, distribution id si no se leen de TF outputs).

## 9. Criterios de aceptación

- `https://alcaldias.essionix.com` carga la app **con HTTPS** y pide **usuario/contraseña** (Basic Auth) antes de mostrar nada.
- Tras autenticarse, la app funciona igual que en local (cargar insumos → análisis e informe).
- Push a `main` redepliega automáticamente (build + sync + invalidación) tras pasar los tests.
- La infra es reproducible con `terraform apply`; la credencial no está en el repo ni en el bundle.
- El bucket S3 es privado (sin acceso público directo).

## 10. Riesgos / notas

- ACM debe estar en **us-east-1** o CloudFront no lo acepta.
- Propagación de DNS/validación ACM puede tardar minutos.
- Nombre del repo es `essonix` (sin la 2ª "i"); si se quiere alinear con `essionix-portal-*`, renombrar en GitHub antes del primer deploy.
- Basic Auth = una sola credencial compartida; no hay gestión de usuarios ni expiración (aceptado para el MVP).
