#!/bin/bash
# Ensure that psql is installed and available in your PATH.
PGPASSWORD=$1 psql -h $2 -U $3 -d $4 -f db_schema.sql
