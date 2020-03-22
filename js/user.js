var divTab = d3.select(".info-frame");

var tilte = divTab
    .style('text-align', 'center')
    .append('text')
    .style('display', 'inline-block')
    .style('font-size', 'small')
    .style('font-weight', 700)
    .text("user list");

var divName = divTab
    .append("div")
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

function initUserList(userData) {
    var li = divName
        .selectAll('div')
        .style('text-align', 'center')
        .data(userData)
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
        .style("background", (d, i) => {
            if (i == 0) {
                return "rgb(215, 228, 233)";
            } else return "white";
        })
        .on("click", function (d) {
            divName.selectAll("#liName").style('background', "white");
            d3.select(this).style('background', "rgb(215, 228, 233)");
            changeUserData(d);
        });
}

initUserList(Array.from(userList));