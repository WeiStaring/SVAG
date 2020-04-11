//出行方式图层总集合
var modeLayerGroup = L.layerGroup();

//个人轨迹图层
var personTrackLayer = L.layerGroup();
//人员图层对应字典
var userLayerMap = {};

var colType = d => {
    d = parseInt(d);
    switch (d) {
        case 1:
            return "red";
        case 2:
            return "orange";
        case 3:
            return "green";
        case 4:
            return "blue";
        default:
            return "grey";
    }
};

//出行方式图例
var colorLegend = L.control.legend({
    position: 'bottomleft',
    legends: [{
        name: 'Trip Mode',
        elements: [{
            label: 'Car',
            html: '',
            style: {
                'background-color': 'red',
                'opacity': '0.8',
                'width': '10px',
                'height': '10px',
                'border': '0.5px solid black',
            }
        }, {
            label: 'Walk',
            html: '',
            style: {
                'background-color': 'orange',
                'opacity': '0.8',
                'width': '10px',
                'height': '10px',
                'border': '0.5px solid black',
            }
        }, {
            label: 'Bike',
            html: '',
            style: {
                'background-color': 'green',
                'opacity': '0.8',
                'width': '10px',
                'height': '10px',
                'border': '0.5px solid black',
            }
        }, {
            label: 'Bus',
            html: '',
            style: {
                'background-color': 'blue',
                'opacity': '0.8',
                'width': '10px',
                'height': '10px',
                'border': '0.5px solid black',
            }
        }]
    }],
});

//添加个人轨迹的图例
modeLayerGroup.on("add", e => {
    map.addControl(colorLegend);
});
modeLayerGroup.on("remove", e => {
    map.removeControl(colorLegend);
});

function initTrackLayer() {

    let i = 0;
    for (user in personTrackData) {
        //用户轨迹数据
        let personTrackNowData = personTrackData[user];

        let trackSvgLayer = L.d3SvgOverlay(function (selection, projection) {
            selection.selectAll('path')
                .data(personTrackNowData.features)
                .join('path')
                .attr("class", "user-path")
                .attr('d', projection.pathFromGeojson)
                .style('stroke', d => colType(d.properties.type))
                .style('opacity', '0.5')
                .style('stroke-width', d => {
                    d.properties.width = 2 / projection.scale;
                    return 2 / projection.scale;
                })
                .on("click", function (d) {
                    drawInfoList(d.properties);
                });
        }, {
            "zoomDraw": false,
            "zoomAble": true,
            "interactive": true,
        });

        personTrackLayer.addLayer(trackSvgLayer);
        userLayerMap[user] = i;
        i++;
    }
}


function drawInfoTab() {
    let divTab = d3.select(".info-frame");

    let divUser = divTab.append("div")
        .attr("id", "info-user")
        .style('width', "100%")
        .style('height', "95%")
        .style("margin", "0 0 5px 0");

    divUser.style('text-align', 'center')
        .append('text')
        .attr("id", "info-user-title")
        .style('display', 'inline-block')
        .style('font-size', 'small')
        .style('font-weight', 700)
        .text("用户列表");

    divUser.append("div")
        .attr("id", "info-user-list")
        .style('text-align', 'left')
        .style('width', "95%")
        .style('height', "100%")
        .style("overflow", "auto")
        .style('margin', "2%")
        .style('padding', "2%")
        .style('box-sizing', 'border-box')
        .style('list-style-type', 'none')
        .style("border", `1px solid rgb(232, 226, 217)`)
        .style("border-radius", "2px");
    let dataTemp=[];
    for(let key in personTrackData){
        dataTemp.push(personTrackData[key])
    }
    let table = d3.select("#info-user-list")
        .selectAll('div')
        .style('text-align', 'center')
        .data(dataTemp)
        .join('li')
        .style('vertical-align', 'middle')
        .style('line-height', '1em')
        .style('padding-bottom', '0.3em');
    console.log(dataTemp);

    table
        .append('text')
        .attr("id", "liName")
        .style('display', 'inline-block')
        .style('max-width', '15em')
        .style('padding-left', '5px')
        .style('vertical-align', 'top')
        .style('font-size', '12px')
        .text(d => d.id.substr(10,8))
        .style("background", "white")
        .on("click", function (d) {
            d3.selectAll("#liName").style('background', "white");
            d3.select(this).style('background', "rgb(215, 228, 233)").attr("isClick", "true");
            curUser = d.id;
            modeLayerGroup.clearLayers();
            modeLayerGroup.addLayer(personTrackLayer.getLayers()[userLayerMap[curUser]]);
            changeUserLine();
        });
    let xScaleTemp = d3.scaleTime()
        .domain([new Date(2018, 9, 3, 0, 0, 0), new Date(2018, 9, 3, 24, 0, 0)])//d3.extent(sumFlowData, d => d.time)
        .range([10, 180]);

    table
        .append('svg')
        .attr('width',180)
        .attr('height',20)
        .append('g')
        .selectAll('line')
        .data(function (d){
            return d.features;
        })
        .enter()
        .append('line')
        .attr("class", "time-user-line")
        .attr("x1", d => xScaleTemp(d.properties.startTime))
        .attr("y1", 2)
        .attr("x2", d => xScaleTemp(d.properties.endTime))
        .attr("y2", 2)
        .attr("transform", "translate(0,10)")
        .style("opacity", "0.5")
        .attr("stroke", d => colType(d.properties.type))
        .attr("stroke-width", 20);

}

function drawInfoList(d) {

}

//高亮此时的轨迹
function changePersonTrackData() {
    let curRealTime = new Date(2018, 9, 3, Math.floor(curTime / 12), (curTime % 12) * 5, 0);
    d3.selectAll(".user-path")
        .style('opacity', d => {
            if (d.properties.startTime <= curRealTime && curRealTime <= d.properties.endTime)
                return '0.8';
            else
                return '0.5';
        })
        .style("stroke-width", d => {
            if (d.properties.startTime <= curRealTime && curRealTime <= d.properties.endTime)
                return d.properties.width * 2;
            else
                return d.properties.width;
        });
}

function drawTimeLineTrip() {
    d3.selectAll(".time-area").remove();
    svgTime.selectAll('g').remove();
    let personTrackNowData = personTrackData[curUser].features;
    console.log(personTrackNowData);
    let yScaleTemp = d3.scaleLinear()
        .domain([0, d3.max(personTrackNowData, d => d.properties.realSpeed)+2])
        .range([height-margin.bottom, margin.top]);
    let yAxisTemp = d3.axisLeft(yScaleTemp).ticks(5).tickSizeOuter(0).tickSize(2);
    svgTime.append("g")
        .attr("transform", "translate(0," + (yScale.range()[0]+10) + ")")
        .call(xAxis);
    svgTime.append("g").attr("transform", "translate(" + xScale.range()[0] + ",10)")
        .call(yAxisTemp);

    svgTime.selectAll(".time-user-line").remove();

    personTrackNowData.forEach(d => {
        svgTime.append("line")
            .attr("class", "time-user-line")
            .attr("x1", xScale(d.properties.startTime))
            .attr("y1", yScale(d.properties.realSpeed))
            .attr("x2", xScale(d.properties.endTime))
            .attr("y2", yScale(d.properties.realSpeed))
            .attr("transform", "translate(0,10)")
            .style("opacity", "0.5")
            .attr("stroke", colType(d.properties.type))
            .attr("stroke-width", 5);
    });

}
//初始化出行方式图层
function initModeLayer() {
    initTrackLayer();
}

//绘制出行方式图层
function drawModeLayer() {
    drawInfoTab();
}

//清除出行方式图层
function cleanModeLayer() {
    modeLayerGroup.clearLayers();
    cleanUserLine();
}