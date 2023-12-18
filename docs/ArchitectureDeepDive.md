# Architecture Diagram 
This document explains the networking information for this project.

There are two main parts of the architecture: 
- [Admin Web Application](#admin-web-application)
- [Client Mobile Application](#client-mobile-application) 

![Archnitecture Diagram](./images/networkDiagram/architecture_diagram.svg)

## Admin Web Application
This part of the application is responsible for making changes to the data. It interacted with the API and hosted as a container on ECS Fargate.
1. In `A1` the admin user sends a request to a Cloudfront Distribution with caching enabled. If there is a cache hit, the CloudFront just returns that cached data. The Web Application Firewall (WAF) will ensure that general security protection is enforced, further explanation as to what is being protected could be found in the CDK stack.
2. On cache missed, Cloudfront will send a request to an Application Load Balancer (ALB), as can seen in `A2`.
3. The ALB checks the health status of the container, and if the status is healthy it forwards the request to the container which runs on Elastic Container Service (ECS), `A3`.
4. The ECS loads an image file, that contains the admin web app, from a repository in the Elastic Container Registry (ECR). The image file is then used to run on a container as an ECS task using a serverless compute engine for containers called Fargate. If a task is failed, the ECS Service will redeploy a new task.
5. Once the admin user retrieves the web app, the user needs to log in on the web app. Behind the scenes, the web app will forward the authentication to Cognito, `A4`. Upon successful authentication, a token (most specifically the JSON Web Tokens or JWT) is returned.
6. The web app then makes requests to various endpoints on the API Gateway, `A5`. Each request is passed with the JWT token that then triggers a Lambda Authorizer (or the admin Lambda Authorizer) to check if the user is in the admin user group, `B3`. Further explanation of the API Gateway can be found in the [API Interaction](#api-interaction) section.

## Client Mobile Application
The mobile application is responsible for identifying plants, determining if the plant is invasive, saving plant lists, and displaying information from both the API and Wikipedia. 
1. A user with the mobile app downloaded can sign up/in on the app or use the app as a guest. When a user signs up/in not as a guest, the mobile that runs on Flutter makes a request to the Cognito userpool, `B1`. Up load successful authentication, a token is returned by Cognito.
2. Then the app makes a request to the API Gateway on `/invasiveSpecies`, `/region`, and `/saveList` endpoints, `B2`. Only the  `/saveList` endpoint that required to pass in the token from  `B1` to API Gateway.
3. Requesting to `/saveList` endpoint triggers the Lambda Authorizer, specifically the user Lambda Authorizer as shown in `B3`. Further explanation of the API Gateway can be found in the [API Interaction](#api-interaction) section.

## API Interaction
This section assumes that the request already authenticates accordingly from the two sections above.
1. Upon successful authentication, the API Gateway will forward the request to one of the lambda integrations.
2. For requests related to RDS, the lambda integration will make a PSQL call to RDS with Postgres and return the data accordingly, `B4 -> B6`.
3. For requests that are related to loading data to S3 like plant images, the lambda integration will request for an upload link from S3, `B5 -> B7`. The client app can make a PUT request to that URL to upload an image with the image as a body.