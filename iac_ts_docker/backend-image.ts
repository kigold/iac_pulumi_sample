import * as pulumi from "@pulumi/pulumi";
import * as docker_build from "@pulumi/docker-build";

// Pull the backend image
// Build Docker Images
const backendImageName = "backend";
const backendImage = new docker_build.Image(backendImageName, {
    // Tag our image with our ECR repository's address.
    tags: [pulumi.interpolate`${backendImageName}:latest`],
    context: {
        location: "../src/tutorial-pulumi-fundamentals/backend",
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

export const ref = backendImage.ref;