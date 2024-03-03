package tracking

import (
    "encoding/json"
    "net/http"
    "log"

    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/bson"
)

// CountResult represents the structure of our count results
type CountResult struct {
    TotalCount     int32            `json:"totalCount"`
    CountByUserID  map[string]int32 `json:"countByUserID"`
    CountByName    map[string]int32 `json:"countByName"`
    CountByDay     map[string]int32 `json:"countByDay"`
    CountByCity  map[string]int32 `json:"countByCity"`
}

// HandleSummary handles the route for counting events
func (es *EventService) HandleSummary(w http.ResponseWriter, r *http.Request) {
    if r.Method != "GET" {
        http.Error(w, "Only GET method is allowed", http.StatusMethodNotAllowed)
        return
    }

    // Total count
    totalCount, err := es.Collection.CountDocuments(r.Context(), bson.D{})
    if err != nil {
        log.Fatal(err) // Or handle the error more gracefully
    }

    result := CountResult{
        TotalCount:     int32(totalCount),
        CountByUserID:  make(map[string]int32),
        CountByName:    make(map[string]int32),
        CountByDay:     make(map[string]int32),
        CountByCity:    make(map[string]int32),
    }

    // Count by UserID
    groupByUserID := bson.D{
        {Key: "$group", Value: bson.D{
            {Key: "_id", Value: "$userid"},
            {Key: "count", Value: bson.D{
                {Key: "$sum", Value: 1},
            }},
        }},
    }
    cursor, err := es.Collection.Aggregate(r.Context(), mongo.Pipeline{groupByUserID})
    if err != nil {
        log.Fatal(err) // Or handle the error more gracefully
    }
    var resultsUserID []bson.M
    if err = cursor.All(r.Context(), &resultsUserID); err != nil {
        log.Fatal(err) // Or handle the error more gracefully
    }
    for _, res := range resultsUserID {
        id, ok := res["_id"].(string)
        if !ok {
            // Handle the case where _id is not a string or is nil
            result.CountByUserID["unknown"] = res["count"].(int32)
            continue
        }
        result.CountByUserID[id] = res["count"].(int32)
    }
    // Count by Name
    groupByName := bson.D{
        {Key: "$group", Value: bson.D{
            {Key: "_id", Value: "$name"},
            {Key: "count", Value: bson.D{
                {Key: "$sum", Value: 1},
            }},
        }},
    }
    cursor, err = es.Collection.Aggregate(r.Context(), mongo.Pipeline{groupByName})
    if err != nil {
        log.Fatal(err) // Or handle the error more gracefully
    }
    var resultsName []bson.M
    if err = cursor.All(r.Context(), &resultsName); err != nil {
        log.Fatal(err) // Or handle the error more gracefully
    }
    for _, res := range resultsName {
        result.CountByName[res["_id"].(string)] = res["count"].(int32)
    }

    // Count by Day
    groupByDay := bson.D{
        {Key: "$group", Value: bson.D{
            {Key: "_id", Value: bson.D{
                {Key: "$dateToString", Value: bson.D{
                    {Key: "format", Value: "%Y-%m-%d"},
                    {Key: "date", Value: "$timestamp"},
                }},
            }},
            {Key: "count", Value: bson.D{{Key: "$sum", Value: 1}}},
        }},
    }
    cursor, err = es.Collection.Aggregate(r.Context(), mongo.Pipeline{groupByDay})
    if err != nil {
        log.Fatal(err) // Or handle the error more gracefully
    }
    var resultsDay []bson.M
    if err = cursor.All(r.Context(), &resultsDay); err != nil {
        log.Fatal(err) // Or handle the error more gracefully
    }
    for _, res := range resultsDay {
        result.CountByDay[res["_id"].(string)] = res["count"].(int32)
    }

    // Count by City
    countByCity := bson.D{
        {Key: "$group", Value: bson.D{
            {Key: "_id", Value: bson.D{
                {Key: "$ifNull", Value: bson.A{
                    bson.D{{Key: "$concat", Value: bson.A{
                        bson.D{{Key: "$ifNull", Value: bson.A{"$location.city", ""}}},
                        ", ",
                        bson.D{{Key: "$ifNull", Value: bson.A{"$location.country", "Unknown"}}},
                    }}},
                    "Unknown",
                }},
            }},
            {Key: "count", Value: bson.D{
                {Key: "$sum", Value: 1},
            }},
        }},
    }

    cursor, err = es.Collection.Aggregate(r.Context(), mongo.Pipeline{countByCity})
    if err != nil {
        log.Fatal(err) // Or handle the error more gracefully
    }
    var resultsCity []bson.M
    if err = cursor.All(r.Context(), &resultsCity); err != nil {
        log.Fatal(err) // Or handle the error more gracefully
    }
    for _, res := range resultsCity {
        result.CountByCity[res["_id"].(string)] = res["count"].(int32)
    }


    json.NewEncoder(w).Encode(result)
}
