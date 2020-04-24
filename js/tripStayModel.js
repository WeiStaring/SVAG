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
    drawForceDirectedGraph();
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

function drawForceDirectedGraph(){
    var marge = {top:0,right:0,bottom:0,left:0};
    d3.select('#info_frame_down').selectAll('svg').remove();
    console.log(curTime);
    var svg = d3.select('#info_frame_down').append('svg').attr('width',380).attr('height',345);
    var width = svg.attr('width');
    var height = svg.attr('height');
    var g = svg.append('g').attr('transform','translate('+marge.left+','+marge.top+')');
    let tripedges = tripData[curTime];
    let set = new Set();
    for(let i=0;i<tripedges.length;i++){
        set.add(Number(tripedges[i].source));
        set.add(Number(tripedges[i].target));
    }
    let tempStayData = stayData[curTime];
    console.log(tempStayData);
    let nodes=[];
    for (let item of set) {
        console.log(item);
        let stay=1;
        if(tempStayData.hasOwnProperty(String(item))){
            stay = tempStayData[item];
        }
        let nd={
            "name":String(item),
            "stay":stay
        };
        nodes.push(nd);
    }
    console.log(nodes);    
    let map=new Map();
    let cnt=0;
    for(let val of set.values()) {
        map.set(val,cnt);
        cnt++;
    }
    let edges=[];
    for(let i=0;i<tripedges.length;i++){
        let start = Number(tripedges[i].source);
        let end = Number(tripedges[i].target);
        let ed={
            "source":map.get(start),
            "target":map.get(end),
            "value":tripedges[i].weight
        };
        edges.push(ed);
    }
    var colorScale = d3.scaleOrdinal().domain(d3.range(nodes.length)).range(d3.schemeCategory10);
    // 新建力导向图
    var forceSimulation = d3.forceSimulation()
        .force('link',d3.forceLink())
        .force('charge',d3.forceManyBody())
        .force('center',d3.forceCenter());
    // 生成节点
    forceSimulation.nodes(nodes)
        .on('tick',render);
    // 生成边集
    forceSimulation.force('link')
        .links(edges)
        .distance(function(d){
        return d.value*50;
        });
    // 力导向图中心位置
    forceSimulation.force('center')
        .x(width/2)
        .y(height/2);
    let marker=
        svg.append("marker")
        //.attr("id", function(d) { return d; })
            .attr("id", "resolved")
            //.attr("markerUnits","strokeWidth")//设置为strokeWidth箭头会随着线的粗细发生变化
            .attr("markerUnits","userSpaceOnUse")
            .attr("viewBox", "0 -5 10 10")//坐标系的区域
            .attr("refX",32)//箭头坐标
            .attr("refY", -1)
            .attr("markerWidth", 6)//标识的大小
            .attr("markerHeight", 6)
            .attr("orient", "auto")//绘制方向，可设定为：auto（自动确认方向）和 角度值
            .attr("stroke-width",2)//箭头宽度
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")//箭头的路径
            .attr('fill','#000000');//箭头颜色
    // 边
    var links = g.append('g')
        .selectAll('line')
        .data(edges)
        .enter()
        .append('line')
        .attr('stroke',function(d,i){
            return 'black';
        })
        .attr('stroke-width',function (d,i) {
            return d.value;
        })
        .attr("marker-end", "url(#resolved)" );
    // 边上的文字

    //节点
    var gs = g.selectAll('.node')
        .data(nodes)
        .enter()
        .append('g')
        .call(
        d3.drag()
        .on('start',started)
        .on('drag',dragged)
        .on('end',ended)
        );
    gs.append('circle')
        .attr('r',function (d,i) {
            return d.stay;
        })
        .attr('fill',function(d,i){
        return '#ccc';
        });
    gs.append('text')
        .text(function(d,i){
        return d.name;
        })
        .attr('width',100)
        .attr('height',30)
        .attr('text-anchor','middle')
        .attr('x',0)
        .attr('y',-10)
        .attr('fill',function(d,i){
        return 'black';
        })
        .style('font-size',10);
    function started(d){
        if(!d3.event.active){
        forceSimulation.alphaTarget(0.8).restart();
        }
        d.fx = d.x;
        d.fy = d.y;
    }
    function dragged(d){
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }
    function ended(d){
        if(!d3.event.active){
        forceSimulation.alphaTarget(0);
        }
        d.fx = null;
        d.fy = null;
    }
    function render(){
        // 线的位置
        links.attr('x1',function(d){
        return d.source.x;
        });

        links.attr('y1',function(d){
        return d.source.y;
        });

        links.attr('x2',function(d){
        return d.target.x;
        });

        links.attr('y2',function(d){
        return d.target.y;
        });
        // 线上的文字的位置
/*        linksText.attr('x',function(d){
        return (d.source.x+d.target.x)/2;
        })
        linksText.attr('y',function(d){
        return (d.source.y + d.target.y)/2;
        })*/
        //圆点的位置
        gs.attr('transform',function(d,i){
        return 'translate('+d.x+','+d.y+')';
        })
    }
}