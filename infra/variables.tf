variable "aws_profile" {
  type    = string
  default = "essionix"
}
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
variable "github_repo" {
  type    = string
  default = "alejandrobarreracorrea/essonix-portal-alcaldias"
}
# Base64 de "usuario:clave" para Basic Auth. NO versionar; pasar por tfvars o -var.
variable "basic_auth_b64" {
  type      = string
  sensitive = true
}
