var builder = DistributedApplication.CreateBuilder(args);

// Add PostgreSQL database
var postgres = builder.AddPostgres("postgres")
    .WithPgAdmin();

var yahatl = postgres.AddDatabase("yahatl");

// Add Redis cache
var redis = builder.AddRedis("redis");

// Add the API project
builder.AddProject<Projects.Yahatl_Api>("api")
    .WithReference(yahatl)
    .WithReference(redis)
    .WaitFor(postgres)
    .WaitFor(redis);

builder.Build().Run();
