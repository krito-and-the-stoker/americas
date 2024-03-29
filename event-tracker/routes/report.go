package routes

import (
	"context"
    "net/http"
    "encoding/json"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func (es *EventService) HandleReport(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Only GET method is allowed", http.StatusMethodNotAllowed)
		return
	}

	// Define a slice to hold the results
	var events []Event

	// Create a context for the MongoDB query
	ctx := context.TODO()

	// Set options to limit the number of results to 50
	opts := options.Find().SetLimit(50)

	// Query the database
	cursor, err := es.Collection.Find(ctx, bson.D{{}}, opts)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(ctx)

	// Iterate over the cursor and decode each document
	for cursor.Next(ctx) {
		var event Event
		err := cursor.Decode(&event)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		events = append(events, event)
	}
	if err := cursor.Err(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Encode the results to JSON and send in the response
	json.NewEncoder(w).Encode(events)
}