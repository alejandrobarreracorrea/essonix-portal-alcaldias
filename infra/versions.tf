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
