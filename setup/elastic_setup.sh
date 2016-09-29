#!/bin/bash

#
# Delete index
#

#curl -XDELETE https://$ES_HOST/aquadata


#
# Define main index - aquadata
#
curl -XPOST https://$ES_HOST/aquadata -d '{
    "settings" : {
        "number_of_shards" : 1
    },
    "mappings" : {
        "aquadata" : {
            "properties" : {
                timestamp: {type: "date"},
                aquariumLightlevel: {type: "integer"},
                aquariumWaterSensor: {type: "integer"},
                aquariumWatertemperatureCelsius: {type: "float"},
                externalLight: {type: "float"},
                externalTempC: {type: "float"},
                externalPressure: {type: "float"},
                externalHumidity: {type: "float"},
                motions: {type: "integer"}
            }
       }
    }
}'


