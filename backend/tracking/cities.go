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


// CountResult represents the structure of our count results
type CitiesResult struct {
    CountByCity     map[string]EventCount `json:"countByCity"`
}

// HandleSummary handles the route for counting events
func (es *EventService) HandleCities(w http.ResponseWriter, r *http.Request) {
    now := time.Now()
    thirtyDaysAgo := now.AddDate(0, 0, -ThirtyDays)

    limitToThirtyDaysAgo := bson.D{
        {Key: "$match", Value: bson.D{
            {Key: "timestamp", Value: bson.D{
                {Key: "$gte", Value: primitive.NewDateTimeFromTime(thirtyDaysAgo)},
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
            {Key: "PageView", Value: bson.D{{Key: "$sum", Value: bson.D{{Key: "$cond", Value: bson.A{
                bson.D{{Key: "$eq", Value: bson.A{"$name", "PageView"}}},
                1, 0}}}}}},
            {Key: "NewGame", Value: bson.D{{Key: "$sum", Value: bson.D{{Key: "$cond", Value: bson.A{
                bson.D{{Key: "$eq", Value: bson.A{"$name", "NewGame"}}},
                1, 0}}}}}},
            {Key: "ResumeGame", Value: bson.D{{Key: "$sum", Value: bson.D{{Key: "$cond", Value: bson.A{
                bson.D{{Key: "$eq", Value: bson.A{"$name", "ResumeGame"}}},
                1, 0}}}}}},
            {Key: "AutoSave", Value: bson.D{{Key: "$sum", Value: bson.D{{Key: "$cond", Value: bson.A{
                bson.D{{Key: "$eq", Value: bson.A{"$name", "Autosave"}}},
                1, 0}}}}}},
            {Key: "Error", Value: bson.D{{Key: "$sum", Value: bson.D{{Key: "$cond", Value: bson.A{
                bson.D{{Key: "$eq", Value: bson.A{"$name", "Error"}}},
                1, 0}}}}}},
            {Key: "Users", Value: bson.D{{Key: "$addToSet", Value: "$userid"}}},
        }},
    }

    countUsers := bson.D{
        {Key: "$project", Value: bson.D{
            {Key: "PageView", Value: "$PageView"},
            {Key: "NewGame", Value: "$NewGame"},
            {Key: "ResumeGame", Value: "$ResumeGame"},
            {Key: "AutoSave", Value: "$AutoSave"},
            {Key: "Error", Value: "$Error"},
            {Key: "Users", Value: bson.D{
                {Key: "$size", Value: "$Users"},
            }},
        }},
    }

    cursor, err := es.Collection.Aggregate(r.Context(), mongo.Pipeline{limitToThirtyDaysAgo, groupByLocation, countUsers})
    if err != nil {
        log.Fatal(err) // Or handle the error more gracefully
    }

    var resultCities []bson.M
    if err = cursor.All(r.Context(), &resultCities); err != nil {
        log.Fatal(err) // Or handle the error more gracefully
    }

    result := CitiesResult{
        CountByCity:     make(map[string]EventCount),
    }
    for _, cityResult := range resultCities {
        // Extract the date from the cursor
        id := cityResult["_id"].(primitive.M)
        date, ok := id["location"].(string)
        if !ok {
            http.Error(w, "Error parsing location", http.StatusInternalServerError)
        }

        // Create an EventCount object for the current day
        eventCount := EventCount{
            PageView:   cityResult["PageView"].(int32),
            NewGame:  cityResult["NewGame"].(int32),
            ResumeGame: cityResult["ResumeGame"].(int32),
            AutoSave:   cityResult["AutoSave"].(int32),
            Error:      cityResult["Error"].(int32),
            Users:      cityResult["Users"].(int32),
        }

        // Assign the EventCount object to the CountByCity map
        result.CountByCity[date] = eventCount
    }

    json.NewEncoder(w).Encode(result)
}
