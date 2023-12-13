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

def readJSONFile(filepath):
    with open(filepath, 'r') as file:
        data = json.load(file)
    
    return data

def handler(event, context):
    try:
        ## TODO: Remove this on deployment
        delete_table = """
            DROP TABLE IF EXISTS regions;
            DROP TABLE IF EXISTS invasive_species;
            DROP TABLE IF EXISTS alternative_species;
            DROP TABLE IF EXISTS images;
            DROP TABLE IF EXISTS save_lists;
        """

         # Execute table creation
        cursor.execute(delete_table)
        connection.commit()

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
                "region_id" uuid[],
                "alternative_species" uuid[]
            );

            CREATE TABLE IF NOT EXISTS  "alternative_species" (
                "species_id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
                "scientific_name" varchar[],
                "common_name" varchar[],
                "resource_links" varchar[],
                "species_description" text
            );

            CREATE TABLE IF NOT EXISTS "images" (
                "image_id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
                "species_id" uuid,
                "s3_key" varchar,
                "image_url" varchar,
                "description" text,
                "upload_timestampe" timestamp DEFAULT (now()),
                "license" varchar
            );

            CREATE TABLE IF NOT EXISTS  "save_lists" (
                "list_id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
                "user_uuid" varchar,
                "list_name" varchar,
                "saved_species" varchar[]
            );
        """

        relations = """
            ALTER TABLE invasive_species DROP CONSTRAINT IF EXISTS invasive_species_region_id_fkey;
            ALTER TABLE invasive_species ADD CONSTRAINT invasive_species_region_id_fkey
                FOREIGN KEY (region_id) REFERENCES regions (region_id);

            ALTER TABLE invasive_species DROP CONSTRAINT IF EXISTS invasive_species_alternative_species_fkey;
            ALTER TABLE invasive_species ADD CONSTRAINT invasive_species_alternative_species_fkey
                FOREIGN KEY (alternative_species) REFERENCES alternative_species (species_id);

            ALTER TABLE images DROP CONSTRAINT IF EXISTS images_species_id_fkey;
            ALTER TABLE images ADD CONSTRAINT images_species_id_fkey
                FOREIGN KEY (species_id) REFERENCES alternative_species (species_id)
                ON DELETE CASCADE;
        """

        # Execute table creation
        cursor.execute(sqlTableCreation)
        connection.commit()

        # Read all files
        regions = readJSONFile("initializerData/regions_tb.json")
        invasiveSpecies = readJSONFile("initializerData/invasive_species_tb.json")
        alternativeSpecies = readJSONFile("initializerData/alternative_species_tb.json")

        regionIDs = {
            "BC": [],
            "ON": []
        }
        # Add Region to regions table
        for region in regions:
            addRegion = """
                INSERT INTO regions (region_code_name, region_fullname, country_fullname, geographic_coordinate) 
                VALUES (%s, %s, %s, %s)
                RETURNING region_id;
            """
            cursor.execute(addRegion, (region["region_code_name"], region["region_fullname"], region["country_fullname"], region["geographic_coordinate"]))
            regionId = cursor.fetchone()[0]
            connection.commit()

            # Add region id into region_id dictionary
            regionIDs[region["region_code_name"]].append(regionId)

        # Add list alternative species into alternative_species table
        for altSpecies in alternativeSpecies:
            addAlternativeSpecies = """
                INSERT INTO alternative_species (scientific_name, common_name, resource_links, species_description) 
                VALUES (%s, %s, %s, %s)
                RETURNING species_id;
            """
            cursor.execute(addAlternativeSpecies, (altSpecies["scientific_name"], altSpecies["common_name"], altSpecies["resource_links"], altSpecies["species_description"]))
            altSpeciesId = cursor.fetchone()[0]
            connection.commit()

            # Load images into images table
            for image in altSpecies["image_links"]:
                addImage = """
                    INSERT INTO images (species_id, image_url) 
                    VALUES (%s, %s);
                """
                cursor.execute(addImage, (altSpeciesId, image))
                connection.commit()

        # Load invasive species into invasive_species table
        for invSpecies in invasiveSpecies:
            # Find alternative species
            alternativeSpecies_id = []
            for sci_name in invSpecies["alternative_species"]:
                alternativeSpecies_idList = """
                    SELECT species_id FROM alternative_species WHERE %s = ANY(scientific_name);
                """
                cursor.execute(alternativeSpecies_idList, (sci_name,))
                data = cursor.fetchone()
                if data is not None:
                    speciesId = data[0]
                    alternativeSpecies_id.append(speciesId)
            
            # Add invasive species into invasive_species table
            addInvasiveSpecies = """
                INSERT INTO invasive_species (scientific_name, resource_links, species_description, region_id, alternative_species) 
                VALUES (%s, %s, %s, %s, %s);
            """
            formatted_alternativeSpecies_id = "{" + ",".join(alternativeSpecies_id) + "}"
            region_uuid_array = "{" + ",".join(regionIDs[invSpecies["region_id"]]) + "}"
            cursor.execute(addInvasiveSpecies, (invSpecies["scientific_name"], invSpecies["resource_links"], invSpecies["species_description"], region_uuid_array, formatted_alternativeSpecies_id))
            connection.commit()

        # Close cursor and connection
        cursor.close()
        connection.close()

        print("Initialization completed")
    except Exception as e:
        print(e)
