# Architecture Diagram 
This document explains the networking information for this project.

There are two main parts of the architecture: 
- [Architecture Diagram](#architecture-diagram)
  - [Admin Web Application](#admin-web-application)
  - [Client Mobile Application](#client-mobile-application)
  - [API Interaction](#api-interaction)

![Archnitecture Diagram](./images/networkDiagram/architecture_diagram.svg)

## Admin Web Application
This part of the application is responsible for modifying the data. It interacts with the API that connects to the database and is hosted as a container on ECS Fargate.

1. In `A1`, the admin user sends a request to a Cloudfront Distribution with caching enabled. If there is a cache hit, the CloudFront returns the cached data. The Web Application Firewall (WAF) will ensure that general security protection is enforced. Further explanation on what is being protected can be found in the CDK stack.
2. On cache miss, Cloudfront will send a request to an Application Load Balancer (ALB), as seen in `A2`.
3. The ALB checks the health status of the container. If the status is healthy, it forwards the request to the container which runs on Elastic Container Service (ECS), `A3`.
4. The ECS loads an image file that contains the admin web app from a repository in the Elastic Container Registry (ECR). The image file is used to run on a container as an ECS task using Fargate, a serverless compute engine for containers. If a task fails, the ECS Service will redeploy a new task.
5. Once the admin user retrieves the web app, the user needs to log in to the web app. Behind the scenes, the web app will forward the authentication to Cognito, `A4`. Upon successful authentication, a token (JSON Web Token (JWT)) is returned.
6. The web app then makes requests to various endpoints on the API Gateway, `A5`. Each request is passed with the JWT token that will trigger a Lambda Authorizer (or the admin Lambda Authorizer) to check if the user is in the admin user group, `B3`. Further explanation of the API Gateway can be found in the [API Interaction](#api-interaction) section.

## Client Mobile Application
The mobile application is responsible for identifying plants, determining if the plant is invasive given the user's region, saving plant lists, and displaying information from both the API and Wikipedia. 

1. A mobile app user can sign up/in to the app or proceed as a guest. When a user signs up/in, the mobile app that runs on Flutter makes a request to the Cognito userpool, `B1`. Upon successful authentication, a token is returned by Cognito.
2. The app then makes a request to the API Gateway on the `/invasiveSpecies`, `/region`, and `/saveList` endpoints, `B2`. Only the  `/saveList` endpoint requires the token from  `B1` to be passed on to API Gateway.
3. A request to the `/saveList` endpoint triggers the Lambda Authorizer, specifically the user Lambda Authorizer as shown in `B3`. Further explanation of the API Gateway can be found in the [API Interaction](#api-interaction) section.

## API Interaction
This section assumes that the request already authenticates accordingly from the two sections above.
1. Upon successful authentication, the API Gateway will forward the request to one of the lambda integrations.
2. For requests related to RDS, the lambda integration will make a PostgreSQL (PSQL) call to RDS using Postgres and return the data accordingly, `B4 -> B6`.
3. For requests related to loading data to S3, such as user-uploaded plant images, the lambda integration will request an upload link from S3, `B5 -> B7`. The client app can then make a PUT request to that URL to upload an image with the image as a body.
