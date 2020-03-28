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
    };
}


function drawInfoTab() {
    let divTab = d3.select(".info-frame");

    let divUser = divTab.append("div")
        .attr("id", "info-user")
        .style('width', "100%")
        .style('height', "64%")
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
        .style('height', "90%")
        .style("overflow", "auto")
        .style('margin', "2%")
        .style('padding', "2%")
        .style('box-sizing', 'border-box')
        .style('list-style-type', 'none')
        .style("border", `1px solid rgb(232, 226, 217)`)
        .style("border-radius", "2px");

    d3.select("#info-user-list")
        .selectAll('div')
        .style('text-align', 'center')
        .data(Array.from(userList))
        .join('li')
        .style('vertical-align', 'middle')
        .style('line-height', '1em')
        .style('padding-bottom', '0.3em')
        .append('text')
        .attr("id", "liName")
        .style('display', 'inline-block')
        .style('max-width', '15em')
        .style('padding-left', '5px')
        .style('vertical-align', 'top')
        .style('font-size', '12px')
        .text(d => d)
        .style("background", "white")
        .on("click", function (d) {
            d3.selectAll("#liName").style('background', "white");
            d3.select(this).style('background', "rgb(215, 228, 233)").attr("isClick", "true");
            curUser = d;
            modeLayerGroup.clearLayers();
            modeLayerGroup.addLayer(personTrackLayer.getLayers()[userLayerMap[curUser]]);
            changeUserLine();
        });

    divTab.append("div")
        .attr("class", "bottom-line");

    let divAnalyze = divTab.append("div")
        .attr("id", "info-analyze")
        .style('width', "100%")
        .style('height', "35%")
        .style("margin", "0 0 5px 0");

    divAnalyze.style('text-align', 'center')
        .append('text')
        .attr("id", "info-analyze-title")
        .style('display', 'inline-block')
        .style('font-size', 'small')
        .style('font-weight', 700)
        .text("分析过程");

    divAnalyze.append("div")
        .attr("id", "info-analyze-div")
        .style('text-align', 'center')
        .style('width', "95%")
        .style('height', "90%")
        .style("overflow", "auto")
        .style('margin', "2%")
        .style('box-sizing', 'border-box')
        .style('list-style-type', 'none');

    d3.select("#info-analyze-div")
        .append("table")
        .attr("id", "info-analyze-table");

    d3.select("#info-analyze-table").html(
        `<tr>` +
        `<th>直线距离：</th>` +
        `<td></td>` +
        `</tr>` +
        `<tr>` +
        `<th>规划距离：</th>` +
        `<td></td>` +
        `</tr>` +
        `<tr>` +
        `<th>直线速度：</th>` +
        `<td></td>` +
        `</tr>` +
        `<tr>` +
        `<th>规划速度：</th>` +
        `<td></td>` +
        `</tr>`);
}

function drawInfoList(d) {
    d3.select("#info-analyze-table")
        .html(
            `<tr>` +
            `<th>直线距离：</th>` +
            `<td>${Math.floor(d.realDistance * 100) / 100}</td>` +
            `</tr>` +
            `<tr>` +
            `<th>规划距离：</th>` +
            `<td>${Math.floor(d.referenceDistance * 100) / 100}</td>` +
            `</tr>` +
            `<tr>` +
            `<th>直线速度：</th>` +
            `<td>${Math.floor(d.realSpeed * 100) / 100}</td>` +
            `</tr>` +
            `<tr>` +
            `<th>规划速度：</th>` +
            `<td>${Math.floor(d.referenceSpeed * 100) / 100}</td>` +
            `</tr>`);
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