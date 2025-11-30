terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

# VPC, EKS, RDS, S3 skeleton modules (fill in real modules later)
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  name   = var.name
  cidr   = var.vpc_cidr
  azs    = var.azs
  public_subnets  = var.public_subnets
  private_subnets = var.private_subnets
}

module "eks" {
  source          = "terraform-aws-modules/eks/aws"
  cluster_name    = "${var.name}-eks"
  cluster_version = var.eks_version
  subnet_ids      = module.vpc.private_subnets
}

module "rds" {
  source            = "terraform-aws-modules/rds/aws"
  identifier        = "${var.name}-db"
  engine            = "postgres"
  engine_version    = var.postgres_version
  instance_class    = var.db_instance_class
  allocated_storage = var.db_storage_gb
  username          = var.db_username
  password          = var.db_password
  publicly_accessible = false
  subnet_ids        = module.vpc.private_subnets
}

resource "aws_s3_bucket" "artifacts" {
  bucket = var.artifacts_bucket
}

resource "aws_s3_bucket_versioning" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id
  versioning_configuration { status = "Enabled" }
}

output "cluster_name" { value = module.eks.cluster_name }
output "cluster_endpoint" { value = module.eks.cluster_endpoint }
output "cluster_ca_certificate" { value = module.eks.cluster_certificate_authority_data }
output "artifacts_bucket" { value = aws_s3_bucket.artifacts.id }
