//--读取数据--

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
    });
    return result;
}

//当前时刻
var curTime = 100;
//当前用户
var curUser="460000095005571676";

//格子数据
var stationBoxesMap = getData("data/stationBoxesMap.json");

var stayData = getData("data/spaceStayDataset.json");

var tripData = getData("data/spaceTripDataset.json");
//空间流量分布数据
var spaceVolumeData = getData("data/spaceVolumeDataset.json");
// var spaceVolumeData = stayData;
//基站-时间流量分布数据
var temporalFlowData = {};
//总-时间流量数据
var sumFlowData = [];
for (plot in stationBoxesMap) {
    temporalFlowData[plot] = new Array(24).fill(0);
}
for (t in spaceVolumeData) {
    sumFlowData[t] = {
        timeSlice: t,
        time: new Date(2018, 9, 3, Math.floor(t / 12), t % 12 * 5, 0),
        volume: 0,
    };
    let hour = Math.floor(t / 12);
    for (plot in spaceVolumeData[t]) {
        temporalFlowData[plot][hour] += spaceVolumeData[t][plot];
        sumFlowData[t].volume += spaceVolumeData[t][plot];
    }
    // sumFlowData[t].volume = ~~(sumFlowData[t].volume/12);
}


//个人轨迹原始数据
var personTrackOriData = d3.csvParse(getData("data/newTripModeResult.csv"));
//个人轨迹数据
var personTrackData = {};
//用户表
var userList = new Set();
//速度范围
var speedDomain = [Infinity, -1];

for (i in personTrackOriData) {
    if (i == "columns")
        continue;
    let d = personTrackOriData[i];

    //更新用户列表
    if (!userList.has(d.imsi)) {
        userList.add(d.imsi);
        personTrackData[d.imsi] = {
            "id": d.imsi,
            "type": "FeatureCollection",
            "features": []
        };
    }

    //更新速度范围
    speedDomain[0] = Math.min(speedDomain[0], d.real_speed);
    speedDomain[1] = Math.max(speedDomain[1], d.real_speed);

    //更新用户轨迹
    let tmpLine = {
        "type": "Feature",
        "properties": {
            "startTime": new Date(parseInt(d.start)),
            "endTime": new Date(parseInt(d.end)),
            "startPlot": d.startPlot,
            "endPlot": d.endPlot,
            "startPoint": [d.startlatitude, d.startlongitude],
            "endPoint": [d.endlatitude, d.endlongitude],
            "type": d.type,
            "realDistance": L.latLng(d.startlatitude, d.startlongitude)
                .distanceTo(L.latLng(d.endlatitude, d.endlongitude)),
            "referenceDistance": d.distance,
            "realTime": d.myTime,
            "referenceTime": d.duration,
            "realSpeed": d.real_speed,
            "referenceSpeed": d.speed,
        },
        "geometry": {
            "type": "LineString",
            "coordinates": [[d.startlatitude, d.startlongitude],
            [d.endlatitude, d.endlongitude]]
        }
    };
    personTrackData[d.imsi]["features"].push(tmpLine);

};

