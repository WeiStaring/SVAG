//--创建地图--
//地图瓦片链接
var mbUrl = "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=" +
    "pk.eyJ1IjoiMTAwNDE2OTM1NyIsImEiOiJjano2eGtidjIwZjIwM2JxcWcyMjA4a2hsIn0.B097Ij8wdiLwDTXD9PHgwg";
var map = new L.Map('map', {
    center: [41.8, 123.4],
    zoom: 12,
    //minZoom: 0,
    //maxZoom: 20,
    maxBounds: [
        [41, 122],
        [43, 125]
    ],
    layers: [],
});

//--基础图层--
//灰度地图
var grayscale = L.tileLayer(mbUrl, { id: 'mapbox/light-v10', tileSize: 512, zoomOffset: -1 }).addTo(map);
//街道地图
var streets = L.tileLayer(mbUrl, { id: 'mapbox/streets-v11', tileSize: 512, zoomOffset: -1 });

//--功能图层--
//热力图层
var heatmapLayer = L.layerGroup();
//标签图层
var markerLayer = L.layerGroup();
//空间流动图层
var spaceFlowLayer = L.layerGroup();
//个人轨迹图层
var personTrackLayer = L.layerGroup();
//特定地点时序流量图层
var temporalFlowLayer = L.layerGroup();

//--图层控制器--
var baseLayers = {
    "Grayscale": grayscale,
    "Streets": streets
};
var overlays = {
    "Heatmap": heatmapLayer,
    "Marker": markerLayer,
    "SpaceFlow": spaceFlowLayer,
    "PersonTrack": personTrackLayer,
    "TemporalFlow": temporalFlowLayer,
};
L.control.layers(baseLayers, overlays).addTo(map);

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

//--读取数据--
//基站数据
var stationData;
//空间流量分布数据
var spaceVolumeData;
//时间流量分布数据
var temporalFlowData;
//驻留数据
var spaceStayData;
var stayDomain;
//出行数据
var spaceTripData;
var tripDomain;
//格子数据
var stationBoxesMap;
//个人轨迹数据
var personTrackData;
//用户表
var userList;
//当前时刻
var curTime;
//当前用户
var curUser;

//同步读取数据
function getData(url) {
    var result = [];
    $.ajax({
        data: "get",
        url: url,
        data: "type=getText&commentText=" + url,
        cache: false,
        async: false,
        success: function (data) {
            result = data;
        }
    })
    return result;
}


//--更新图层数据--

//更新t时刻的热力图层和标签图层
function changeHeatmapData() {
    let t = Math.ceil((curTime.getHours() * 60 + curTime.getMinutes()) / 5);
    //清除原有图层
    heatmapLayer.clearLayers();
    markerLayer.clearLayers();

    //获取t时刻的数据
    let spaceVolumeNowData = [];
    for (j in spaceVolumeData[t]) {
        spaceVolumeNowData.push([stationData[j].latitude, stationData[j].longitude, spaceVolumeData[t][j]]);
    }

    //添加热力图层
    let heatmap = L.heatLayer(spaceVolumeNowData, {
        minOpacity: 0.5,
        maxZoom: 18,
        max: 1.0,
        radius: 8,
        blur: 5,
        gradient: null
    });
    heatmapLayer.addLayer(heatmap);

    //添加标签图层
    let markers = L.layerGroup(spaceVolumeNowData.map(d => {
        const html = `<div class="popup">` +
            `<p>Lat:${d[0]}</p>` +
            `<p>Lng:${d[1]}</p>` +
            `<p>volume:${d[2]}</p></div>`;
        return L.marker([d[0], d[1]])
            .bindPopup(html)
            .bindTooltip(html, { sticky: true });
    }));
    let markerCluster = L.markerClusterGroup({}).addLayer(markers);
    markerLayer.addLayer(markerCluster);
}

//更新t时刻的驻留出行图层
function changeSpaceFlowData() {
    let t = Math.ceil((curTime.getHours() * 60 + curTime.getMinutes()) / 5);
    //清除原有图层
    spaceFlowLayer.clearLayers();

    //获取t时刻的驻留数据
    let spaceStayNowData = [];
    let stationSet = new Set();
    for (j in spaceStayData[t]) {
        spaceStayNowData.push([stationBoxesMap[j].latitude, stationBoxesMap[j].longitude, spaceStayData[t][j]]);
        stationSet.add(j);
    }

    //获取t时刻的出行数据
    let spaceTripNowData = [];
    for (j in spaceTripData[t]) {
        let d = spaceTripData[t][j];
        spaceTripNowData.push([stationBoxesMap[d.source].latitude, stationBoxesMap[d.source].longitude,
        stationBoxesMap[d.target].latitude, stationBoxesMap[d.target].longitude, d.weight]);
        if (!(stationSet.has(d.source))) {
            spaceStayNowData.push([stationBoxesMap[d.source].latitude, stationBoxesMap[d.source].longitude, 0]);
            stationSet.add(d.source)
        }
        if (!(stationSet.has(d.target))) {
            spaceStayNowData.push([stationBoxesMap[d.target].latitude, stationBoxesMap[d.target].longitude, 0]);
            stationSet.add(d.target)
        }
    }

    //获取t时刻的边捆绑数据
    let nodes = {};
    let edges = [];
    for (j in spaceTripData[t]) {
        let d = spaceTripData[t][j];
        edges.push({ 'source': d.source, 'target': d.target });
        nodes[d.source] = { 'x': stationBoxesMap[d.source].latitude, 'y': stationBoxesMap[d.source].longitude };
        nodes[d.target] = { 'x': stationBoxesMap[d.target].latitude, 'y': stationBoxesMap[d.target].longitude };
    }
    let fbundling = d3.ForceEdgeBundling()
        .nodes(nodes)
        .edges(edges)
        .bundling_stiffness(1)
        .step_size(0.00008)
        // .cycles(10)
        .iterations(100)
        .iterations_rate(0.5)
    // .subdivision_points_seed()
    // .subdivision_rate()
    // .compatibility_threshold();
    let edgeBundleResult = fbundling();
    let edgeBundleNowData = edgeBundleResult.map(d => {
        let tmp = [];
        for (i in d) {
            tmp.push([d[i].x, d[i].y]);
        }
        return tmp;
    });

    //添加出行图层
    let val = d3.scaleLinear()
        .domain(tripDomain)
        .range([2, 10]);

    let polylines = L.layerGroup(spaceTripNowData.map((d, i) => {
        const html = `<div class="popup">` +
            `<p>source Lat:${d[0]}</p>` +
            `<p>source Lng:${d[1]}</p>` +
            `<p>target Lat:${d[2]}</p>` +
            `<p>target Lng:${d[3]}</p>` +
            `<p>trip count:${d[4]}</p></div>`;

        return L.polyline(edgeBundleNowData[i], {
            weight: val(d[4]),
            color: "grey",
            opacity: 0.5,
        })
            .bindPopup(html)
            .bindTooltip(html, { sticky: true });
    }).concat(spaceTripNowData.map((d, i) => {

        return L.polylineDecorator(edgeBundleNowData[i], {
            patterns: [
                {
                    offset: '100%',
                    repeat: 0,
                    symbol: L.Symbol.arrowHead({
                        pixelSize: 10,
                        polygon: false,
                        pathOptions: { color: 'grey', weight: val(d[4]), opacity: 0.5, stroke: true }
                    })
                }
            ]
        });
    }))
    );
    spaceFlowLayer.addLayer(polylines);

    //添加驻留图层
    let r = d3.scaleLinear()
        .domain(stayDomain)
        .range([5, 20]);
    let circleMarkers = L.layerGroup(spaceStayNowData.map(d => {
        const html = `<div class="popup">` +
            `<p>Lat:${d[0]}</p>` +
            `<p>Lng:${d[1]}</p>` +
            `<p>stay count:${d[2]}</p></div>`;
        return L.circleMarker([d[0], d[1]], {
            radius: r(d[2]),
            fillColor: "white",
            color: "grey",
            weight: 1,
            opacity: 0.5,
            fillOpacity: 0.5,
        })
            .bindPopup(html)
            .bindTooltip(html, { sticky: true });
    }));
    spaceFlowLayer.addLayer(circleMarkers);

}

//更新t时刻的个人轨迹图层
function changePersonTrackData() {

    let t = curTime;
    let preT = new Date(t);
    preT.setMinutes(preT.getMinutes() - 5);
    let user = curUser;

    let colType = d => {
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
    let trackType = d => {
        d = parseInt(d);
        switch (d) {
            case 1:
                return "car";
            case 2:
                return "walk";
            case 3:
                return "bike";
            case 4:
                return "bus";
            default:
                return "unknow";
        }
    };
    let spd = d3.scaleLinear()
        .domain(speedDomain)
        .range([0.2, 1]);

    //获取t时刻user用户的轨迹数据
    personTrackLayer.clearLayers();
    let personTrackNowData = [];
    for (i in personTrackData[user]) {
        let d = personTrackData[user][i];
        if (d.end <= t) {
            personTrackNowData.push(d);
        }
    }

    //绘制用户轨迹图层
    let polylines = L.motion.seq(personTrackNowData.map((d, i) => {

        const html = `<div class="popup">` +
            `<p>user:${d.imsi}</p>` +
            `<p>source Lat:${stationData[d.source].latitude}</p>` +
            `<p>source Lng:${stationData[d.source].longitude}</p>` +
            `<p>target Lat:${stationData[d.target].latitude}</p>` +
            `<p>target Lng:${stationData[d.target].longitude}</p>` +
            `<p>start time:${d.start}</p>` +
            `<p>end time:${d.end}</p>` +
            `<p>type:${trackType(d.type)}</p>` +
            `<p>speed:${d.speed} km/h</p>` +
            `</div>`;

        return L.motion.polyline([[stationData[d.source].latitude, stationData[d.source].longitude],
        [stationData[d.target].latitude, stationData[d.target].longitude]], {
            weight: 5,
            color: colType(d.type),
            opacity: spd(d.speed),
        }, {
            auto: i == 0 ? true : false,
        }, {
            removeOnEnd: true,
            icon: L.divIcon({ html: `<span  class='fa iconfont icon-${trackType(d.type)}'  style='color:${colType(d.type)}; '></span>`, iconSize: L.point(27.5, 24) })
        })
            .motionDuration((d.end >= preT && d.end <= t) ? 200 : (i == 0) ? 0.00001 : 0)
            .bindPopup(html)
            .bindTooltip(html, { sticky: true });
    }));
    polylines.motionStart();
    personTrackLayer.addLayer(polylines);
}


//更新的特定地点时序流量图层
function changeTemporalFlowData() {
    //时序流量图层
    let pieLayers = L.layerGroup(stationData.map((plott, i) => {
        //基站的时序流量数据
        let temporalFlowNowData = temporalFlowData[plott.newPlot];

        //pie
        let outerHeightRange = [90, 110];
        let innerHeightRange = [70, 76]
        let pieOuterRadius = d3.scaleLinear()
            .domain([d3.min(temporalFlowNowData), d3.max(temporalFlowNowData)])
            .range(outerHeightRange);
        let generator = d3.pie().value(1);
        let slices = generator(temporalFlowNowData);
        let outerData = slices.map((d, i) => {
            return {
                innerRadius: innerHeightRange[1],
                outerRadius: pieOuterRadius(temporalFlowNowData[i]),
                startAngle: d.startAngle,
                endAngle: d.endAngle,
                padAngle: 0.03,
                flow: temporalFlowNowData[i],
            };
        });
        let innerData = slices.map((d, i) => {
            return {
                innerRadius: innerHeightRange[0],
                outerRadius: innerHeightRange[1],
                startAngle: d.startAngle,
                endAngle: d.endAngle,
                padAngle: 0,
            };
        });

        //arc
        let arc = d3.arc();

        //color
        let colScale = d3.scaleLinear()
            .domain([d3.min(temporalFlowNowData), d3.max(temporalFlowNowData)])
            .range([0.2, 0.7]);
        let colorPie = d => {
            return d3.interpolateYlOrRd(colScale(d));
        };

        return L.d3SvgOverlay(function (selection, projection) {
            //绘制外层环形柱状图
            selection.selectAll(".outer-path")
                .data(outerData)
                .join("path")
                .attr("class", "outer-path")
                .attr('pointer-events', 'all')
                .attr("d", arc)
                .style("fill", function (d, i) { return colorPie(d.flow); })
                .style("opacity", "1")
                .on("mouseover", function (d, i) {
                    selection.selectAll(".outer-path").style("opacity", "0.5");
                    d3.select(this).style("opacity", "1")
                        .attr("d", function (d, i) {
                            return arc({
                                innerRadius: d.innerRadius,
                                outerRadius: d.outerRadius + 10,
                                startAngle: d.startAngle,
                                endAngle: d.endAngle,
                                padAngle: d.padAngle,
                            });
                        });
                })
                .on("mouseout", function (d, i) {
                    selection.selectAll(".outer-path").style("opacity", "1")
                        .attr("d", arc);
                });

            //绘制外层标签
            selection.selectAll(".outer-text")
                .data(outerData)
                .join("text")
                .attr("class", "outer-text")
                .attr("transform", (d, i) => {
                    let ac = arc.centroid(d);
                    return "translate(" + ac[0] + "," + ac[1] + ") ";
                })
                .attr("font-family", "sans-serif")
                .attr("font-size", 12)
                .attr("text-anchor", "middle")
                .call(text => text.append("tspan")
                    .attr("y", "0.2em")
                    .attr("fill-opacity", 0.5)
                    .text((d, i) => d.flow));

            //绘制内层环形
            selection.selectAll(".inner-path")
                .data(innerData)
                .join("path")
                .attr("class", "inner-path")
                .attr("d", arc)
                .style("fill", "rgb(61, 90, 177)")
                .style("opacity", "0.3");

            //绘制内层标签
            selection.selectAll(".inner-text")
                .data(innerData)
                .join("text")
                .attr("class", "inner-text")
                .attr("transform", (d, i) => {
                    let ac = arc.centroid(d);
                    return "translate(" + ac[0] + "," + ac[1] + ") ";
                })
                .attr("font-family", "sans-serif")
                .attr("font-size", 5)
                .attr("text-anchor", "middle")
                .call(text => text.append("tspan")
                    .attr("y", "0.15em")
                    .attr("fill-opacity", 1)
                    .text((d, i) => i));
        }, {
            "zoomDraw": false,
            "zoomAble": false,
            "interactive": true,
            "center": [plott.latitude, plott.longitude],
        });

    }));
    let pieLayerGroup = pieLayers.getLayers();

    //添加基站图层
    let stationMarkers = L.layerGroup(stationData.map((d, i) => {
        const html = `<div class="popup">` +
            `<p>Lat:${d.latitude}</p>` +
            `<p>Lng:${d.longitude}</p>` +
            `<p>id:${d.newPlot}</p></div>`;
        return L.circleMarker([d.latitude, d.longitude], {
            radius: 3,
            fillColor: "white",
            color: "grey",
            weight: 1,
            opacity: 0.5,
            fillOpacity: 0.5,
            isClick: false,
        })
            .bindTooltip(html, { sticky: true })
            .on("click", function (e) {
                if (e.target.options.isClick == false) {
                    L.setOptions(e.target, { "isClick": true, });
                    e.target.setStyle({
                        radius: 5,
                        fillColor: 'orange',
                        color: "orange",
                    });
                    temporalFlowLayer.addLayer(pieLayerGroup[d.newPlot]);
                }
                else {
                    L.setOptions(e.target, { "isClick": false, });
                    e.target.setStyle({
                        radius: 3,
                        fillColor: "white",
                        color: "grey",
                    });
                    temporalFlowLayer.removeLayer(pieLayerGroup[d.newPlot]);
                }

            });

    }));
    temporalFlowLayer.addLayer(stationMarkers);
}


//更新t时刻的地图所有图层
function changeMapData(t) {
    curTime = t;
    changeHeatmapData();
    changeSpaceFlowData();
    changePersonTrackData();
}

//更新user用户的图层
function changeUserData(user) {
    curUser = user;
    changePersonTrackData();
}

//--初始化地图参数--
function initMap() {
    //读取数据
    stationData = d3.csvParse(getData("data/newStation.csv"));
    spaceVolumeData = getData("data/spaceVolumeDataset.json");
    spaceStayData = getData("data/spaceStayDataset.json");
    spaceTripData = getData("data/spaceTripDataset.json");
    stationBoxesMap = getData("data/stationBoxesMap.json");
    let personTrackOriData = d3.csvParse(getData("data/TripModeResult.csv"));

    //出行驻留数据
    stayDomain = [d3.min(spaceStayData, d => d3.min(Object.keys(d), dd => d[dd])), d3.max(spaceStayData, d => d3.max(Object.keys(d), dd => d[dd]))];
    tripDomain = [d3.min(spaceTripData, d => d3.min(Object.keys(d), dd => d[dd].weight)), d3.max(spaceTripData, d => d3.max(Object.keys(d), dd => d[dd].weight))];


    //特定地点时序流量数据
    temporalFlowData = {};
    for (plot in stationData) {
        if (plot == "columns")
            continue;
        temporalFlowData[plot] = new Array(24).fill(0);
    }
    for (t in spaceVolumeData) {
        let hour = Math.floor(t / 12);
        for (plot in spaceVolumeData[t]) {
            temporalFlowData[plot][hour] += spaceVolumeData[t][plot];
        }
    }

    //个人轨迹数据
    personTrackData = {};
    userList = new Set();
    speedDomain = [Infinity, -1];
    for (i in personTrackOriData) {
        if (i == "columns")
            continue;
        let d = personTrackOriData[i];
        if (!userList.has(d.imsi)) {
            userList.add(d.imsi);
            personTrackData[d.imsi] = [];
        }
        let len = L.latLng(stationData[d.startPlot].latitude, stationData[d.startPlot].longitude)
            .distanceTo(L.latLng(stationData[d.endPlot].latitude, stationData[d.endPlot].longitude));
        let startDate = new Date(parseInt(d.start));
        let endDate = new Date(parseInt(d.end));
        let sec = (endDate - startDate) / 1000;
        let speed = len * 3.6 / sec;
        speedDomain[0] = Math.min(speedDomain[0], speed);
        speedDomain[1] = Math.max(speedDomain[1], speed);
        personTrackData[d.imsi].push({
            "imsi": d.imsi,
            "start": startDate,
            "end": endDate,
            "source": d.startPlot,
            "target": d.endPlot,
            "type": d.type,
            "len": len,
            "sec": sec,
            "speed": speed,
        });
    };
    for (user in personTrackData) {
        personTrackData[user].sort((a, b) => {
            if (a.start != b.start)
                return a.start < b.start;
            else
                return a.end < b.end;
        });
    };
    curUser = Array.from(userList)[0];

    //添加个人轨迹的图例
    personTrackLayer.on("add", e => {
        map.addControl(colorLegend);
    });
    personTrackLayer.on("remove", e => {
        map.removeControl(colorLegend);
    });

    //加载特定地点时序流量视图
    changeTemporalFlowData();
}

initMap();
