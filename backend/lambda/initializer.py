import os
import json
import boto3
import psycopg2

DB_SECRET_NAME = os.environ["DB_SECRET_NAME"]

def getDbSecret():
    # secretsmanager client to get db credentials
    sm_client = boto3.client("secretsmanager")
    response = sm_client.get_secret_value(
        SecretId=DB_SECRET_NAME)["SecretString"]
    secret = json.loads(response)
    return secret

dbSecret = getDbSecret()

connection = psycopg2.connect(
    user=dbSecret["username"],
    password=dbSecret["password"],
    host=dbSecret["host"],
    dbname=dbSecret["dbname"]
)

cursor = connection.cursor()

def handler(event, context):
    # Created 4 tables based on the schema
    sqlTableCreation = """
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

        CREATE TABLE IF NOT EXISTS "regions" (
            "region_id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
            "region_code_name" varchar,
            "region_fullname" varchar,
            "country_fullname" varchar,
            "geographic_coordinate" varchar
        );

        CREATE TABLE IF NOT EXISTS "invasive_species" (
            "species_id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
            "scientific_name" varchar[],
            "resource_links" varchar[],
            "species_description" text,
            "region_id" varchar[],
            "alternative_species" varchar[]
        );

        CREATE TABLE IF NOT EXISTS  "alternative_species" (
            "species_id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
            "scientific_name" varchar[],
            "common_name" varchar[],
            "resource_links" varchar[],
            "image_links" varchar[],
            "species_description" text
        );

        CREATE TABLE IF NOT EXISTS  "save_lists" (
            "list_id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
            "user_uuid" varchar,
            "list_name" varchar,
            "saved_species" varchar[]
        );
    """

    # Execute table creation
    cursor.execute(sqlTableCreation)
    connection.commit()

    # # Testing 
    # # Execute a query to retrieve all table names in the default 'public' schema
    # cursor.execute("""
    #     SELECT table_name
    #     FROM information_schema.tables
    #     WHERE table_schema = 'public'
    #     AND table_type = 'BASE TABLE';
    # """)

    # # Fetch all results
    # tables = cursor.fetchall()

    # # Print the names of the tables
    # for table in tables:
    #     print(table[0])

    # addRegion = """
    #     INSERT INTO regions (region_code_name, region_fullname, country_fullname, geographic_coordinate) 
    #     VALUES ('BC', 'British Columbia', 'Canada', 'POINT(3 4)')
    #     RETURNING region_id;
    # """
    # cursor.execute(addRegion)
    # insertId = cursor.fetchone()[0]
    # connection.commit()

    # print("region insertion id: ", insertId)

    # Close cursor and connection
    cursor.close()
    connection.close()

    print("Initialization completed")
