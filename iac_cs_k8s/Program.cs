using Pulumi;
using Pulumi.Kubernetes.Core.V1;
using Pulumi.Kubernetes.Types.Inputs.Core.V1;
using Pulumi.Kubernetes.Types.Inputs.Apps.V1;
using Pulumi.Kubernetes.Types.Inputs.Meta.V1;
using Kubernetes = Pulumi.Kubernetes;
using System.Collections.Generic;

return await Deployment.RunAsync(() =>
{
    var config = new Pulumi.Config();
    var isMinikube = config.GetBoolean("isMinikube") ?? false;
    var frontendPort = config.GetInt32("frontendPort") ?? 0;
    var backendPort = config.GetInt32("backendPort") ?? 0;
    var mongoPort = config.GetInt32("mongoPort") ?? 0;
    var mongoHost = config.Get("mongoHost")!;
    var nodeEnv = config.Get("nodeEnvironment")!;
    var protocol = config.Get("protocol")!;
    var database = config.Get("database")!;

    //Mongo Db Deployment
    var mongoName = "mongo-data";
    var mongoLabel = new InputMap<string> { { "app", mongoName } };
    var mongoDbImage = ImageBuilder.Build(mongoName, "latest", "../src/tutorial-pulumi-fundamentals/data");
    var mongoDeployment = new Kubernetes.Apps.V1.Deployment(mongoName, new DeploymentArgs()
    {
        Metadata = new ObjectMetaArgs
        {
            Labels = mongoLabel
        },
        Spec = new DeploymentSpecArgs
        {
            Replicas = 1,
            Selector = new LabelSelectorArgs
            {
                MatchLabels = mongoLabel
            },
            Template = new PodTemplateSpecArgs
            {
                Metadata = new ObjectMetaArgs
                {
                    Labels =
                    {
                        { "app", mongoName }
                    }
                },
                Spec = new PodSpecArgs
                {
                    Containers = new[]
                    {
                        new ContainerArgs
                        {
                            Name = mongoName,
                            Image = mongoDbImage.Ref,
                            ImagePullPolicy = "IfNotPresent"
                        }
                    }
                }
            }
        }
    });

    var mongoService = new Service(mongoName, new ServiceArgs
    {
        Metadata = new ObjectMetaArgs
        {
            Labels = mongoDeployment.Spec.Apply(spec =>
                spec.Template.Metadata.Labels
            ),
        },
        Spec = new ServiceSpecArgs
        {
            Type = isMinikube
               ? "ClusterIP"
               : "LoadBalancer",
            Selector = mongoLabel,
            Ports = new ServicePortArgs
            {
                Port = mongoPort,
                TargetPort = mongoPort,
                Protocol = "TCP",
            },
        }
    });

    //Backend Deployment
    var backendName = "backend";
    var backendLabel = new InputMap<string> { { "app", backendName } };
    var backendImage = ImageBuilder.Build(backendName, "latest", "../src/tutorial-pulumi-fundamentals/backend");
    var backendDeployment = new Kubernetes.Apps.V1.Deployment(backendName, new DeploymentArgs()
    {
        Metadata = new ObjectMetaArgs
        {
            Labels = backendLabel
        },
        Spec = new DeploymentSpecArgs
        {
            Replicas = 1,
            Selector = new LabelSelectorArgs
            {
                MatchLabels = backendLabel
            },
            Template = new PodTemplateSpecArgs
            {
                Metadata = new ObjectMetaArgs
                {
                    Labels = backendLabel
                },
                Spec = new PodSpecArgs
                {
                    Containers = new[]
                    {
                        new ContainerArgs
                        {
                            Name = backendName,
                            Image = backendImage.Ref,
                            ImagePullPolicy = "IfNotPresent",
                            Env = new[]
                            {
                                new EnvVarArgs{ Name = "DATABASE_HOST", Value = $"mongodb://mongo:{mongoPort}" },
                                new EnvVarArgs{ Name = "DATABASE_NAME", Value = database },
                                new EnvVarArgs{ Name = "NODE_ENV", Value = nodeEnv }
                            }
                        }
                    }
                }
            }
        }
    });

    var backendService = new Service(backendName, new ServiceArgs
    {
        Metadata = new ObjectMetaArgs
        {
            Labels = backendDeployment.Spec.Apply(spec =>
                spec.Template.Metadata.Labels
       ),
        },
        Spec = new ServiceSpecArgs
        {
            Type = isMinikube
           ? "ClusterIP"
           : "LoadBalancer",
            Selector = backendLabel,
            Ports = new ServicePortArgs
            {
                Port = backendPort,
                TargetPort = backendPort,
                Protocol = "TCP",
            },
        }
    });

    //Frontend Deployment
    var frontendName = "frontend";
    var frontendLabel = new InputMap<string> { { "app", frontendName } };
    var frontendImage = ImageBuilder.Build(frontendName, "latest", "../src/tutorial-pulumi-fundamentals/frontend");
    var frontendDeployment = new Kubernetes.Apps.V1.Deployment(frontendName, new DeploymentArgs()
    {
        Metadata = new ObjectMetaArgs
        {
            Labels = frontendLabel
        },
        Spec = new DeploymentSpecArgs
        {
            Replicas = 1,
            Selector = new LabelSelectorArgs
            {
                MatchLabels = frontendLabel
            },
            Template = new PodTemplateSpecArgs
            {
                Metadata = new ObjectMetaArgs
                {
                    Labels = frontendLabel
                },
                Spec = new PodSpecArgs
                {
                    Containers = new[]
                    {
                        new ContainerArgs
                        {
                            Name = frontendName,
                            Image = frontendImage.Ref,
                            ImagePullPolicy = "IfNotPresent",
                            Env = new[]
                            {
                                new EnvVarArgs{ Name = "PORT", Value = frontendPort.ToString() },
                                new EnvVarArgs{ Name = "HTTP_PROXY", Value = $"backend-service:{backendPort}" },
                                new EnvVarArgs{ Name = "PROXY_PROTOCOL", Value = protocol }
                            }
                        }
                    }
                }
            }
        }
    });

    var frontendService = new Service(frontendName, new ServiceArgs
    {
        Metadata = new ObjectMetaArgs
        {
            Labels = frontendDeployment.Spec.Apply(spec =>
                spec.Template.Metadata.Labels
           ),
        },
        Spec = new ServiceSpecArgs
        {
            Type = isMinikube
               ? "ClusterIP"
               : "LoadBalancer",
            Selector = frontendLabel,
            Ports = new ServicePortArgs
            {
                Port = frontendPort,
                TargetPort = frontendPort,
                Protocol = "TCP",
            },
        }
    });

    // export the deployment name
    return new Dictionary<string, object?>
    {
        ["backend"] = backendDeployment,
        ["frontend"] = frontendDeployment,
        ["mongo"] = mongoDeployment,
    };
});
