import * as pulumi from "@pulumi/pulumi";
import * as docker_build from "@pulumi/docker-build";

//Pull the MongoDB image
const mongoImage = new docker_build.Image("mongo-data", {
    // Tag our image with our ECR repository's address.
    tags: [pulumi.interpolate`${"mongo-data"}:latest`],
    context: {
        location: "../src/tutorial-pulumi-fundamentals/data",
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
    exports: [{
        docker: {
            tar: true,
        },
    }],
    push: false
});

export const ref = mongoImage.ref;