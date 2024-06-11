import * as pulumi from "@pulumi/pulumi";
import * as docker from "@pulumi/docker";
import * as docker_build from "@pulumi/docker-build";
import * as backend from "./backend-image"
import * as frontend from "./frontend-image"

// Get configuration values
const config = new pulumi.Config();
const frontendPort = config.requireNumber("frontendPort");
const backendPort = config.requireNumber("backendPort");
const mongoPort = config.requireNumber("mongoPort");
const mongoHost = config.require("mongoHost"); // Note that strings are the default, so it's not `config.requireString`, just `config.require`.
const database = config.require("database");
const nodeEnvironment = config.require("nodeEnvironment");
const protocol = config.require("protocol")

const stack = pulumi.getStack();

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

// Create a Docker network
const network = new docker.Network("network", {
    name: `services-${stack}`,
});

// Create the MongoDB container
const mongoContainer = new docker.Container("mongoContainer", {
    image: mongoImage.ref,
    name: `mongo-${stack}`,
    ports: [
        {
            internal: mongoPort,
            external: mongoPort,
        },
    ],
    networksAdvanced: [
        {
            name: network.name,
            aliases: ["mongo"],
        },
    ],
});

// Create the backend container
const backendContainer = new docker.Container("backendContainer", {
    name: `backend-${stack}`,
    image: backend.ref,
    ports: [
        {
            internal: backendPort,
            external: backendPort,
        },
    ],
    envs: [
        `DATABASE_HOST=${mongoHost}`,
        `DATABASE_NAME=${database}`,
        `NODE_ENV=${nodeEnvironment}`,
    ],
    networksAdvanced: [
        {
            name: network.name,
        },
    ],
}, { dependsOn: [ mongoContainer ]});

// Create the frontend container
const frontendContainer = new docker.Container("frontendContainer", {
    image: frontend.ref,
    name: `frontend-${stack}`,
    ports: [
        {
            internal: frontendPort,
            external: frontendPort,
        },
    ],
    envs: [
        `PORT=${frontendPort}`,
        `HTTP_PROXY=backend-${stack}:${backendPort}`,
        `PROXY_PROTOCOL=${protocol}`
    ],
    networksAdvanced: [
        {
            name: network.name,
        },
    ],
});