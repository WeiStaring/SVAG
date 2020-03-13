//--创建时间范围--
var dataTime = d3.range(0, 25).map(function (d) {
    return new Date(2018, 10, 3, 0 + d, 0, 0);
});

//--创建时间轴--
var sliderTime = d3
    .sliderBottom()
    .min(d3.min(dataTime))
    .max(d3.max(dataTime))
    .step(1000)
    .width(1000)
    .tickFormat(d3.timeFormat('%H:%M'))
    .tickValues(dataTime)
    .displayFormat(d3.timeFormat('%H:%M:%S'))
    .default(new Date(2018, 10, 3, 0, 0, 0))
    .fill("#2196f3")//#2196f3
    .handle(
        d3.symbol()
            .type(d3.symbolCircle)
            .size(150)()
    )
    .on('onchange', val => {
        d3.select('.time-value').text(d3.timeFormat('%H:%M:%S')(val));
        var t = Math.ceil((val.getHours() * 60 + val.getMinutes()) / 5);
        //根据时间轴更新热力图和标签图
        getHeatmapData(t);
    });

//--绘制时间轴--
var gTime = d3
    .select('.time-slider')
    .append('svg')
    .attr('width', "100%")
    .attr('height', "100%")
    .append('g')
    .attr('transform', 'translate(30,30)');
gTime.call(sliderTime);


//--增加时钟--
function addClock() {
    let curTime = sliderTime.value();
    curTime.setMinutes(curTime.getMinutes() + 1);
    if (curTime > sliderTime.domain()[1]) {
        curTime = sliderTime.domain()[0];
    }
    sliderTime.value(curTime);
}

//--按钮事件--
//时钟
var clock;
//步长
var speed;
//播放暂停按钮
var clockBtn = d3.select(".clock-btn")
    .on("click", () => {
        if (d3.select(".play").classed("active") == true) {
            d3.select(".play").classed("active", false);
            d3.select(".pause").classed("active", true);
            clock = setInterval(addClock, 1000 / speed);
        } else {
            d3.select(".play").classed("active", true);
            d3.select(".pause").classed("active", false);
            clearInterval(clock);
        }
    });
//减速按钮
var speedCutBtn = d3.select(".speed-cut-btn")
    .on("click", () => {
        if (d3.select(".play").classed("active") == false) {
            speed = Math.max(1, Math.ceil(speed / 2));
            clearInterval(clock);
            clock = setInterval(addClock, 1000 / speed);
        }
    });
//加速按钮
var speedUpBtn = d3.select(".speed-up-btn")
    .on("click", () => {
        if (d3.select(".play").classed("active") == false) {
            speed = Math.min(60, speed * 2);
            clearInterval(clock);
            clock = setInterval(addClock, 1000 / speed);
        }
    });

//--初始化时间轴参数--
function initTime(){
    sliderTime.value(sliderTime.domain()[0]);
    speed = 1;
}

initTime();