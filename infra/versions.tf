terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
  # Backend remoto S3 de Essionix. bucket/key/region se inyectan desde el
  # workflow con -backend-config (ver .github/workflows/deploy.yml).
  backend "s3" {}
}
provider "aws" {
  region = "us-east-1"
}
