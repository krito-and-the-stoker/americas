package main

import (
    "context"
    "log"
    "net/http"
    "os"

    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/mongo/options"

    "backend/tracking"
    "backend/game"
    "backend/errors"
)


const databaseName = "americas"

func main() {
    mongoUser := os.Getenv("MONGO_INITDB_ROOT_USERNAME")
    mongoPass := os.Getenv("MONGO_INITDB_ROOT_PASSWORD")
    if mongoUser == "" {
        log.Fatal("MONGO_INITDB_ROOT_USERNAME environment variable is not set")
    }
    if mongoPass == "" {
        log.Fatal("MONGO_INITDB_ROOT_PASSWORD environment variable is not set")
    }
    mongoURI := "mongodb://" + mongoUser + ":" + mongoPass + "@database:27017"

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

    mux := http.NewServeMux()

    gameCollection := client.Database(databaseName).Collection("games")
    gameService := game.NewGameService(gameCollection, "/api/game")
    mux.HandleFunc(gameService.Prefix, gameService.Handle)

    eventCollection := client.Database(databaseName).Collection("events")
    trackingService := tracking.NewEventService(eventCollection, "/api/events")
    mux.HandleFunc(trackingService.Prefix, trackingService.Handle)

    errorCollection := client.Database(databaseName).Collection("errors")
    errors.Handle(errorCollection, "/api/error", mux)

    log.Println("Server is starting...")
    log.Fatal(http.ListenAndServe(":8080", mux))
}
