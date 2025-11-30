# AWS Terraform Skeleton

This is a minimal skeleton to provision core infra (VPC, EKS, RDS, S3). Replace defaults and plug real modules/values.

## Usage
1. Create `terraform.tfvars`:
```hcl
name = "ixone"
region = "us-east-1"
artifacts_bucket = "ixone-artifacts-prod"
db_username = "ixone"
db_password = "VAULT:secret/data/db#password"
```
2. Init & plan:
```bash
terraform init
terraform plan -var-file=terraform.tfvars
```
3. Apply:
```bash
terraform apply -var-file=terraform.tfvars
```

Outputs provide cluster endpoint and CA, plus bucket name and DB endpoint.
