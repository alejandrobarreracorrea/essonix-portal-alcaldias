variable "dominio" {
  type    = string
  default = "alcaldias.essionix.com"
}
variable "zona_raiz" {
  type    = string
  default = "essionix.com"
}
variable "bucket_name" {
  type    = string
  default = "essonix-portal-alcaldias"
}
# Base64 de "usuario:clave" para Basic Auth. Se inyecta desde el workflow con
# TF_VAR_basic_auth_b64 (GitHub Secret BASIC_AUTH_B64). NO versionar.
variable "basic_auth_b64" {
  type      = string
  sensitive = true
}
