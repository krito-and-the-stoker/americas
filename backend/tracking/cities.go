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
    _ = now.AddDate(0, 0, -30)

    // Count by Day
    groupByDay := bson.D{
        // {Key: "$match", Value: bson.D{
        //     {Key: "timestamp", Value: bson.D{
        //         {Key: "$gte", Value: primitive.NewDateTimeFromTime(thirtyDaysAgo)},
        //     }},
        // }},
        {Key: "$group", Value: bson.D{
            {Key: "_id", Value: bson.D{
                {Key: "city", Value:bson.D{
                    {Key: "$ifNull", Value: bson.A{
                        bson.D{{Key: "$concat", Value: bson.A{
                            bson.D{{Key: "$ifNull", Value: bson.A{"$location.city", ""}}},
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
        }},
    }


    cursor, err := es.Collection.Aggregate(r.Context(), mongo.Pipeline{groupByDay})
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
        _id := cityResult["_id"].(primitive.M)
        date, ok := _id["city"].(string)
        if !ok {
            http.Error(w, "Error pasing city", http.StatusInternalServerError)
        }

        // Create an EventCount object for the current day
        eventCount := EventCount{
            PageView:   cityResult["PageView"].(int32),
            NewGame:  cityResult["NewGame"].(int32),
            ResumeGame: cityResult["ResumeGame"].(int32),
            AutoSave:   cityResult["AutoSave"].(int32),
            Error:      cityResult["Error"].(int32),
        }

        // Assign the EventCount object to the CountByCity map
        result.CountByCity[date] = eventCount
    }

    json.NewEncoder(w).Encode(result)
}
