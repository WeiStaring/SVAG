//--创建地图--
//地图瓦片链接
var mbUrl = "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=" +
    "pk.eyJ1IjoiMTAwNDE2OTM1NyIsImEiOiJjano2eGtidjIwZjIwM2JxcWcyMjA4a2hsIn0.B097Ij8wdiLwDTXD9PHgwg";
var map = new L.Map('map', {
    center: [41.8, 123.4],
    zoom: 9,
    //minZoom: 0,
    //maxZoom: 20,
    maxBounds: [
        [41, 122],
        [43, 125]
    ],
    layers: [],
});

//--基础图层--
var grayscale = L.tileLayer(mbUrl, { id: 'mapbox/light-v10', tileSize: 512, zoomOffset: -1 }).addTo(map);

//--功能图层--
//方格标签图层
var boxMarkerLayer = L.layerGroup();

//热力图层
var heatmapLayer = L.layerGroup();
//特定地点时序流量图层
var temporalFlowLayer = L.layerGroup();
//饼图图层集合
var pieLayer = L.layerGroup();

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

//--更新图层数据--

function initPieLayer() {

    //时序流量图层
    stationBoxesMap.forEach((plott, i) => {
        //基站的时序流量数据
        let temporalFlowNowData = temporalFlowData[plott.id];

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
                time: i,
            };
        });
        let innerData = slices.map((d, i) => {
            return {
                innerRadius: innerHeightRange[0],
                outerRadius: innerHeightRange[1],
                startAngle: d.startAngle,
                endAngle: d.endAngle,
                padAngle: 0,
                time: i,
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

        let pieSvgLayer = L.d3SvgOverlay(function (selection, projection) {

            //绘制外层环形柱状图
            selection.selectAll(".outer-path")
                .data(outerData)
                .join("path")
                .attr("class", "outer-path")
                .attr("id", d => "outer-path-" + d.time)
                .attr('pointer-events', 'all')
                .attr("d", arc)
                .style("fill", d => colorPie(d.flow))
                .style("opacity", 1)
                .on("mouseover", function (d, i) {
                    d3.select(this).attr("d", function (d, i) {
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
                    selection.selectAll(".outer-path").attr("d", arc);
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
                .style("pointer-events", "none")
                .call(text => text.append("tspan")
                    .attr("y", "0.2em")
                    .attr("fill-opacity", 1)
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

        pieLayer.addLayer(pieSvgLayer);
    });

}

//更新t时刻的热力图层
function changeHeatmapData(t) {
    if (!map.hasLayer(heatmapLayer))
        return;
    //清除原有图层
    heatmapLayer.clearLayers();

    //获取t时刻的数据
    let spaceVolumeNowData = [];
    for (j in spaceVolumeData[t]) {
        spaceVolumeNowData.push([stationBoxesMap[j].latitude, stationBoxesMap[j].longitude, spaceVolumeData[t][j]]);
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
}

//更新t时刻的特定地点时序流量图层
function changeTemporalFlowData(t) {
    if (!map.hasLayer(boxMarkerLayer) || !map.hasLayer(temporalFlowLayer))
        return;

    //清除原有图层
    boxMarkerLayer.clearLayers();
    temporalFlowLayer.clearLayers();
    d3.select(".info-frame").html("");

    let rankList = Array.from(Array(stationBoxesMap.length), (item, index) => index);
    let sortList = rankList.sort(function (a, b) {
        let va = (a in spaceVolumeData[t]) ? spaceVolumeData[t][a] : 0;
        let vb = (b in spaceVolumeData[t]) ? spaceVolumeData[t][b] : 0;
        return vb - va;
    });
    sortList.forEach((d, i) => {
        rankList[d] = i;
    })

    let pieLayerGroup = pieLayer.getLayers();

    //添加方格图层
    stationBoxesMap.forEach((plott, i) => {
        const html = `<div class="popup">` +
            `<p>Lat:${plott.latitude}</p>` +
            `<p>Lng:${plott.longitude}</p>` +
            `<p>id:${plott.id}</p>` +
            `<p>rank:${rankList[plott.id]}</p>` +
            `<p>volume:${(plott.id in spaceVolumeData[t]) ? spaceVolumeData[t][plott.id] : 0}</p>` +
            `</div>`;
        let circleMarker = L.circleMarker([plott.latitude, plott.longitude], {
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
                    temporalFlowLayer.addLayer(pieLayerGroup[plott.id]);
                }
                else {
                    L.setOptions(e.target, { "isClick": false, });
                    e.target.setStyle({
                        radius: 3,
                        fillColor: "white",
                        color: "grey",
                    });
                    temporalFlowLayer.removeLayer(pieLayerGroup[plott.id]);
                }
            });

        boxMarkerLayer.addLayer(circleMarker);
    });

    let divTab = d3.select(".info-frame");

    divTab.style('text-align', 'center')
        .append('text')
        .attr("id", "info-title")
        .style('display', 'inline-block')
        .style('font-size', 'small')
        .style('font-weight', 700)
        .text("区域流量排名");

    divTab.append("div")
        .attr("id", "info-list")
        .style('text-align', 'left')
        .style('width', "95%")
        .style('height', "90%")
        .style("overflow", "auto")
        .style('margin', "2%")
        .style('padding', "2%")
        .style('box-sizing', 'border-box')
        .style('list-style-type', 'none')
        .style("border", `1px solid rgb(232, 226, 217)`)
        .style("border-radius", "2px");

    d3.select("#info-list")
        .selectAll('div')
        .style('text-align', 'center')
        .data(sortList)
        .join('li')
        .style('vertical-align', 'middle')
        .style('line-height', '1em')
        .style('padding-bottom', '0.3em')
        .append('text')
        .attr("id", "liRank")
        .style('display', 'inline-block')
        .style('max-width', '15em')
        .style('padding-left', '5px')
        .style('vertical-align', 'top')
        .style('font-size', '12px')
        .text((d, i) => {
            return "No." + i + " 编号: " + d + " 流量: " + (d in spaceVolumeData[t] ? spaceVolumeData[t][d] : 0);
        })
        .style("background", "white")
        .on("click", function (d) {
            d3.selectAll("#liRank").style('background', "white");
            d3.select(this).style('background', "rgb(215, 228, 233)").attr("isClick", "true");
            boxMarkerLayer.getLayers()[d].options.isClick = false;
            boxMarkerLayer.getLayers()[d].fire("click");
        });
}

//更新t时刻的地图所有图层
function changeMapData() {
    // let timeSlice = Math.ceil((curTime.getHours() * 60 + curTime.getMinutes()) / 5);
    changeHeatmapData(curTime);
    changeTemporalFlowData(curTime);
}

//删除所有图层
function delAllLayer() {
    map.removeLayer(boxMarkerLayer);
    map.removeLayer(heatmapLayer);
    map.removeLayer(temporalFlowLayer);

    d3.select(".info-frame").html("");
}

//添加流量图层
function addFlowLayer() {
    delAllLayer();
    map.addLayer(boxMarkerLayer);
    map.addLayer(heatmapLayer);
    map.addLayer(temporalFlowLayer);

    changeMapData(curTime);
}

//增加出行驻留图层
function addTripLayer() {
    delAllLayer();
}

//增加出行方式图层
function addModeLayer() {
    delAllLayer();
}

//--初始化地图参数--
function initMap() {
    initPieLayer();
}

initMap();