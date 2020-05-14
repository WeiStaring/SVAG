var tripLayer = L.layerGroup();
function drawTripStayLayer() {
    tripStayLayer.addLayer(boxLayer);
    tripStayLayer.addLayer(tripLayer);
    tripStayinfo();
}
function changeTripStayData() {
    let tripLineList = [];
    tripLayer.clearLayers();
    boxLayer.clearLayers();

    //添加方格图层
    let circleMarker = L.d3SvgOverlay(function (selection, projection) {
        var geojsonBox = [];
        for (let i = 0; i < stationBoxesMap.length; i++) {
            let stay = stayData[curTime];
            let r = 1;
            if (stay.hasOwnProperty(stationBoxesMap[i].id)) {
                r = stay[stationBoxesMap[i].id] / 2 + 1;
            }

            let tmp = {
                "type": "Feature",
                "properties": {
                    "r": r,
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
            .attr("class", "boxCircleTripStayModel")
            .attr('d', projection.pathFromGeojson)
            .style('fill', "white")
            .style('stroke', "grey")
            .style('opacity', '0.5')
            .style('stroke-width', d => {
                return d.properties.r / projection.scale;
            })
            .on("click", function (d) {
                tripStayinfo(d.properties.id);
                d3.selectAll(".boxCircleTripStayModel")
                    .style('fill', "white")
                    .style('stroke', "grey");
                d3.select(this)
                    .style('fill', "orange")
                    .style('stroke', "orange");
            });
    }, {
        "zoomDraw": false,
        "zoomAble": true,
        "interactive": true,
    });
    boxLayer.addLayer(circleMarker);

    let trips = tripData[curTime];
    for (let i = 0; i < trips.length; i++) {
        let start = stationBoxesMap[trips[i].source];
        let end = stationBoxesMap[trips[i].target];
        let tripLine = {
            "type": "Feature",
            "properties": {
                "weight": trips[i].weight,
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [[start.longitude, start.latitude],
                [end.longitude, end.latitude]]
            }
        };
        tripLineList.push(tripLine);
    }
    let tripSvgLayer = L.d3SvgOverlay(function (selection, projection) {
        let defs = selection.append("defs");
        for(let i=0;i<tripLineList.length;i++) {
            let pos = tripLineList[i].geometry.coordinates;
            let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
            if (pos[0][0] > pos[1][0]) {
                x1 = 100;
            } else {
                x2 = 100;
            }
            if (pos[0][1] > pos[1][1]) {
                y2 = 100;
            } else {
                y1 = 100;
            }

            let linerGradient = defs.append("linearGradient")
                .attr("id", "linearColor" + i)
                .attr("x1", x1 + "%")
                .attr("y1", y1 + "%")
                .attr("x2", x2 + "%")
                .attr("y2", y2 + "%");
            linerGradient.append("stop")
                .attr("offset", "0%")
                .style("stop-color", d3.rgb('white').toString());
            linerGradient.append("stop")
                .attr("offset", "100%")
                .style("stop-color", d3.rgb('red').toString());

            selection.append('g').selectAll('path')
                .data([tripLineList[i]])
                .enter()
                .append('path')
                .attr('d', function (d){
                    let pos = tripLineList[i].geometry.coordinates;
                    let objString = JSON.stringify(d);
                    let res = JSON.parse(objString);
                    if (pos[0][0] == pos[1][0]){
                        res.geometry.coordinates[1][0]+=0.001
                    }else if(pos[0][1] == pos[1][1]){
                        res.geometry.coordinates[1][1]+=0.001
                    }
                    return projection.pathFromGeojson(res);
                })
                // .attr('stroke', 'white')
                .attr("stroke", "url(#" + linerGradient.attr("id") + ")")
                .style('opacity', function (d) {
                    return 0.75;
                })
                .style('stroke-width', d => {
                    d.properties.width = d.properties.weight * 2 / projection.scale;
                    console.log(d.properties.width,d.properties.weight,projection.scale);
                    return d.properties.width;
                });
        }

    }, {
        "zoomDraw": false,
        "zoomAble": true,
        "interactive": true,
    });
    tripLayer.addLayer(tripSvgLayer);
    if (tripStayButtonIsClicked == 1)
        drawForceDirectedGraph();
}

function tripStayinfo(plot = 0) {
    let margin = { left: 25, top: 25, right: 25, bottom: 25 };
    clearInfoUp();
    let info_svg_up = d3.select("#info_frame_up").append('svg');
    const width = info_svg_up.node().parentNode.clientWidth;
    const height = info_svg_up.node().parentNode.clientHeight - margin.top;
    info_svg_up
        .attr('width', width)
        .attr('height', height)
        .attr('transform', 'translate(0,0)');

    d3.select('#info_frame_up_title')
        .text('折线图');

    let legend = info_svg_up.append('g');
    let lgline1 = legend.append('line')
        .attr('x1', 100)
        .attr('y1', 8)
        .attr('x2', 120)
        .attr('y2', 8)
        .attr('stroke', '#e5a1a1')
        .attr('stroke-width', 5);
    let lgtext1 = legend.append('text')
        .attr('class', 'legend-label')
        .attr("dy", -6)
        .attr("dx", 110)
        .style("text-anchor", "start")
        .text("流入")
        .attr('fill', 'white')
        .attr('font-size', '13')
        .attr("transform", "translate(" + 18 + "," + 20 + ")");
    let lgline2 = legend.append('line')
        .attr('x1', 180)
        .attr('y1', 8)
        .attr('x2', 200)
        .attr('y2', 8)
        .attr('stroke', '#b2e0a1')
        .attr('stroke-width', 5);
    let lgtext2 = legend.append('text')
        .attr('class', 'legend-label')
        .attr("dy", -6)
        .attr("dx", 190)
        .style("text-anchor", "start")
        .text("流出")
        .attr('fill', 'white')
        .attr('font-size', '13')
        .attr("transform", "translate(" + 18 + "," + 20 + ")");
    let lgline3 = legend.append('line')
        .attr('x1', 250)
        .attr('y1', 8)
        .attr('x2', 270)
        .attr('y2', 8)
        .attr('stroke', '#91b7f1')
        .attr('stroke-width', 5);
    let lgtext3 = legend.append('text')
        .attr('class', 'legend-label')
        .attr("dy", -6)
        .attr("dx", 260)
        .style("text-anchor", "start")
        .text("驻留")
        .attr('fill', 'white')
        .attr('font-size', '13')
        .attr("transform", "translate(" + 18 + "," + 20 + ")");

    let tempTripInData = [], tempTripOutData = [], tempStayData = [];
    for (let i = 0; i < 288; i++) {
        tempTripInData.push(0);
        tempTripOutData.push(0);
        tempStayData.push(0);
    }
    for (let i = 0; i < 288; i++) {
        if (stayData[i].hasOwnProperty(plot))
            tempStayData[i] = stayData[i][plot];
        for (let k = 0; k < tripData[i].length; k++) {
            if (tripData[i][k].source == plot) {
                tempTripOutData[i] += tripData[i][k].weight
            }
            if (tripData[i][k].target == plot) {
                tempTripInData[i] += tripData[i][k].weight
            }
        }
    }

    // var scale_x = d3.scaleTime()
    //     .domain([new Date(2018, 9, 3, 0, 0, 0), new Date(2018, 9, 3, 24, 0, 0)])
    //     .range([margin.left, width - margin.right]);
    var scale_x = d3.scaleLinear()
        .domain([0, 288])
        .range([margin.left, width - margin.right]);
    var scale_y = d3.scaleLinear()
        .domain([0, Math.max(d3.max(tempTripInData), d3.max(tempTripOutData), d3.max(tempStayData))])
        .range([height - margin.bottom, margin.top]);
    // 画轴

    var yAxis = d3.axisLeft(scale_y).ticks(5);

    let timeScale = d3.scaleTime()
        .domain([new Date(2018, 9, 3, 0, 0, 0), new Date(2018, 9, 3, 24, 0, 0)])//d3.extent(sumFlowData, d => d.time)
        .range([margin.left, width-margin.right]);
    let xAxis = d3.axisBottom(timeScale).ticks(d3.timeHour.every(4)).tickFormat(d3.timeFormat("%H:%M"));
    info_svg_up.append("g")
        .attr('class','axis')
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(xAxis);
    info_svg_up.append('g')
        .attr('class','axis')
        .attr("transform", `translate(${margin.left},0)`)
        .call(yAxis);

    //画线函数
    var line_generator = d3.line()
        .x(function (d, i) {
            return scale_x(i);
        })
        .y(function (d) {
            return scale_y(d);
        })
        .curve(d3.curveBundle);

    info_svg_up.append('g').append("path")
        .attr("d", line_generator(tempTripInData))
        .style("stroke-width", 1)
        .style("stroke", '#e5a1a1')
        .style("fill", "none")
        .style('stroke-opacity', 0.7);

    info_svg_up.append('g').append("path")
        .attr("d", line_generator(tempTripOutData))
        .style("stroke-width", 1)
        .style("stroke", '#b2e0a1')
        .style("fill", "none")
        .style('stroke-opacity', 0.7);

    info_svg_up.append('g').append("path")
        .attr("d", line_generator(tempStayData))
        .style("stroke-width", 1)
        .style("stroke", '#91b7f1')
        .style("fill", "none")
        .style('stroke-opacity', 0.7);
}

function cleanTripLayer() {
    tripStayLayer.removeLayer(boxLayer);
    tripStayLayer.removeLayer(tripLayer);
}

function drawForceDirectedGraph() {
    let margin = { left: 25, top: 25, right: 25, bottom: 25 };

    d3.select('#info_frame_down').selectAll('svg').remove();

    d3.select('#info_frame_down_title')
        .text('力导向图');

    var svg = d3.select('#info_frame_down').append('svg');
    const width = svg.node().parentNode.clientWidth;
    const height = svg.node().parentNode.clientHeight - margin.top;
    svg
        .attr('width', width)
        .attr('height', height)
        .attr('transform', 'translate(0,0)');

    var g = svg.append('g');
    let tripedges = tripData[curTime];
    let set = new Set();
    for (let i = 0; i < tripedges.length; i++) {
        set.add(Number(tripedges[i].source));
        set.add(Number(tripedges[i].target));
    }
    let tempStayData = stayData[curTime];
    // console.log(tempStayData);
    let nodes = [];
    for (let item of set) {
        // console.log(item);
        let stay = 1;
        if (tempStayData.hasOwnProperty(String(item))) {
            stay = tempStayData[item];
        }
        let nd = {
            "name": String(item),
            "stay": stay
        };
        nodes.push(nd);
    }

    let map = new Map();
    let cnt = 0;
    for (let val of set.values()) {
        map.set(val, cnt);
        cnt++;
    }
    let edges = [];
    for (let i = 0; i < tripedges.length; i++) {
        let start = Number(tripedges[i].source);
        let end = Number(tripedges[i].target);
        let ed = {
            "source": map.get(start),
            "target": map.get(end),
            "value": tripedges[i].weight
        };
        edges.push(ed);
    }
    var colorScale = d3.scaleOrdinal().domain(d3.range(nodes.length)).range(d3.schemeCategory10);
    // 新建力导向图
    var forceSimulation = d3.forceSimulation()
        .force('link', d3.forceLink())
        .force('charge', d3.forceManyBody().strength(-5))/*.distanceMax(10000).distanceMin(10000))*/
        .force('center', d3.forceCenter());
    // 生成节点
    forceSimulation.nodes(nodes)
        .on('tick', render);
    // 生成边集
    forceSimulation.force('link')
        .links(edges)
        .distance(function (d) {
            return d.value * 50;
        });
    // 力导向图中心位置
    forceSimulation.force('center')
        .x(width / 2)
        .y(height / 2);
    let marker =
        svg.append("marker")
            //.attr("id", function(d) { return d; })
            .attr("id", "resolved")
            .attr("markerUnits", "strokeWidth")//设置为strokeWidth箭头会随着线的粗细发生变化
            .attr("markerUnits", "userSpaceOnUse")
            .attr("viewBox", "0 -5 10 10")//坐标系的区域
            .attr("refX", 32)//箭头坐标
            .attr("refY", -1)
            .attr("markerWidth", 6)//标识的大小
            .attr("markerHeight", 6)
            .attr("orient", "auto")//绘制方向，可设定为：auto（自动确认方向）和 角度值
            .attr("stroke-width", 2)//箭头宽度
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")//箭头的路径
            .attr('fill', '#FFFFFF');//箭头颜色
    // 边
    var links = g.append('g')
        .selectAll('line')
        .data(edges)
        .enter()
        .append('line')
        .attr('stroke', function (d, i) {
            return 'white';
        })
        .attr('stroke-width', function (d, i) {
            return d.value;
        })
        .attr("marker-end", "url(#resolved)");
    // 边上的文字

    //节点
    var gs = g.selectAll('.node')
        .data(nodes)
        .enter()
        .append('g')
        .call(
            d3.drag()
                .on('start', started)
                .on('drag', dragged)
                .on('end', ended)
        );
    gs.append('circle')
        .attr('r', function (d, i) {
            return d.stay * 2;
        })
        .attr('fill', function (d, i) {
            return '#a6e7dc';
        });
    gs.append('text')
        .text(function (d, i) {
            return d.name;
        })
        .attr('width', 100)
        .attr('height', 30)
        .attr('text-anchor', 'middle')
        .attr('x', 0)
        .attr('y', -10)
        .attr('fill', function (d, i) {
            return 'white';
        })
        .style('font-size', 10);
    function started(d) {
        if (!d3.event.active) {
            forceSimulation.alphaTarget(0.8).restart();
        }
        d.fx = d.x;
        d.fy = d.y;
    }
    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }
    function ended(d) {
        if (!d3.event.active) {
            forceSimulation.alphaTarget(0);
        }
        d.fx = null;
        d.fy = null;
    }
    function render() {
        // 线的位置
        links.attr('x1', function (d) {
            return validateXY(d.source.x, 'x');
        });

        links.attr('y1', function (d) {
            return validateXY(d.source.y, 'y');
        });

        links.attr('x2', function (d) {
            return validateXY(d.target.x, 'x');
        });

        links.attr('y2', function (d) {
            return validateXY(d.target.y, 'y');
        });
        // 线上的文字的位置
        /*        linksText.attr('x',function(d){
                return (d.source.x+d.target.x)/2;
                })
                linksText.attr('y',function(d){
                return (d.source.y + d.target.y)/2;
                })*/
        //圆点的位置
        gs.attr('transform', function (d, i) {
            return 'translate(' + validateXY(d.x, 'x') + ',' + validateXY(d.y, 'y') + ')';
        })
    }
    function validateXY(val, type) {
        var r = 20;
        if (val < r) return r;
        if (type == 'x') {
            if (val < 0) return r;
            if (val > width) return width - r;
        } else {
            if (val < 0) return r;
            if (val > height) return height - r;
        }
        return val;
    }
}
