//--创建地图--
//地图瓦片链接
var mbUrl = "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=" +
    "pk.eyJ1IjoiMTAwNDE2OTM1NyIsImEiOiJjano2eGtidjIwZjIwM2JxcWcyMjA4a2hsIn0.B097Ij8wdiLwDTXD9PHgwg";
var map = new L.Map('map', {
    center: [41.8, 123.4],
    zoom: 10,
    minZoom: 0,
    maxZoom: 20,
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

//--图层控制器--
var baseLayers = {
    "Grayscale": grayscale,
    "Streets": streets
};
var overlays = {
    "Heatmap": heatmapLayer,
    "Marker": markerLayer
};
L.control.layers(baseLayers, overlays).addTo(map);

//--读取数据--
//基站数据
var stationData;
//空间流量分布数据
var spaceFlowData;
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
function getHeatmapData(t) {
    //清除原有图层
    heatmapLayer.clearLayers();
    markerLayer.clearLayers();

    //获取t时刻的数据
    let nowData = [];
    for (j in spaceFlowData[t]) {
        nowData.push([stationData[j].latitude, stationData[j].longitude, spaceFlowData[t][j]]);
    }

    //添加热力图层
    let heatmap = new L.heatLayer(nowData, {
        minOpacity: 0.5,
        maxZoom: 18,
        max: 1.0,
        radius: 8,
        blur: 5,
        gradient: null
    });
    heatmapLayer.addLayer(heatmap);

    //添加标签图层
    let markers = new L.layerGroup(nowData.map(d => {
        const html = `<div class="popup">` +
            `<p>Lat:${d[0]}</p>` +
            `<p>Lng:${d[1]}</p>` +
            `<p>cnt:${d[2]}</p></div>`;
        return L.marker([d[0], d[1]])
            .bindPopup(html)
            .bindTooltip(html, { sticky: true });
    }));
    let markerCluster = L.markerClusterGroup({}).addLayer(markers);
    markerLayer.addLayer(markerCluster);
}


//--初始化地图参数--
function initMap() {
    //读取数据
    stationData = d3.csvParse(getData("data/newStation.csv"));
    spaceFlowData = getData("data/spaceFlowDataset.json");
}

initMap();