package tracking

import (
    "encoding/json"
    "net/http"
    "log"
    "time"

    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/bson/primitive"
)


type ActiveResult struct {
    UsersByCity     map[string]int32 `json:"countByCity"`
}

// HandleSummary handles the route for counting events
func (es *EventService) HandleActive(w http.ResponseWriter, r *http.Request) {
    now := time.Now()
    fiveMinutesAgo := now.AddDate(0, 0, 0).Add(-5 * time.Minute)

    limitActiveLately := bson.D{
        {Key: "$match", Value: bson.D{
            {Key: "timestamp", Value: bson.D{
                {Key: "$gte", Value: primitive.NewDateTimeFromTime(fiveMinutesAgo)},
            }},
        }},
    }

    groupByLocation := bson.D{
        {Key: "$group", Value: bson.D{
            {Key: "_id", Value: bson.D{
                {Key: "location", Value:bson.D{
                    {Key: "$ifNull", Value: bson.A{
                        bson.D{{Key: "$concat", Value: bson.A{
                            bson.D{{Key: "$ifNull", Value: bson.A{"$location.city", "Unknown"}}},
                            ", ",
                            bson.D{{Key: "$ifNull", Value: bson.A{"$location.country", "Unknown"}}},
                        }}},
                        "Unknown",
                    }},
                }},
            }},
            {Key: "Users", Value: bson.D{{Key: "$addToSet", Value: "$userid"}}},
        }},
    }

    countUsers := bson.D{
        {Key: "$project", Value: bson.D{
            {Key: "Users", Value: bson.D{
                {Key: "$size", Value: "$Users"},
            }},
        }},
    }

    cursor, err := es.Collection.Aggregate(r.Context(), mongo.Pipeline{limitActiveLately, groupByLocation, countUsers})
    if err != nil {
        log.Fatal(err) // Or handle the error more gracefully
    }

    var resultCities []bson.M
    if err = cursor.All(r.Context(), &resultCities); err != nil {
        log.Fatal(err) // Or handle the error more gracefully
    }

    result := ActiveResult{
        UsersByCity:     make(map[string]int32),
    }
    for _, cityResult := range resultCities {
        // Extract the location from the cursor
        id := cityResult["_id"].(primitive.M)
        location, ok := id["location"].(string)
        if !ok {
            http.Error(w, "Error parsing location", http.StatusInternalServerError)
        }

        // Assign the EventCount object to the CountByCity map
        result.UsersByCity[location] = cityResult["Users"].(int32)
    }

    json.NewEncoder(w).Encode(result)
}
