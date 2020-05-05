//交通流量图层总集合
var flowLayerGroup = L.layerGroup();
//方格标签图层
var boxMarkerLayer = L.layerGroup();
//方格标签图层(大小)
var boxLayer = L.layerGroup();
//热力图层
var heatmapLayer = L.layerGroup();
//特定地点时序流量图层
var temporalFlowLayer = L.layerGroup();
//饼图图层集合
var pieLayer = L.layerGroup();
//出行驻留图层集合
var tripStayLayer = L.layerGroup();

//--更新图层数据--

function initPieLayer() {

    //时序流量图层
    stationBoxesMap.forEach((plott, i) => {
        //基站的时序流量数据
        let temporalFlowNowData = temporalFlowData[plott.id];

        //pie
        let outerHeightRange = [90, 110];
        let innerHeightRange = [70, 76];
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
                    .text((d, i) => ~~(d.flow / 12)));

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
                .attr("font-size", 6)
                .attr("text-anchor", "middle")
                .call(text => text.append("tspan")
                    .attr("y", "0.2em")
                    .attr("fill", "white")
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
function changeHeatmapData() {
    let t = curTime;
    if (!map.hasLayer(heatmapLayer))
        return;
    //清除原有图层
    heatmapLayer.clearLayers();

    //获取t时刻的数据
    let spaceVolumeNowData = [];
    let maxValue = -1;
    for (let j in spaceVolumeData[t]) {
        maxValue = Math.max(maxValue, spaceVolumeData[t][j]);
        spaceVolumeNowData.push({ 'lat': stationBoxesMap[j].latitude, 'lng': stationBoxesMap[j].longitude, 'value': spaceVolumeData[t][j] });
    }

    var cfg = {
        "radius": 0.08,
        "maxOpacity": .8,
        "scaleRadius": true,
        "useLocalExtrema": false,
        latField: 'lat',
        lngField: 'lng',
        valueField: 'value',
        //自定义颜色
        // gradient: {
        //     .4: "blue",
        //     .6: "cyan",
        //     .7: "lime",
        //     .8: "yellow",
        //     1: "red",
        // },
    };
    var heatmap = new HeatmapOverlay(cfg);
    heatmap.setData({
        max: maxValue,
        data: spaceVolumeNowData,
    });
    heatmapLayer.addLayer(heatmap);

}

function drawMatrixPlot() {
    function makeMatrixData() {
        let res = [];
        for (let row in temporalFlowData) {
            res.push(temporalFlowData[row])
        }
        return res;
    }
    cleanInfoDown();
    d3.select('#info_frame_down_title')
        .text('矩阵图');
    let margin = { left: 25, top: 25, right: 25, bottom: 25 };
    let info_svg_down = d3.select("#info_frame_down").append('svg');
    const width = info_svg_down.node().parentNode.clientWidth;
    const height = info_svg_down.node().parentNode.clientHeight;
    info_svg_down
        .attr('width', width)
        .attr('height', height - margin.top)
        .attr('transform', 'translate(0,-10)');

    let linear = d3.scaleLinear()
        .domain([0, 30])
        .range([0, 1]);
    let color = d3.interpolate('white', 'red');
    let mat = makeMatrixData();
    // console.log(mat);
    //draw
    let matG = info_svg_down.append('g')
        .attr('transform', `translate(${margin.left},${margin.right})`);
    let cellSizeX = 1.5, cellSizeY = 14;
    for (let i = 0; i < mat.length; i++) {
        for (let j = 0; j < mat[0].length; j++) {
            matG.append("rect")
                .attr("width", cellSizeY)
                .attr("height", cellSizeX)
                .attr("x", j * cellSizeY)
                .attr("y", i * cellSizeX)
                .attr("fill", color(linear(mat[i][j])))
                .attr('stroke-width', 0.1);
        }
    }
    let textG = info_svg_down.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    textG.selectAll('text')
        .data([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23])
        .enter()
        .append('text')
        .text(function (d) {
            return d;
        }).attr('transform', function (d, i) {
            if (i < 10)
                return `translate(${i * cellSizeY + 6},${0})`;
            else
                return `translate(${i * cellSizeY + 3},${0})`;

        }).style('font-size', 10);
}

function drawBarPlot() {
    clearInfoUp();
    let margin = { left: 25, top: 25, right: 25, bottom: 25 };
    d3.select('#info_frame_up_title')
        .text('柱状图');
    let info_svg_up = d3.select("#info_frame_up").append('svg');
    const width = info_svg_up.node().parentNode.clientWidth;
    const height = info_svg_up.node().parentNode.clientHeight - margin.top;
    info_svg_up
        .attr('width', width)
        .attr('height', height)
        .attr('transform', 'translate(0,0)');

    function makeBarData() {
        let data = [];
        let t = curTime;
        for (let key in spaceVolumeData[t]) {
            data.push([key, spaceVolumeData[t][key]])
        }
        data = data.sort(function (a, b) {
            return b[1] - a[1];
        });
        return data;
    }
    let data = makeBarData();
    let xScale = d3.scaleBand().domain(d3.range(data.length)).range([0, width - margin.left - margin.left]);
    let yScale = d3.scaleLinear().domain([0, d3.max(data, d => d[1]) + 1]).range([0, height - margin.top - margin.bottom]);
    let rectPad = 10;
    info_svg_up.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)
        .selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr("width", rectPad)
        .attr("height", function (d, i) {
            return yScale(d[1]);
        })
        .attr("x", function (d, i) {
            return xScale(i) + rectPad / 2;
        })
        .attr("y", function (d, i) {
            return height - margin.top - margin.bottom - yScale(d[1]);
        })
        .attr('fill', 'white');
    info_svg_up.append('g')
        .attr('transform', `translate(${margin.left},${height - margin.top})`)
        .selectAll('text')
        .data(data)
        .enter()
        .append('text')
        .text(function (d) {
            return d[0];
        }).attr('transform', function (d, i) {
            return `translate(${xScale(i) + rectPad / 2},${10})`;
        }).style('font-size', 10);

    info_svg_up.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)
        .selectAll('text')
        .data(data)
        .enter()
        .append('text')
        .text(function (d) {
            return d[1];
        }).attr('transform', function (d, i) {
            return `translate(${xScale(i) + rectPad / 2},${height - margin.top - margin.bottom - yScale(d[1]) - 10})`;
        }).style('font-size', 10);
}
//更新t时刻的特定地点时序流量图层
function changeTemporalFlowData() {
    let t = curTime;

    if (!map.hasLayer(boxMarkerLayer) || !map.hasLayer(temporalFlowLayer))
        return;

    //清除原有图层
    boxMarkerLayer.clearLayers();
    temporalFlowLayer.clearLayers();

    let rankList = [];
    let sortList = Array.from(Array(stationBoxesMap.length), (item, index) => index);
    sortList.sort(function (a, b) {
        let va = (sortList[a] in spaceVolumeData[t]) ? spaceVolumeData[t][sortList[a]] : 0;
        let vb = (sortList[b] in spaceVolumeData[t]) ? spaceVolumeData[t][sortList[b]] : 0;
        return vb - va;
    });

    for (let i in sortList) {
        rankList[sortList[i]] = i;
    }

    let pieLayerGroup = pieLayer.getLayers();

    //添加方格图层
    let circleMarker = L.d3SvgOverlay(function (selection, projection) {
        var geojsonBox = [];
        for (let i = 0; i < stationBoxesMap.length; i++) {
            let tmp = {
                "type": "Feature",
                "properties": {
                    "id": stationBoxesMap[i].id,
                    "isClick": false,
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [stationBoxesMap[i].longitude, stationBoxesMap[i].latitude],
                }
            };
            geojsonBox.push(tmp);
        }

        selection.selectAll('path')
            .data(geojsonBox)
            .join('path')
            .attr("class", "boxCircle")
            .attr('d', projection.pathFromGeojson)
            .style('fill', "white")
            .style('stroke', "grey")
            .style('opacity', '0.5')
            .style('stroke-width', d => {
                d.properties.width = 2 / projection.scale;
                return 2 / projection.scale;
            })
            .on("click", function (d) {
                if (d.properties.isClick == false) {
                    d.properties.isClick = true;
                    d3.select(this)
                        .style('fill', "orange")
                        .style('stroke', "orange");
                    temporalFlowLayer.addLayer(pieLayerGroup[d.properties.id]);
                }
                else {
                    d.properties.isClick = false;
                    d3.select(this)
                        .style('fill', "white")
                        .style('stroke', "grey");
                    temporalFlowLayer.removeLayer(pieLayerGroup[d.properties.id]);
                }
            });
    }, {
        "zoomDraw": false,
        "zoomAble": true,
        "interactive": true,
    });

    boxMarkerLayer.addLayer(circleMarker);

    drawBarPlot();
}




//初始化交通流量图层
function initFlowLayer() {
    initPieLayer();
}

//绘制交通流量图层
function drawFlowLayer() {
    flowLayerGroup.addLayer(boxMarkerLayer);
    flowLayerGroup.addLayer(heatmapLayer);
    flowLayerGroup.addLayer(temporalFlowLayer);
}

//清除交通流量图层
function cleanFlowLayer() {
    flowLayerGroup.removeLayer(boxMarkerLayer);
    flowLayerGroup.removeLayer(heatmapLayer);
    flowLayerGroup.removeLayer(temporalFlowLayer);
}