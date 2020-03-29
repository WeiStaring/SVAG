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
var grayscale = L.tileLayer(mbUrl, { id: 'mapbox/dark-v10', tileSize: 512, zoomOffset: -1 }).addTo(map);


//更新t时刻的地图所有图层
function changeMapData() {
    changeHeatmapData();
    changeTemporalFlowData();
    changePersonTrackData();
    changeTripStayData();
}

//删除所有图层
function delAllLayer() {
    cleanFlowLayer();
    map.removeLayer(flowLayerGroup);

    cleanModeLayer();
    map.removeLayer(modeLayerGroup);

    d3.select(".info-frame").html("");
}

//添加流量图层
function addFlowLayer() {
    delAllLayer();
    drawFlowLayer();
    map.addLayer(flowLayerGroup);
    changeMapData();
}

//增加出行驻留图层
function addTripLayer() {
    delAllLayer();
    drawTripStayLayer();
    map.addLayer(tripStayLayer);
    changeMapData();
}

//增加出行方式图层
function addModeLayer() {
    delAllLayer();
    drawModeLayer();
    map.addLayer(modeLayerGroup);
    changeMapData();
}

//--初始化地图参数--
function initMap() {
    initFlowLayer();
    initModeLayer();
}

initMap();