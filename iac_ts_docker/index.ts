import * as pulumi from "@pulumi/pulumi";
import * as docker from "@pulumi/docker";
import * as imageBuilder from "./image-builder"

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

// Create a Docker network
const network = new docker.Network("network", {
    name: `services-${stack}`,
});

// Create the MongoDB container
const mongoContainer = new docker.Container("mongoContainer", {
    image: imageBuilder.build("mongo-data", "../src/tutorial-pulumi-fundamentals/data"),
    name: `mongo-data-${stack}`,
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
    image: imageBuilder.build("backend", "../src/tutorial-pulumi-fundamentals/backend"),
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
    image: imageBuilder.build("frontend", "../src/tutorial-pulumi-fundamentals/frontend"),
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