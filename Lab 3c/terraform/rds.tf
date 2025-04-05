resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "lab-rds-subnet-group"
  subnet_ids = data.aws_subnets.default.ids
  tags       = var.tags
}

resource "aws_security_group" "rds_sg" {
  name        = "lab-rds-sg"
  description = "Allow access to RDS from ECS tasks and local machine"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = var.tags
}

resource "aws_db_instance" "tododb" {
  allocated_storage      = 20
  engine                 = "postgres"
  engine_version         = "15.7"  # (or your supported version)
  instance_class         = "db.t3.micro"
  db_name                = var.db_name
  username               = var.db_username  # now "dbadmin" instead of "admin"
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  publicly_accessible    = true
  skip_final_snapshot    = true

  tags = merge(var.tags, { Name = "lab-tododb" })
}

resource "null_resource" "db_schema" {
  provisioner "local-exec" {
    command = <<EOT
echo "Applying DB schema..."
PGPASSWORD=${var.db_password} psql -h ${aws_db_instance.tododb.address} -U ${var.db_username} -d ${var.db_name} -c "CREATE TABLE IF NOT EXISTS todos (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    task TEXT NOT NULL,
    is_complete BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);"
EOT
  }

  depends_on = [aws_db_instance.tododb]
}
