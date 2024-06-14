using Pulumi.DockerBuild.Inputs;
using DockerBuild = Pulumi.DockerBuild;

public static class ImageBuilder
{
    public static DockerBuild.Image Build(string name, string tag, string location)
    {
        return  new DockerBuild.Image(name, new()
        {
            // Tag our image with our ECR repository's address.
            Tags = new[]
            {
                $"{name}:{tag}"
            },
            Context = new BuildContextArgs
            {
                Location = location,
            },
            // Use the pushed image as a cache source.
            //CacheFrom = new[]
            //{
            //},
            // Include an inline cache with our pushed image.
            //CacheTo = new[]
            //{
            //},
            // Build a multi-platform image manifest for ARM and AMD.
            //Platforms = new[]
            //{
            //    DockerBuild.Platform.Linux_amd64,
            //    DockerBuild.Platform.Linux_arm64,
            //},
            Exports = new[]
            {
                new ExportArgs
                {
                    Docker = new ExportDockerArgs
                    {
                        Tar = true,
                    },
                },
            },
            // Push the final result to ECR.
            Push = false,
        });
    }
}