package tracking

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
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
    now := time.Now()
    thirtyDaysAgo := now.AddDate(0, 0, -ThirtyDays)

    limitToThirtyDaysAgo := bson.D{
        {Key: "$match", Value: bson.D{
            {Key: "timestamp", Value: bson.D{
                {Key: "$gte", Value: primitive.NewDateTimeFromTime(thirtyDaysAgo)},
            }},
        }},
    }

    result := CountResult{
        TotalCount:     0,
        CountByUserID:  make(map[string]int32),
        CountByName:    make(map[string]int32),
        CountByDay:     make(map[string]int32),
        CountByCity:    make(map[string]int32),
    }

    // count all documents
    count := bson.D{
        {Key: "$count", Value: "count"},
    }
    // Total count
    cursor, err := es.Collection.Aggregate(r.Context(), mongo.Pipeline{limitToThirtyDaysAgo, count})
    if err != nil {
        log.Fatal(err) // Or handle the error more gracefully
    }

    cursor.Next(r.Context())
    if totalCount, found := cursor.Current.Lookup("count").Int32OK(); found {
        result.TotalCount = totalCount
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
    cursor, err = es.Collection.Aggregate(r.Context(), mongo.Pipeline{limitToThirtyDaysAgo, groupByUserID})
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
    cursor, err = es.Collection.Aggregate(r.Context(), mongo.Pipeline{limitToThirtyDaysAgo, groupByName})
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
    cursor, err = es.Collection.Aggregate(r.Context(), mongo.Pipeline{limitToThirtyDaysAgo, groupByDay})
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

    cursor, err = es.Collection.Aggregate(r.Context(), mongo.Pipeline{limitToThirtyDaysAgo, countByCity})
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
