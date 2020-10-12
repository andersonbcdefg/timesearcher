'use strict';

const params = {
	margin: 75,
	width: 600,
	height: 300
};

// Fetch and parse cable news dataset
const fetchData = async () => {
	const parseTime = d3.timeParse("%Y-%m")
	const raw_data = await d3.csv("top_100.csv")
	const cable = raw_data.map(entry => {
		return {
			name: entry.person,
			month: parseTime(entry.year_month),
			screen_time: Number(entry.screen_time_seconds)
		}
	});
	return cable;
}

const addButtons = (box_mgr) => {
	const body = d3.select("body")
	for (let action of ["CREATE", "RESIZE", "DELETE"]) {
		body.append("button")
			.text(action)
			.on("click", function() {
				let a = action;
				let s =
				box_mgr.state = action
			})
	}
}

// Draw outer SVG container and inner plot container
// RETURNS: D3 selections for outer & inner containers.
const makeContainer = (params) => {
	const outerContainer = d3.select("body")
		.append("svg")
		.attr("width", params.width + 2 * params.margin)
		.attr("height", params.height + 2 * params.margin)
		.attr("id", "outerContainer")

	const plotContainer = outerContainer.append("g")
		.attr('transform', `translate(${params.margin},${params.margin})`)
	    .attr('id', 'plotContainer');

	return [outerContainer, plotContainer]
}

// Make X and Y scales.
// RETURNS: X scale and Y scale.
const makeScales = (data, params) => {
	const xScale = d3.scaleTime()
		.domain(d3.extent(data, d => d.month))
		.range([0, params.width])

	const yScale = d3.scaleLinear()
		.domain(d3.extent(data, d => d.screen_time))
		.range([params.height, 0])

	return [xScale, yScale];
}

// Add X and Y axes to the plot.
// RETURNS: --
const addAxes = (plotContainer, xScale, yScale, params) => {
	plotContainer.append("g")
		.call(d3.axisLeft(yScale))

	plotContainer.append("g")
		.attr("transform", `translate(0, ${params.height})`)
		.call(d3.axisBottom(xScale))
}


// Class to manage all the filter boxes placed on the TimeSearcher
class BoxManager {
	constructor(outerContainer, plotContainer) {
		this.outer = outerContainer;
		this.plot = plotContainer;
		this.boxes = [];
		this.state = "CREATE";
	}

	createBox(e) {
		let box = {};
		// add attributes to box to track its "limits" in the data space?
		box.x0 = e.x
		box.y0 = e.y
		box.rect = this.plot.append("rect")
    		.attr("class", "filter-box")
    		.attr("x", box.x0 - params.margin)
    		.attr("y", box.y0 - params.margin)
    		.attr("width", 1)
    		.attr('height', 1)
    	this.boxes.push(box);
	}

	resizeNewBox(e) {
		let r = this.newestBox;
		r.rect.attr("x", Math.min(e.x, r.x0) - params.margin)
			.attr("y", Math.min(e.y, r.y0) - params.margin)
			.attr("width", Math.abs(e.x - r.x0))
			.attr("height", Math.abs(e.y - r.y0));
	}

	addNewBoxListeners(e, box_mgr) {
		let r = this.newestBox;
		r.rect.on("mouseover", function () {
			if (box_mgr.state == "DELETE") {
				d3.select(this)
					.attr("class", null).attr("class", "filter-box-hovered")
			}
		})
		.on("mouseout", function () {
			d3.select(this)
			.attr("class", null).attr("class", "filter-box")
		})
		.on("click", function () {
			if (box_mgr.state == "DELETE") {
				d3.select(this).node().remove();
				box_mgr.boxes = box_mgr.boxes.filter(b => {
					return b.rect.attr("class") !== "filter-box-hovered";
				});
			}
		});
	}

	get newestBox() {
		return this.boxes.slice(-1)[0];
	}
}


// Inspired by: https://bl.ocks.org/michaelwooley/b095fa7ce0e11d771dcb3f035fda1f07
const addDragFunc = (box_mgr) => {
    box_mgr.outer.call(d3.drag()
    	.subject((e) => { 
    		let m = d3.pointer(e);
    		return {x: m[0], y: m[1] }; 
    	})
    	.on("start", (e) => {
    		if (box_mgr.state == "CREATE") {
    			box_mgr.createBox(e);
    		}
    	})
    	.on("drag", (e) => {
    		if (box_mgr.state == "CREATE") {
    			box_mgr.resizeNewBox(e);
    		}
    	})
    	.on("end", (e) => {
    		if (box_mgr.state == "CREATE") {
    			box_mgr.addNewBoxListeners(e, box_mgr);
    		}
    	})
    )
}

/*

	const line = d3.line()
		.x(d => xScale(d.month))
		.y(d => yScale(d.screen_time))

	const grouped = Array.from(d3.group(cable, d => d.name))

	console.log(grouped)
	
	const lines = plotContainer.append("g")
			.attr("fill", "none")
	        .attr("stroke", "firebrick")
	        .attr("stroke-width", 1)
		.selectAll("path")
      	.data(grouped)
      	.join("path")
      		.attr("d", d => line(d[1]))
	lines.on("click", d => {
		console.log(this)
	})
*/

export { fetchData, addButtons, makeContainer, makeScales, 
	addAxes, BoxManager, addDragFunc };