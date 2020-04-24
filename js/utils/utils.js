function clearInfoUp() {
    d3.select("#info_frame_up").selectAll('svg').remove();
    d3.select("#info_frame_up").selectAll('div').remove();
    d3.select("#info_frame_up").selectAll('text').remove();
}

function cleanInfoDown() {
    d3.select('#info_frame_down').selectAll('svg').remove();
    d3.select('#info_frame_down').selectAll("select").remove();
    d3.select("#info_frame_down").selectAll('text').remove();
}