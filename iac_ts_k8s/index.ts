import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as imageBuilder from "./image-builder"

// Get configuration values
const config = new pulumi.Config();
const frontendPort = config.requireNumber("frontendPort");
const backendPort = config.requireNumber("backendPort");
const mongoPort = config.requireNumber("mongoPort");
const database = config.require("database");
const nodeEnvironment = config.require("nodeEnvironment");
const protocol = config.require("protocol")
const isMinikube = config.requireBoolean("isMinikube");

// mongo Db Deployment
const mongoLabels = { app: "mongo-data" };
const mongoDeployment = new k8s.apps.v1.Deployment(mongoLabels.app, {
    spec: {
        selector: { matchLabels: mongoLabels },
        replicas: 1,
        template: {
            metadata: { labels: mongoLabels },
            spec: { containers: [{ 
                name: mongoLabels.app, 
                image: imageBuilder.build("mongo-data", "../src/tutorial-pulumi-fundamentals/data"), 
                imagePullPolicy: "IfNotPresent"
            }] }
        }
    }
});

const mongoService = new k8s.core.v1.Service(mongoLabels.app, {    
    metadata: { name: "mongo-service", labels: mongoDeployment.spec.template.metadata.labels },
    spec: {
        type: isMinikube ? "ClusterIP" : "LoadBalancer",
        ports: [{ port: mongoPort, targetPort: mongoPort, protocol: "TCP" }],
        selector: mongoLabels
    }
});

// backend Deployment
const backendLabels = { app: "backend" };
const backendDeployment = new k8s.apps.v1.Deployment(backendLabels.app, {
    spec: {
        selector: { matchLabels: backendLabels },
        replicas: 1,
        template: {
            metadata: { labels: backendLabels },
            spec: { 
                    containers: [
                        {
                            name: backendLabels.app,
                            image: imageBuilder.build("backend", "../src/tutorial-pulumi-fundamentals/backend"),
                            imagePullPolicy: "IfNotPresent",
                            env: [
                                { name: "DATABASE_HOST", value: `mongodb://mongo-service:${mongoPort}`},
                                { name: "DATABASE_NAME", value: database },
                                { name: "NODE_ENV", value: nodeEnvironment },
                            ]
                        }
                    ] 
                }
            }
        }
    }
);

const backendService = new k8s.core.v1.Service(backendLabels.app, {
    metadata: { name: "backend-service", labels: backendDeployment.spec.template.metadata.labels },
    spec: {
        type: isMinikube ? "ClusterIP" : "LoadBalancer",
        ports: [{ port: backendPort, targetPort: backendPort, protocol: "TCP" }],
        selector: backendLabels
    }
});

// frontend Deployment
const frontendLabels = { app: "frontend" };
const frontendDeployment = new k8s.apps.v1.Deployment(frontendLabels.app, {
    spec: {
        selector: { matchLabels: frontendLabels },
        replicas: 1,
        template: {
            metadata: { labels: frontendLabels },
            spec: { 
                    containers: [
                        {
                            name: frontendLabels.app,
                            image: imageBuilder.build("frontend", "../src/tutorial-pulumi-fundamentals/frontend"),
                            imagePullPolicy: "IfNotPresent",
                            env: [
                                { name: 'PORT', value: frontendPort.toString() },
                                { name: "HTTP_PROXY", value: `backend-service:${backendPort}`},
                                { name: "PROXY_PROTOCOL", value: protocol }
                            ]
                        }
                    ] 
                }
            }
        }       
    }
);

const frontendService = new k8s.core.v1.Service(frontendLabels.app, {
    metadata: { name: "frontend-service", labels: frontendDeployment.spec.template.metadata.labels },
    spec: {
        type: isMinikube ? "ClusterIP" : "LoadBalancer",
        ports: [{ port: frontendPort, targetPort: frontendPort, protocol: "TCP" }],
        selector: frontendLabels
    }
});