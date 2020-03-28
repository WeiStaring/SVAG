var svgTime = d3.select(".time-slider")
    .append("svg")
    .attr("height", "100%")
    .attr("width", "100%")
    .style("display", "block");

var xScale = d3.scaleTime()
    .domain([new Date(2018, 9, 3, 0, 0, 0), new Date(2018, 9, 3, 24, 0, 0)])//d3.extent(sumFlowData, d => d.time)
    .range([25, 1120]);
var yScale = d3.scaleLinear()
    .domain([0, d3.max(sumFlowData, d => d.volume)])
    .range([110, 0]);
var xAxis = d3.axisBottom(xScale).ticks(d3.timeHour.every(1)).tickFormat(d3.timeFormat("%H:%M"));
var yAxis = d3.axisLeft(yScale).ticks(5).tickSizeOuter(0).tickSize(2);

var area = d3.area()
    .x(function (d) { return xScale(d.time); })
    .y1(function (d) { return yScale(d.volume); })
    .y0(yScale(0));
var line = d3.line()
    .x(function (d) { return xScale(d.time); })
    .y(function (d) { return yScale(d.volume); });

svgTime.append("g")
    .attr("transform", "translate(0," + yScale.range()[0] + ")")
    .call(xAxis);
svgTime.append("g").attr("transform", "translate(" + xScale.range()[0] + ",0)")
    .call(yAxis);

function drawArea() {
    d3.selectAll(".time-area").remove();

    svgTime.append("g")
        .selectAll('path')
        .data([sumFlowData.slice(0, curTime)])
        .join('path')
        .attr("class", "time-area")
        .attr('d', line)
        .style("opacity", "0.8")
        .attr("fill", "none")
        .attr("stroke", "#40a9ff")
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round");
    svgTime.append("g")
        .selectAll('path')
        .data([sumFlowData.slice(0, curTime)])
        .join('path')
        .attr("class", "time-area")
        .attr('d', area)
        .style("opacity", "0.2")
        .attr("fill", "#40a9ff");
    svgTime.selectAll('circle')
        .data(sumFlowData.slice(0, curTime))
        .join('circle')
        .filter(d => {
            return d.time.getMinutes() == 0;
        })
        .attr("class", "time-area")
        .attr('cx', d => xScale(d.time))
        .attr('cy', d => yScale(d.volume))
        .attr('r', 2)
        .style("opacity", "1")
        .attr("fill", "#ff4d4f");
}

let lineWidth = xScale(xScale.domain()[0].setMinutes(5)) - xScale.range()[0];

svgTime.append("line")
    .attr("class", "time-line")
    .attr("x1", xScale.range()[0])
    .attr("y1", yScale.range()[0])
    .attr("x2", xScale.range()[0])
    .attr("y2", yScale.range()[1])//yScale(sumFlowData[curTime].volume)
    .style("opacity", "1")
    .attr("stroke", "#40a9ff")
    .attr("stroke-width", lineWidth * 1.5)
    .call(d3.drag()
        .on("drag", dragged));

function dragged(d) {
    if (d3.event.x < xScale.range()[0] || d3.event.x > xScale.range()[1])
        return;
    let t = xScale.invert(d3.event.x);
    if (t.getDay() > 3)
        return;
    curTime = t.getHours() * 12 + Math.floor(t.getMinutes() / 5);
    changeClock();
}

//--时钟--
function changeClock() {
    let tt = new Date(2018, 9, 3, Math.floor(curTime / 12), curTime % 12 * 5, 0);
    d3.select(".time-line")
        .attr("x1", xScale(tt))
        .attr("x2", xScale(tt));
    d3.select(".time-value").text(d3.timeFormat("%H:%M:%S")(tt));
    drawArea();
    changeMapData();
}

function addClock() {
    curTime = curTime + 1;
    if (curTime >= 288)
        curTime = 0;
    changeClock();
}

//--按钮事件--
//步长
var speed;
//播放暂停按钮
var clockBtn = d3.select(".clock-btn")
    .on("click", () => {
        if (d3.select(".clock-btn").classed("icon-play") == true) {
            d3.select(".clock-btn").classed("icon-play", false);
            d3.select(".clock-btn").classed("icon-pause", true);
            clock = setInterval(addClock, 1000 / speed);
        } else {
            d3.select(".clock-btn").classed("icon-play", true);
            d3.select(".clock-btn").classed("icon-pause", false);
            clearInterval(clock);
        }
    });
//减速按钮
var speedCutBtn = d3.select(".speed-cut-btn")
    .on("click", () => {
        if (d3.select(".clock-btn").classed("icon-play") == false) {
            speed = Math.max(1, Math.ceil(speed / 2));
            clearInterval(clock);
            clock = setInterval(addClock, 1000 / speed);
        }
    });
//加速按钮
var speedUpBtn = d3.select(".speed-up-btn")
    .on("click", () => {
        if (d3.select(".clock-btn").classed("icon-play") == false) {
            speed = Math.min(60, speed * 2);
            clearInterval(clock);
            clock = setInterval(addClock, 1000 / speed);
        }
    });

//绘制用户轨迹
function changeUserLine() {
    let personTrackNowData = personTrackData[curUser].features;

    d3.selectAll(".time-user-line").remove();

    personTrackNowData.forEach(d => {
        svgTime.append("line")
            .attr("class", "time-user-line")
            .attr("x1", xScale(d.properties.startTime))
            .attr("y1", yScale.range()[1] + 2)
            .attr("x2", xScale(d.properties.endTime))
            .attr("y2", yScale.range()[1] + 2)
            .style("opacity", "0.5")
            .attr("stroke", colType(d.properties.type))
            .attr("stroke-width", 2);
    });
}
//清除用户轨迹
function cleanUserLine() {
    d3.selectAll(".time-user-line").remove();
}

//--初始化时间轴参数--
function initTime() {
    curTime = 0;
    speed = 1;
    changeClock();
}

initTime();