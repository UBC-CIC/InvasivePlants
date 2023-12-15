# Architecture Diagram 
This document explains the networking information for this project.

There are two main parts of the architecture: 
- [Admin Web Application](#admin-web-application)
- [Client Mobile Application](#client-mobile-application) 

![Archnitecture Diagram](./images/networkDiagram/architecture_diagram.svg)

## Admin Web Application
This part of the application is responsible for making changes on the data. It interacted with the api and hosted as a container on ECS Fargate.
1. In `A1` the admin user send request to a Cloudfront Distribution with caching enabled. If there is a cache hit, the Cloudfront just return that cached data. The Web Application Firewall (WAF) will ensure the general security protection is enforeced, further explain as to what is being protect could be found in the CDK stack.
2. On cache missed, Cloudfront will send request to an Application Load Balancer (ALB), as can seen in `A2`.
3. The ALB checks the health status of the container, and if the status is healthy it forward the request to the container which runs on Elastic Container Service (ECS), `A3`.
4. The ECS loads an image file, that contains the admin web app, from a repository in Elastic Container Registry (ECR). The image file is then used to run on a container as an ECS task using a serverless compute engine for containers calls Fargate. If a task is failed, the ECS Service will redeploy a new task.
5. Once the admin user retrieved the web app, the user need to log in on the web app. Behind the scene, the web app will forward the authentication to Cognito, `A4`.
6. On successful authentication, the web app is now has access to API Gateway which allow it to perform data manipulation on the database, `A5`.
7. Some data requires access to images both from the internet and local images. When accessing local images, the web app need to make a request to another Cloudfront distribution shown in `A6`.
8. The Cloudfront in `A6` will then make a request to an S3 bucket as shown in `C1`.

## Client Mobile Application

## API Interaction

### Loading Images

