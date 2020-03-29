var tripLayer = L.layerGroup();
function drawTripStayLayer() {
    tripStayLayer.addLayer(boxMarkerLayer);
    tripStayLayer.addLayer(tripLayer);
}
function changeTripStayData() {
    // console.log(stayData,tripData);
    let tripLineList=[];
    tripLayer.clearLayers();
    boxMarkerLayer.clearLayers();
    stationBoxesMap.forEach((plott, i) => {
        let stay = stayData[curTime];
        let r = 1;
        if(stay.hasOwnProperty(plott.id)){
            r = stay[plott.id]/2+1;
        }

        let circleMarker = L
            .circleMarker([plott.latitude, plott.longitude], {
                radius: r,
                fillColor: "white",
                color: "grey",
                weight: 1,
                opacity: 0.5,
                fillOpacity: 0.5,
                isClick: false,
            });

        boxMarkerLayer.addLayer(circleMarker);
    });

    let trips = tripData[curTime];
    for(let i =0;i<trips.length;i++){
        let start = stationBoxesMap[trips[i].source];
        let end = stationBoxesMap[trips[i].target];
        let tripLine = {
            "type": "Feature",
            "properties": {
                "weight": trips[i].weight,
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [[start.latitude, start.longitude],
                    [end.latitude, end.longitude]]
            }
        };
        tripLineList.push(tripLine);
    }
    console.log(curTime,tripLineList);

    let tripSvgLayer = L.d3SvgOverlay(function (selection, projection) {
        selection.selectAll('path')
            .data(tripLineList)
            .join('path')
            .attr('d', projection.pathFromGeojson)
            .style('stroke', 'white')
            .style('opacity', '0.75')
            .style('stroke-width', d => {
                d.properties.width = d.properties.weight*2 / projection.scale;
                return d.properties.width;
            });
        }, {
            "zoomDraw": false,
            "zoomAble": true,
            "interactive": true,
        });
    tripLayer.addLayer(tripSvgLayer);
}


