'use strict';

// Fetch and parse cable news dataset
const fetchData = async () => {
	const parseTime = d3.timeParse("%Y-%m")
	const res = await d3.csv("top_100.csv")
	const raw_cable = res.map(entry => {
		return {
			name: entry.person,
			month: parseTime(entry.year_month),
			screen_time: Number(entry.screen_time_seconds)
		}
	});
	const cable = Array.from(d3.group(raw_cable, d => d.name)).map(person => {
		return {
			name: person[0],
			values: person[1]
		}
	})
	return [cable, raw_cable];
}

// Add buttons to manage the state of the application
const addButtons = (box_mgr) => {
	const body = d3.select("body")
	for (let action of ["CREATE", "EDIT", "DELETE"]) {
		body.append("button")
			.text(action)
			.attr("id", action.toLowerCase())
			.on("click", function() {
				box_mgr.setState(action);
			})
	}
}

// Draw outer SVG container and inner plot container
// RETURNS: D3 selections for outer & inner containers.
const makeContainer = (params) => {
	const outerContainer = d3.select("body")
		.append("svg")
		.attr("width", params.width + 2 * params.marginX)
		.attr("height", params.height + 2 * params.marginY)
		.attr("id", "outerContainer")

	const plotContainer = outerContainer.append("g")
		.attr('transform', `translate(${params.marginX},${params.marginY})`)
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
		.domain(d3.extent(data, d => d.screen_time * 1.1))
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

const capitalize = (name) => {
	return name.split(" ").map(n => n.slice(0, 1).toUpperCase() + n.slice(1)).join(" ")
}

// Inspired by: https://bl.ocks.org/larsenmtl/e3b8b7c2ca4787f77d78f58d41c3da91
const makeLines = (plotContainer, xScale, yScale, grouped_cable, params) => {
	const lineGenerator = d3.line()
		.x(d => xScale(d.month))
		.y(d => yScale(d.screen_time))


	const lines = plotContainer.append("g")
		.attr("id", "series-group")
		.selectAll(".series")
		.data(grouped_cable, d => d.name)
		.enter()
		.append("g")
		.attr("class", "series")
			
	
	lines.append("path")
		.attr("class", "line")
      	.attr("d", d => lineGenerator(d.values))
      	.attr("fill", "none")
        .attr("stroke", "firebrick")
        .attr("stroke-width", 1.5)


    lines.append("text")
    	.attr("class", "line-label")
    	.text(d => capitalize(d.name))
    	.attr("y", d => yScale(d.values[d.values.length - 1].screen_time))
    	.attr("x", params.width + 5)
    	.attr("font-size", 10)
    	.on("mouseover", function(e) {
    		d3.select(this).attr("font-weight", "bold")
    		d3.select(this.parentNode)
    			.raise()
    			.select("path")
    			.attr("stroke-width", 2.5)
    			.attr("stroke", "#EEB110")
    	})
    	.on("mouseout", function(e) {
    		d3.select(this).attr("font-weight", "normal")
    		d3.select(this.parentNode)
    			.select("path")
    			.attr("stroke-width", 1.5)
    			.attr("stroke", "firebrick")
    	})
}

const filterSeries = (d, filts) => {
	let values = d.values;
	for (let filt of filts) {
		let xrange = values.filter(d => {
			return (d.month >= filt.xmin && d.month <= filt.xmax);
		});
		let yvals = xrange.map(d => d.screen_time);
		if (Math.max(...yvals) > filt.ymax || Math.min(...yvals) < filt.ymin) return false;
	}
	return true;
}

const updateLines = (filts) => {
	if (filts.length == 0) {
		let series = d3.selectAll(".series")
		series.select(".line")
			.attr("stroke", "firebrick")
		series.select(".line-label")
			.attr("fill", "black")
			.on("mouseover", function(e) {
	    		d3.select(this).attr("font-weight", "bold")
	    		d3.select(this.parentNode)
	    			.raise()
	    			.select("path")
	    			.attr("stroke-width", 2.5)
	    			.attr("stroke", "#EEB110")
	    	})
	    	.on("mouseout", function(e) {
	    		d3.select(this).attr("font-weight", "normal")
	    		d3.select(this.parentNode)
	    			.select("path")
	    			.attr("stroke-width", 1.5)
	    			.attr("stroke", "firebrick")
	    	})
	} else {
		let series = d3.selectAll(".series")
		series.select(".line")
			.attr("stroke", "grey")
		series.select(".line-label")
			.attr("fill", "rgba(180, 180, 180, 0.5)")
			.on("mouseover", null)
			.on("mouseout", null)
		
		let filtered = series.filter(d => filterSeries(d, filts))
		
		filtered.raise()
			.select(".line")
			.attr("stroke", "firebrick")

		filtered.select(".line-label")
			.attr("fill", "black")
			.on("mouseover", function(e) {
	    		d3.select(this).attr("font-weight", "bold")
	    		d3.select(this.parentNode)
	    			.raise()
	    			.select("path")
	    			.attr("stroke-width", 2.5)
	    			.attr("stroke", "#EEB110")
	    	})
	    	.on("mouseout", function(e) {
	    		d3.select(this).attr("font-weight", "normal")
	    		d3.select(this.parentNode)
	    			.select("path")
	    			.attr("stroke-width", 1.5)
	    			.attr("stroke", "firebrick")
	    	})
	}
	
}


// Class to manage all the filter boxes placed on the TimeSearcher
class BoxManager {
	constructor(outerContainer, plotContainer, xScale, yScale, params) {
		this.outer = outerContainer;
		this.plot = plotContainer;
		this.xScale = xScale;
		this.yScale = yScale;
		this.boxes = [];
		this.params = params;
		this.state = "CREATE";
	}

	createBox(e) {
		let box = {};
		// X and Y relative to the plot container, not outer container
		box.x0 = e.x - this.params.marginX;
		box.y0 = e.y - this.params.marginY;
		box.x1 = box.x0 + 1;
		box.y1 = box.y0 + 1;
		box.rect = this.plot.append("rect")
    		.attr("class", "filter-box")
    		.attr("x", box.x0)
    		.attr("y", box.y0)
    		.attr("width", 1)
    		.attr('height', 1)
    	box.filt = {
    		xmin: this.xScale.invert(box.x0),
    		xmax: this.xScale.invert(box.x1),
    		ymin: this.yScale.invert(box.y1),
    		ymax: this.yScale.invert(box.y0)
    	}
    	this.boxes.push(box);
	}

	resizeNewBox(e) {
		let box = this.newestBox;
		box.x1 = Math.min(Math.max(e.x - this.params.marginX, 0), this.params.width);
		box.y1 = Math.min(Math.max(e.y - this.params.marginY, 0), this.params.height);
		box.rect.attr("x", Math.min(box.x0, box.x1))
			.attr("y", Math.min(box.y0, box.y1))
			.attr("width", Math.abs(box.x0 - box.x1))
			.attr("height", Math.abs(box.y0 - box.y1));
		box.filt = {
    		xmin: this.xScale.invert(Math.min(box.x0, box.x1)),
    		xmax: this.xScale.invert(Math.max(box.x0, box.x1)),
    		ymin: this.yScale.invert(Math.max(box.y0, box.y1)),
    		ymax: this.yScale.invert(Math.min(box.y0, box.y1))
    	}
    	updateLines(this.filters);
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
				updateLines(box_mgr.filters);
				if (box_mgr.boxes.length == 0) {
					box_mgr.setState("CREATE");
				}
			}
		});
	}

	setState(state) {
		this.state = state;
		d3.selectAll("button").attr("class", "null")
		d3.select(`#${state.toLowerCase()}`).attr("class", "active")
		d3.select("#message").text(state !== "DELETE" ? `Click and drag to ${state.toLowerCase()} a filter!`:"Click on a filter to delete it.");
	}

	get newestBox() {
		return this.boxes.slice(-1)[0];
	}

	get filters() {
		return this.boxes.map(b => b.filt);
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
    			console.log(box_mgr.newestBox.filt)
    		}
    	})
    )
}


export { fetchData, addButtons, makeContainer, makeScales, 
	addAxes, BoxManager, addDragFunc, makeLines, updateLines };