var tripLayer = L.layerGroup();
function drawTripStayLayer() {
    tripStayLayer.addLayer(boxLayer);
    tripStayLayer.addLayer(tripLayer);
    tripStayinfo();
}
function changeTripStayData() {
    let tripLineList=[];
    tripLayer.clearLayers();
    boxLayer.clearLayers();
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

        boxLayer.addLayer(circleMarker);
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

function tripStayinfo() {
    d3.select(".info-frame").html("");
    let divTab = d3.select(".info-frame");
    divTab.style('text-align', 'center')
        .append('text')
        .attr("id", "info-title")
        .style('display', 'inline-block')
        .style('font-size', 'small')
        .style('font-weight', 700)
        .text("职住地分析");

    divTab.append("div")
        .attr("id", "info-list")
        .style('text-align', 'left')
        .style('width', "95%")
        .style('height', "50%")
        .style("overflow", "auto")
        .style('margin', "2%")
        .style('padding', "2%")
        .style('box-sizing', 'border-box')
        .style('list-style-type', 'none')
        .style("border", `1px solid rgb(232, 226, 217)`)
        .style("border-radius", "2px");

    let userTab = d3.select("#info-list")
        .append("table")
        .attr("id", "info-stay-table");

    userTab.append("tr")
        .html(`<th>区块号</th> <th>职住类别</th>`);

    userTab.selectAll("#liRank")
        .data([{'id':0,'label':'stay'},{'id':1,'label':'work'}])
        .join('tr')
        .attr("id", "liRank")
        .html((d, i) => {
            return `<td>${d.id}</td> <td>${d.label}</td>`;
        })
        .on("click", function (d) {
            drawTripStayTimeLines(d.id);
        });
}
function drawTripStayTimeLines(plot) {
    let tempTripData=[],tempStayData=[];
    for(let i=0;i<24;i++){
        tempTripData.push(0);
        tempStayData.push(0);
    }
    for(let i=0;i<288;i++){
        let j = Math.floor(i/12);
        if (stayData[i].hasOwnProperty(plot))
            tempStayData[j]+=stayData[i][plot];
        for(let k=0;k<tripData[i].length;k++){
            if(tripData[i][k].source==plot){
                // console.log(tripData[i][k].source,plot,tripData[i][k].source==plot,tripData[i][k].weight);
                tempTripData[j]+=tripData[i][k].weight
            }
        }
    }
    for(let i=0;i<24;i++){
        tempTripData[i]=Math.ceil(tempTripData[i]/12);
        tempStayData[i]=Math.ceil(tempStayData[i]/12);
    }
    // console.log(tempStayData,tempTripData);
    let width = 300,height = 200;
    var scale_x=d3.scaleLinear()
        .domain([0,tempTripData.length-1])
        .range([0,width]);
    var scale_y=d3.scaleLinear()
        .domain([0,Math.max(d3.max(tempTripData),d3.max(tempStayData))])
        .range([height,0]);

//画线函数
    var line_generator= d3.line()
        .x(function (d,i) {
            return scale_x(i);
        })
        .y(function (d) {
            return scale_y(d);
        })
        .curve(d3.curveMonotoneX);
    // .curve(d3.curveMonotoneX) // apply smoothing to the line
    let margin={left:25,top:25,right:25,bottom:5};
    d3.select(".info-frame").remove('svg');
    let g = d3.select(".info-frame").append('svg')
        .attr("transform","translate("+margin.left+","+margin.top+")");

    g.append('g').append("path")
        .attr("d",line_generator(tempTripData))
        .style("stroke-width", 0.5)
        .style("stroke",'red')
        .style("fill", "none")
        .style('stroke-opacity', 1);

    g.append('g').append("path")
        .attr("d",line_generator(tempStayData))
        .style("stroke-width", 0.5)
        .style("stroke",'red')
        .style("fill", "none")
        .style('stroke-opacity', 1);
}
function cleanTripLayer() {
    tripStayLayer.removeLayer(boxLayer);
    tripStayLayer.removeLayer(tripLayer);
}
