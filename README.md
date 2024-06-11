This Project is a sample solution showing how to use Pulumi IaC (Infastructure as Code) tool.
It contains a sample Node Backend API that connects to a MongoDb and a sample React Frontend App.

Following the instruction from Pulumi Site we have a solution that deloys the Backend API, Mongo DB and the React Frontend API to docker containers.

I also included code to deploy to Kubernetes using Typescript and C#.

### Built With
[[Pulumi-url](https://www.pulumi.com/)]

### Installation
Get Started with Pulumi [https://www.pulumi.com/docs/get-started/].
You need to setup your programing language of choice, and since we will be deploying to docker and kubernetes, you would need to set those up also.

### Installation
Cd into the directory sample, iac_ts_docker or iac_ts_k8s etc

powershell
  ```sh
  cd dir
  pulumi up
  ```
  follow the prompt and respond accordingly.

  When you are done you can delete all the resources with:
  ```sh
  pulumi destroy
  ```

NB: You would need to maually delete the images that was created

NB: This was done using Windows 11 and should work as is for other Os (might need minor tinkering).

## Roadmap
 - [x] IaC with Docker Provider using Typescript
 - [x] Build Docker Images using Pulumi Docker-Build provider
 - [x] IaC with K8s Provider using Typescript
 - [ ] IaC with K8s Provider using C#
