output "vpc_id" { value = module.vpc.vpc_id }
output "private_subnets" { value = module.vpc.private_subnets }
output "public_subnets" { value = module.vpc.public_subnets }
output "db_endpoint" { value = module.rds.db_instance_address }
output "db_port" { value = module.rds.db_instance_port }
