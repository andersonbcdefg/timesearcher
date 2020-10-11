'use strict';
import * as lib from "./lib.mjs"

const main = async (params) => {

	const cable = await lib.fetchData();
	let [outerContainer, plotContainer] = lib.makeContainer(params);
	let [xScale, yScale] = lib.makeScales(cable, params);
	lib.addAxes(plotContainer, xScale, yScale, params);

	const line = d3.line()
		.x(d => xScale(d.month))
		.y(d => yScale(d.screen_time))

	const grouped = Array.from(d3.group(cable, d => d.name))

	console.log(grouped)
	
	const lines = plotContainer.selectAll(".line")
		.data(grouped)
		.enter()
		.append("g")
			.attr("fill", "none")
	        .attr("stroke", "firebrick")
	        .attr("stroke-width", 1)
	
	lines.append("path")
		.attr("class", "path")
      	.attr("d", d => line(d[1]))
    
    var r = {};

    outerContainer.call(d3.drag()
    	.subject((e) => { 
    		let m = d3.pointer(e);
    		return {x: m[0], y: m[1] }; 
    	})
    	.on("start", (e, d) => {
    		let m = d3.pointer(e)
    		r.rect = plotContainer.append("rect")
    		.attr("stroke", "steelblue")
    		.attr("fill", "rgba(70, 130, 180, 0.5)")
    		.attr("x", m[0] - params.margin)
    		.attr("y", m[1] - params.margin)
    		.attr("width", 1)
    		.attr('height', 1)
    		r.x = m[0]
    		r.y = m[1]
    	})
    	.on("drag", (e, d) => {
    		r.rect.attr("width", e.x - r.x)
    		r.rect.attr("height", e.y - r.y)
    	})
    )
}

const params = {
	margin: 75,
	width: 600,
	height: 300
};

main(params)