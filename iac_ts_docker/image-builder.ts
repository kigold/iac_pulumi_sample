import * as pulumi from "@pulumi/pulumi";
import * as docker_build from "@pulumi/docker-build";

export const build = function(name:string, location: string){
    // Pull the backend image
    // Build Docker Images
    const image = new docker_build.Image(name, {
        // Tag our image with our ECR repository's address.
        tags: [pulumi.interpolate`${name}:latest`],
        context: {
            location: location
        },
        // Use the pushed image as a cache source.
        //cacheFrom: [],
        // Include an inline cache with our pushed image.
        cacheTo: [{
            inline: {},
        }],
        // Build a multi-platform image manifest for ARM and AMD.
        // platforms: [
        //     "linux/amd64",
        //     //"linux/arm64",
        // ],
        // Push the final result to ECR.
        exports: [{
            docker: {
                tar: true,
            },
        }],
        push: false
    });
    
    return image.ref;
}