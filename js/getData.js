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
    })
    return result;
}

//当前时刻
var curTime = 100;
//当前用户
var curUser;

//格子数据
var stationBoxesMap = getData("data/stationBoxesMap.json");

//空间流量分布数据
var spaceVolumeData = getData("data/spaceVolumeDataset.json");

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
}