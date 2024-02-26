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


    gameCollection := client.Database(databaseName).Collection("games")
    gameService := game.NewGameService(gameCollection, "/api/game")
    http.HandleFunc(gameService.Prefix, gameService.Handle)

    eventCollection := client.Database(databaseName).Collection("events")
    trackingService := tracking.NewEventService(eventCollection, "/api/events")
    http.HandleFunc(trackingService.Prefix, trackingService.Handle)

    log.Println("Server is starting...")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
