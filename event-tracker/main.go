package main

import (
    "context"
    "log"
    "net/http"
    "os"

    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/mongo/options"

    "event-tracker/routes"
)


const databaseName = "event-tracker"

func main() {
    mongoURI := os.Getenv("MONGO_URI")
    if mongoURI == "" {
        log.Fatal("MONGO_URI environment variable is not set")
    }

    clientOptions := options.Client().ApplyURI(mongoURI)
    client, err := mongo.Connect(context.TODO(), clientOptions)
    if err != nil {
        log.Fatal(err)
    }

    err = client.Ping(context.TODO(), nil)
    if err != nil {
        log.Fatal(err)
    }

    log.Println("Connected to MongoDB!")

    collection := client.Database(databaseName).Collection("events")

    eventService := routes.NewEventService(collection, "/api")
    http.HandleFunc(eventService.Prefix, eventService.Handle)

    log.Println("Server is starting...")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
